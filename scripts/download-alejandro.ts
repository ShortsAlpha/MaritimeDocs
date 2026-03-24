import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';

const bucketName = "student-management-system"; 

async function main() {
    const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
    });

    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "", // Search everywhere just in case
    });

    const response = await s3Client.send(listCommand);
    const fileItem = response.Contents?.find(item => item.Key && item.Key.toLowerCase().includes('alejandro'));
    
    if (!fileItem) {
        console.error("Alejandro file not found!");
        console.log("Available files:", response.Contents?.map(c => c.Key).join(', '));
        return;
    }

    console.log(`Downloading: ${fileItem.Key}`);

    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileItem.Key,
    });

    const getResponse = await s3Client.send(getCommand);
    const byteArray = await getResponse.Body?.transformToByteArray();

    if (byteArray) {
        fs.writeFileSync(path.resolve(process.cwd(), "certificate-2-alejandro.pdf"), byteArray);
        console.log("Saved to certificate-2-alejandro.pdf");
    }
}
main();
