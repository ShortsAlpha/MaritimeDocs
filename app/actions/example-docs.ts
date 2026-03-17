import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const bucketName = "student-management-system"; // Use hardcoded verified name

export async function getExampleDocuments() {
    try {
        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: "mail-example-documents/",
        });

        const response = await s3Client.send(command);
        
        if (!response.Contents) return [];

        // Return the clean file names and their keys
        return response.Contents
            .filter(item => item.Key && item.Key !== "mail-example-documents/") // exclude the folder itself
            .map(item => {
                const parts = item.Key!.split('/');
                const fileName = parts[parts.length - 1];
                return {
                    name: fileName,
                    key: item.Key!
                };
            });
    } catch (error) {
        console.error("Error fetching example documents:", error);
        return [];
    }
}
