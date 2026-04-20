import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import { R2_BUCKET_NAME } from './lib/r2';

const agent = new https.Agent({
    rejectUnauthorized: false
});

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
    requestHandler: new NodeHttpHandler({
        httpsAgent: agent,
    }),
});

async function main() {
    console.log("Searching bucket...", R2_BUCKET_NAME);
    let continuationToken = undefined;
    let found = 0;
    
    do {
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            ContinuationToken: continuationToken
        }));
        
        if (res.Contents) {
            for (const item of res.Contents) {
                if (item.Key && item.Key.includes("Marshall")) {
                    console.log("FOUND S3 KEY: ", item.Key);
                    found++;
                }
            }
        }
        continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    if (found === 0) console.log("Not found any Marshall files");
}
main();
