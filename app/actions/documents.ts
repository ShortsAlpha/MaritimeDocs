'use server';

// Force rebuild
import { db } from "@/lib/db";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";
import { deleteFileFromR2 } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";

// ... existing code

import { currentUser } from "@clerk/nextjs/server"
import { logActivity } from "@/lib/logger";

// ... existing imports ...

export async function getDocumentPreviewUrl(docId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const doc = await db.studentDocument.findUnique({ where: { id: docId } });
        // ...
        if (!doc) return { success: false, message: "Document not found" };

        let key = "";
        const publicUrl = process.env.R2_PUBLIC_URL || "";

        try {
            // Robust key extraction using URL parsing
            const fileUrlObj = new URL(doc.fileUrl);
            key = fileUrlObj.pathname;
            
            // Remove leading slash which pathname includes
            if (key.startsWith('/')) {
                key = key.substring(1);
            }
        } catch (e) {
            // Fallback for relative or malformed URLs
            if (doc.fileUrl.startsWith(publicUrl)) {
                // Handle possible double slashes
                const prefix = publicUrl.endsWith('/') ? publicUrl : publicUrl + '/';
                key = doc.fileUrl.replace(prefix, "");
            } else if (doc.fileUrl.includes("students/")) {
                key = doc.fileUrl.substring(doc.fileUrl.indexOf("students/"));
            }
        }

        if (!key) return { success: false, message: "Invalid file key" };

        key = decodeURIComponent(key);

        try {
            const { HeadObjectCommand, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
            
            try {
                await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
            } catch (headError: any) {
                if (headError.name === "NotFound" || headError.name === "NoSuchKey") {
                    console.log(`[R2] Key not found: ${key}. Attempting fuzzy folder search...`);
                    // The exact key from DB failed. 
                    // This happens due to broken data migrations (e.g., spaces converted to _ in DB but not in S3)
                    // Let's do a fallback search in the same folder.
                    
                    const folderPath = key.substring(0, key.lastIndexOf('/') + 1); // e.g., students/kavindu.../documents/
                    
                    const listRes = await r2.send(new ListObjectsV2Command({
                        Bucket: R2_BUCKET_NAME,
                        Prefix: folderPath
                    }));
                    
                    if (listRes.Contents && doc.title) {
                        // Find a file whose key ends with the document title (ignoring URL encoding differences)
                        const sanitizedDbTitle = doc.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                        
                        const matchedObj = listRes.Contents.find(obj => {
                            if (!obj.Key) return false;
                            const S3FileName = obj.Key.split('/').pop() || "";
                            const sanitizedS3Title = S3FileName.toLowerCase().replace(/[^a-z0-9]/g, '');
                            // Check if the S3 filename closely matches the DB title
                            return sanitizedS3Title.includes(sanitizedDbTitle) || sanitizedDbTitle.includes(sanitizedS3Title);
                        });

                        if (matchedObj && matchedObj.Key) {
                            console.log(`[R2] Fuzzy Match Found! Remapped ${key} to ${matchedObj.Key}`);
                            key = matchedObj.Key; 
                            
                            const safeKeyUrl = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
                            
                            // Optionally async update the DB to fix it forever so it doesn't do ListObjects next time
                            db.studentDocument.update({
                                where: { id: doc.id },
                                data: { fileUrl: `${process.env.R2_PUBLIC_URL}/${safeKeyUrl}` }
                            }).catch(e => console.error("Auto DB repair failed", e));
                        } else {
                            throw new Error("File truly missing from S3 storage.");
                        }
                    } else {
                        throw new Error("Folder missing or title unknown.");
                    }
                } else {
                    throw headError;
                }
            }

            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                ResponseContentDisposition: 'inline'
            });

            const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
            return { success: true, url: signedUrl };

        } catch (error) {
            console.error("Preview URL Error:", error);
            return { success: false, message: "File not found in storage. It may have been deleted or corrupted." };
        }
    } catch (error) {
        console.error("Master Preview Error:", error);
        return { success: false, message: "Failed to generate preview" };
    }
}
import { sendDocumentRejectionEmail } from "./email";

export async function uploadPendingDocument(formData: FormData) {
    // ... Public Token Based ... 
    try {
        const token = formData.get("token") as string;
        const file = formData.get("file") as File;
        const documentTypeId = formData.get("documentTypeId") as string;

        if (!token || !file || !documentTypeId) throw new Error("Missing fields");

        // 1. Validate Token
        const student = await db.student.findUnique({
            where: { uploadToken: token }
        });

        if (!student) throw new Error("Invalid token");
        if (student.uploadTokenExpiry && student.uploadTokenExpiry < new Date()) {
            throw new Error("Token expired");
        }

        // 2. Upload to R2
        const buffer = Buffer.from(await file.arrayBuffer());
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `students/${student.id}/documents/${Date.now()}-${safeName}`;

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        // 3. Create Document Record (Status: PENDING)
        // 3. Create Document Record (Status: PENDING)
        await db.studentDocument.create({
            data: {
                studentId: student.id,
                documentTypeId,
                fileUrl: publicUrl,
                fileType: file.type.split('/')[1] || 'file',
                title: file.name,
                status: 'PENDING'
            }
        });

        // Activity Log
        await logActivity({
            action: 'UPLOAD',
            title: `Student uploaded: ${file.name}`,
            userId: student.id,
            userEmail: student.email || "Unknown",
            metadata: { fileUrl: publicUrl, size: file.size }
        });

        return { success: true };

    } catch (error) {
        console.error("Upload Pending Doc Error:", error);
        return { success: false, message: "Upload failed" };
    }
}

export async function generatePresignedUploadUrl(prefix: string, fileName: string, fileType: string) {
    try {
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${prefix}/${Date.now()}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        // Generate signed URL valid for 30 minutes
        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 1800 });
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        return { success: true, signedUrl, key, publicUrl };
    } catch (error) {
        console.error("Presigned URL error:", error);
        return { success: false, message: "Failed to generate upload URL" };
    }
}

export async function saveStudentDocumentRecord(
    token: string,
    documentTypeId: string,
    fileUrl: string,
    fileType: string,
    title: string,
    fileSize: number
) {
    try {
        const student = await db.student.findUnique({ where: { uploadToken: token } });
        if (!student) throw new Error("Invalid token");
        if (student.uploadTokenExpiry && student.uploadTokenExpiry < new Date()) {
            throw new Error("Token expired");
        }

        await db.studentDocument.create({
            data: {
                studentId: student.id,
                documentTypeId,
                fileUrl,
                fileType: fileType.split('/')[1] || 'file',
                title,
                status: 'PENDING'
            }
        });

        await logActivity({
            action: 'UPLOAD',
            title: `Student uploaded: ${title}`,
            userId: student.id,
            userEmail: student.email || "Unknown",
            metadata: { fileUrl, size: fileSize }
        });

        return { success: true };
    } catch (error) {
        console.error("Save Student Doc Error:", error);
        return { success: false, message: "Failed to save document record" };
    }
}

export async function saveAdminDocumentRecord(
    studentId: string,
    documentTypeId: string,
    fileUrl: string,
    fileType: string,
    title: string,
    fileSize: number
) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student) throw new Error("Student not found");

        await db.studentDocument.create({
            data: {
                studentId,
                documentTypeId,
                fileUrl,
                fileType: fileType.split('/')[1] || 'file',
                title,
                status: 'APPROVED'
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        await logActivity({
            action: 'UPLOAD',
            title: `Admin uploaded: ${title}`,
            description: `Uploaded for student ${student.fullName}`,
            userId: user.id,
            userEmail: user.emailAddresses[0]?.emailAddress || "Admin",
            metadata: { fileUrl, size: fileSize, studentId }
        });

        return { success: true };
    } catch (error) {
        console.error("Save Admin Doc Error:", error);
        return { success: false, message: "Failed to save document record" };
    }
}

export async function getStudentByToken(token: string) {
    const student = await db.student.findUnique({
        where: { uploadToken: token },
        include: {
            documents: {
                include: { documentType: true },
                orderBy: { createdAt: 'desc' }
            },
            courses: {
                include: {
                    requiredDocuments: {
                        include: { documentType: true }
                    }
                }
            }
        }
    });

    if (!student) return null;
    if (student.uploadTokenExpiry && student.uploadTokenExpiry < new Date()) return null;

    return student;
}

export async function getPublicDocumentTypes() {
    return await db.documentType.findMany({
        where: { isRequired: true },
    });
}

/** Returns deduplicated document types required by the student's enrolled courses */
export async function getPublicDocumentTypesForStudent(studentId: string) {
    // Get all courses the student is enrolled in, with their required documents
    const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
            courses: {
                include: {
                    requiredDocuments: {
                        include: { documentType: true }
                    }
                }
            }
        }
    });

    if (!student || student.courses.length === 0) {
        // Fallback to global required if student has no courses
        return await db.documentType.findMany({
            where: { isRequired: true },
        });
    }

    // Collect all document types from all enrolled courses, deduplicated
    const docTypeMap = new Map<string, any>();
    for (const course of student.courses) {
        for (const rd of course.requiredDocuments) {
            if (!docTypeMap.has(rd.documentType.id)) {
                docTypeMap.set(rd.documentType.id, rd.documentType);
            }
        }
    }

    return Array.from(docTypeMap.values());
}

export async function approveDocument(docId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        await db.studentDocument.update({
            where: { id: docId },
            data: { status: 'APPROVED' }
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to approve" };
    }
}

export async function rejectDocument(docId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const doc = await db.studentDocument.findUnique({ where: { id: docId } });
        if (!doc) throw new Error("Doc not found");

        await db.studentDocument.update({
            where: { id: docId },
            data: { status: 'REJECTED' }
        });

        // Send Email
        await sendDocumentRejectionEmail(doc.studentId, doc.title || "Document");

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to reject" };
    }
}

export async function uploadExamNoteFile(formData: FormData) {
    console.log("Starting uploadExamNoteFile...");
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const file = formData.get("file") as File;
        const studentId = formData.get("studentId") as string;

        console.log(`Upload request for student: ${studentId}, File: ${file?.name}, Size: ${file?.size}, Type: ${file?.type}`);

        if (!file || !studentId) {
            console.error("Missing file or studentId");
            return { success: false, message: "Missing file or studentId" };
        }

        console.log("Reading file buffer...");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log("Buffer created:", buffer.byteLength);

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `students/${studentId}/exam-notes/${Date.now()}-${safeName}`;
        console.log("Generated Key:", key);

        console.log("Uploading to R2...");
        if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME not set");

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));
        console.log("Upload successful");

        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://student.xoneacademy.com";
        const internalUrl = `${appBaseUrl}/download?key=${encodeURIComponent(key)}`;
        console.log("Interstitial Download Page URL generated:", internalUrl);

        return { success: true, url: internalUrl };
    } catch (error: any) {
        console.error("Upload Exam Note Logic Error (Catch Block):", error);
        return { success: false, message: error.message || "Unknown error" };
    }
}

export async function deleteStudentDocument(docId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const doc = await db.studentDocument.findUnique({ where: { id: docId } });
        if (!doc) throw new Error("Document not found");

        // Delete from R2
        try {
            let key = "";
            try {
                const urlObj = new URL(doc.fileUrl);
                key = urlObj.pathname;
                if (key.startsWith('/')) key = key.substring(1);
            } catch {
                const publicUrl = process.env.R2_PUBLIC_URL || "";
                if (doc.fileUrl.startsWith(publicUrl)) {
                    const prefix = publicUrl.endsWith('/') ? publicUrl : publicUrl + '/';
                    key = doc.fileUrl.replace(prefix, "");
                }
            }

            if (key) {
                // Decode URI component just like in getDocumentPreviewUrl
                await deleteFileFromR2(decodeURIComponent(key));
            }
        } catch (r2Error) {
            console.error("Failed to delete from R2, proceeding with DB delete:", r2Error);
        }

        // ... (previous code)

        await db.studentDocument.delete({ where: { id: docId } });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Delete Doc Error:", error);
        return { success: false, message: "Failed to delete" };
    }
}

export async function uploadStudentDocumentByAdmin(formData: FormData) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const studentId = formData.get("studentId") as string;
        const file = formData.get("file") as File;
        const documentTypeId = formData.get("documentTypeId") as string;

        if (!studentId || !file || !documentTypeId) throw new Error("Missing fields");

        const student = await db.student.findUnique({
            where: { id: studentId }
        });

        if (!student) throw new Error("Student not found");

        // Upload to R2
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `students/${student.id}/documents/admin-upload/${Date.now()}-${safeName}`;

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        // Create Document Record (Status: APPROVED because Admin uploaded it)
        await db.studentDocument.create({
            data: {
                studentId: student.id,
                documentTypeId,
                fileUrl: publicUrl,
                fileType: file.type.split('/')[1] || 'file',
                title: file.name,
                status: 'APPROVED'
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        // Activity Log
        await logActivity({
            action: 'UPLOAD',
            title: `Admin uploaded: ${file.name}`,
            description: `Uploaded for student ${student.fullName}`,
            userId: user.id,
            userEmail: user.emailAddresses[0]?.emailAddress || "Admin",
            metadata: { fileUrl: publicUrl, size: file.size, studentId: student.id }
        });

        return { success: true };

    } catch (error) {
        console.error("Admin Upload Doc Error:", error);
        return { success: false, message: "Upload failed" };
    }
}
