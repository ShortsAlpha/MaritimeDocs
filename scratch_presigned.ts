import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2_BUCKET_NAME } from './lib/r2';

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function main() {
    const key = "hq/hq/students/kavindu_kavinda_deegalla_disage/documents/1775069693689-Marshall Island Waiver-and-release-form. (1).pdf";
    console.log("Generating URL for:", key);
    
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: 'inline'
        });

        const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
        console.log("Signed URL:\n" + url);
        
    } catch(e) {
        console.error("Error generating URL", e);
    }
}
main();
