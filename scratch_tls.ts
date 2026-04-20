import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // BYPASS TLS!

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "student-management-system";

async function main() {
    console.log("Listing buckets or scanning students...");
    try {
        console.log("Scanning student-management-system bucket for ANY keys containing 'kavindu'...");
        let continuationToken = undefined;
        let found = 0;
        let total = 0;

        do {
            const res = await r2.send(new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                ContinuationToken: continuationToken
            }));
            
            if (res.Contents) {
                total += res.Contents.length;
                for (const item of res.Contents) {
                    if (item.Key && item.Key.includes("kavindu")) {
                        console.log("FOUND S3 KEY: ", item.Key);
                        found++;
                    }
                }
            }
            continuationToken = res.NextContinuationToken;
        } while (continuationToken);

        if (found === 0) {
            console.log(`Scanned ${total} items. 'kavindu' NOT FOUND AT ALL in bucket ${R2_BUCKET_NAME}!`);
        }

    } catch (e: any) {
        console.error("SDK Error:", e);
    }
}
main();
