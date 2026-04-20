import { r2, R2_BUCKET_NAME } from './lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function search() {
    let continuationToken = undefined;
    let found = 0;
    console.log("Searching in bucket: " + R2_BUCKET_NAME);
    do {
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            ContinuationToken: continuationToken
        }));
        
        if (res.Contents) {
            for (const item of res.Contents) {
                if (item.Key && item.Key.includes("kavindu")) {
                    console.log("FOUND S3 KEY: ", item.Key);
                    found++;
                }
            }
        }
        continuationToken = res.NextContinuationToken;
        if (found > 5) break; 
    } while (continuationToken);

    if (found === 0) {
        console.log("No file containing 'kavindu' was found anywhere in the entire bucket!");
    }
}
search().catch(console.error);
