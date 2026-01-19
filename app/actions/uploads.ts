'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { r2, deleteFileFromR2 } from "@/lib/r2";
export { deleteFileFromR2 }; // Re-export for client usage if needed via server action wrapper, though typically direct import is better. 
// However, since it's used in a client component, and it's a server action file... wait.
// deleteFileFromR2 is likely a server-side only function (utilizing aws-sdk). 
// If instructor-docs-tab is a client component, it CANNOT import deleteFileFromR2 directly if it has Node.js dependencies.
// It seems deleteFileFromR2 IS a server utility.
// instructor-docs-tab is importing it.
// If I export it here, and this file is 'use server', next.js might handle it as a server action if it's async.
// But deleteFileFromR2 in lib/r2 is just a function.
// Let's check lib/r2 again.
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export async function getUploadUrl(filename: string, fileType: string, folder: string) {
    try {
        const fileExtension = filename.split('.').pop();
        const key = `${folder}/${uuidv4()}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        return { success: true, uploadUrl, key };
    } catch (error) {
        console.error("Upload URL Error:", error);
        throw new Error("Failed to get upload URL");
    }
}

export async function uploadStudentDocument(
    studentId: string,
    docTypeId: string,
    fileUrl: string,
    fileType: string,
    expiryDate?: string
) {
    if (!studentId || !docTypeId || !fileUrl) {
        throw new Error("Missing required fields");
    }

    try {
        await db.studentDocument.create({
            data: {
                studentId,
                documentTypeId: docTypeId,
                fileUrl,
                fileType,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
            }
        });

        revalidatePath(`/admin/students/${studentId}`);
        return { success: true };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, message: "Failed to save document record" };
    }
}

export async function deleteStudentDocument(docId: string, studentId: string) {
    try {
        // 1. Find the document to get the file URL
        const doc = await db.studentDocument.findUnique({
            where: { id: docId }
        });

        if (doc && doc.fileUrl) {
            // 2. Delete from R2
            await deleteFileFromR2(doc.fileUrl);
        }

        // 3. Delete from DB
        await db.studentDocument.delete({
            where: { id: docId }
        });

        revalidatePath(`/admin/students/${studentId}`);
        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, message: "Failed to delete document" };
    }
}

export async function getDownloadUrl(fileUrl: string, options?: { inline?: boolean }) {
    try {
        if (!fileUrl) throw new Error("No file URL provided");

        // Extract key from URL
        // Assumes fileUrl is `${process.env.R2_PUBLIC_URL}/${key}`
        const publicUrl = process.env.R2_PUBLIC_URL || "";
        let key = fileUrl;

        if (publicUrl && fileUrl.startsWith(publicUrl)) {
            key = fileUrl.replace(`${publicUrl}/`, "");
        } else {
            // Fallback: try to guess key from path if standard URL
            try {
                const urlObj = new URL(fileUrl);
                key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            } catch (e) {
                // If not a valid URL, assume it might be the key itself or fail
            }
        }

        // Ensure key is decoded (e.g. %20 -> space) to match S3 key stored
        key = decodeURIComponent(key);

        const disposition = options?.inline ? 'inline' : `attachment; filename="${key.split('/').pop()}"`;

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: disposition,
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        return { success: true, url: signedUrl };
    } catch (error) {
        console.error("Download URL generation error:", error);
        return { success: false, message: "Failed to generate download link" };
    }
}
