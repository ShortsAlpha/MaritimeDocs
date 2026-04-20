import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function testR2() {
    try {
        console.log("== NEXTJS R2 TEST START ==");
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 15,
            Prefix: 'hq/'
        }));
        console.log("Found objects:", res.Contents?.map(o => o.Key));
    } catch(e) {
        console.error("== NEXTJS R2 TEST FAIL ==", e);
    }
}
