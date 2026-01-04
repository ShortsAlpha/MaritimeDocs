import { S3Client, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

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

export async function renameFolderInR2(oldFolder: string, newFolder: string) {
    try {
        if (!oldFolder || !newFolder || oldFolder === newFolder) return false;

        console.log(`Renaming R2 folder from ${oldFolder} to ${newFolder}`);

        // 1. List all objects in old folder
        let continuationToken: string | undefined = undefined;
        do {
            const listCmd: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET_NAME,
                Prefix: oldFolder,
                ContinuationToken: continuationToken,
            });
            const listRes: ListObjectsV2CommandOutput = await r2.send(listCmd);

            if (listRes.Contents) {
                // 2. Copy each object to new folder and delete old
                await Promise.all(listRes.Contents.map(async (obj) => {
                    if (!obj.Key) return;

                    const oldKey = obj.Key;
                    const newKey = oldKey.replace(oldFolder, newFolder);

                    console.log(`Moving ${oldKey} -> ${newKey}`);

                    // CopySource must be URL-encoded, but NOT the slashes that separate bucket and key if using full path style
                    // However, we are using Bucket-relative source usually. R2/S3 is weird with CopySource.
                    // Best practice: Bucket/Key, where Key is encoded.
                    const encodedKey = oldKey.split('/').map(encodeURIComponent).join('/');
                    const copySource = `${process.env.R2_BUCKET_NAME}/${encodedKey}`;

                    // Copy
                    await r2.send(new CopyObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        CopySource: copySource,
                        Key: newKey,
                    }));

                    // Delete old
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: oldKey,
                    }));
                }));
            }

            continuationToken = listRes.NextContinuationToken;
        } while (continuationToken);

        return true;
    } catch (error) {
        console.error("R2 Rename Error:", error);
        // Don't throw, just log. We might want to separate this logic to avoid blocking DB updates if R2 fails
        return false;
    }
}
