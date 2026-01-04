import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function deleteFileFromR2(fileUrlOrKey: string) {
    try {
        if (!fileUrlOrKey) return false;

        // Extract key if full URL
        const publicUrl = process.env.R2_PUBLIC_URL || "";
        let key = fileUrlOrKey;

        if (publicUrl && fileUrlOrKey.startsWith(publicUrl)) {
            key = fileUrlOrKey.replace(`${publicUrl}/`, "");
        } else if (fileUrlOrKey.startsWith("http")) {
            // Try to parse basic path
            try {
                const urlObj = new URL(fileUrlOrKey);
                // Remove leading slash
                key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            } catch (e) { }
        }

        // Ensure key is decoded (e.g. %20 -> space) to match S3 key
        key = decodeURIComponent(key);

        console.log(`Deleting file from R2: ${key}`);

        await r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        }));
        return true;
    } catch (error) {
        console.error("R2 Deletion Error:", error);
        return false;
    }
}
