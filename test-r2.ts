import { r2 } from "./lib/r2";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

async function check() {
    try {
        const cmd = new ListBucketsCommand({});
        const res = await r2.send(cmd);
        console.log("Buckets:", res.Buckets?.map(b => b.Name));
    } catch(e) {
        console.error("ListBuckets Error:", e);
    }
}
check();
