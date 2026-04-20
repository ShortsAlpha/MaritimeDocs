import { r2, R2_BUCKET_NAME } from './lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function main() {
    try {
        console.log("Listing everything with prefix 'hq/'...");
        const res = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: 'hq/' }));
        if (res.Contents) {
            console.log(`FOUND ${res.Contents.length} objects under hq/`);
            for (const o of res.Contents.slice(0, 5)) console.log(o.Key);
        }

        console.log("Listing everything under 'student-management-system' for 'kavindu'...");
        // S3 doesn't support wildcard search, we list without prefix and filter, or just prefix 'students/' to narrow down
    } catch(e) {
        console.error(e);
    }
}
main();
