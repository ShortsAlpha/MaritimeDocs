'use server';

// Force rebuild
import { db } from "@/lib/db";
import { r2 } from "@/lib/r2";
import { deleteFileFromR2 } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";

// ... existing code

export async function getDocumentPreviewUrl(docId: string) {
    try {
        const doc = await db.studentDocument.findUnique({ where: { id: docId } });
        if (!doc) return { success: false, message: "Document not found" };

        let key = "";
        const publicUrl = process.env.R2_PUBLIC_URL || "";

        if (doc.fileUrl.startsWith(publicUrl)) {
            key = doc.fileUrl.replace(publicUrl + "/", "");
        } else {
            // Fallback if URL stored differently (e.g. full path without matching public URL root)
            // Typically R2 keys in your app were `students/${studentId}/...`
            // If we can't parse it, we might fail or try to use the raw value if it looked like a key.
            // But let's assume standard flow.

            // Attempt to extract from last known logic or just split by "/"
            // A simplistic fallback: everything after "students/"
            if (doc.fileUrl.includes("students/")) {
                key = doc.fileUrl.substring(doc.fileUrl.indexOf("students/"));
            }
        }

        if (!key) return { success: false, message: "Invalid file key" };

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: 'inline' // Forces browser to display
        });

        // 1 hour expiry
        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        return { success: true, url: signedUrl };
    } catch (error) {
        console.error("Preview URL Error:", error);
        return { success: false, message: "Failed to generate preview" };
    }
}
import { sendDocumentRejectionEmail } from "./email";

export async function uploadPendingDocument(formData: FormData) {
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
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

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

        return { success: true };

    } catch (error) {
        console.error("Upload Pending Doc Error:", error);
        return { success: false, message: "Upload failed" };
    }
}

export async function getStudentByToken(token: string) {
    const student = await db.student.findUnique({
        where: { uploadToken: token },
        include: {
            documents: {
                include: { documentType: true },
                orderBy: { createdAt: 'desc' }
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

export async function approveDocument(docId: string) {
    try {
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
        if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME not set");

        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));
        console.log("Upload successful");

        console.log("Generating signed URL...");
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: 'attachment' // Force download
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 604800 }); // 7 Days
        console.log("Signed URL generated:", signedUrl.substring(0, 50) + "...");

        return { success: true, url: signedUrl };
    } catch (error: any) {
        console.error("Upload Exam Note Logic Error (Catch Block):", error);
        return { success: false, message: error.message || "Unknown error" };
    }
}

export async function deleteStudentDocument(docId: string) {
    try {
        const doc = await db.studentDocument.findUnique({ where: { id: docId } });
        if (!doc) throw new Error("Document not found");

        // Delete from R2
        try {
            // Extract key from URL or just try to delete if we stored the key. 
            // Since we store full URL, we need to parse it or just rely on DB delete + orphan cleanup (if we had it).
            // NOTE: The current upload uses a specific key structure. 
            // We'll try to extract the key from the fileUrl if it matches our R2_PUBLIC_URL pattern.
            // URL: process.env.R2_PUBLIC_URL + "/" + key
            // Key: students/{studentId}/documents/...

            const publicUrl = process.env.R2_PUBLIC_URL || "";
            if (doc.fileUrl.startsWith(publicUrl)) {
                const key = doc.fileUrl.replace(publicUrl + "/", "");
                await deleteFileFromR2(key);
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
            Bucket: process.env.R2_BUCKET_NAME,
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
        return { success: true };

    } catch (error) {
        console.error("Admin Upload Doc Error:", error);
        return { success: false, message: "Upload failed" };
    }
}
