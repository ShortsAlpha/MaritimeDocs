'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
        await db.studentDocument.delete({
            where: { id: docId }
        });
        revalidatePath(`/admin/students/${studentId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to delete document" };
    }
}

export async function getDownloadUrl(fileUrl: string) {
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

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${key.split('/').pop()}"`,
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        return { success: true, url: signedUrl };
    } catch (error) {
        console.error("Download URL generation error:", error);
        return { success: false, message: "Failed to generate download link" };
    }
}
