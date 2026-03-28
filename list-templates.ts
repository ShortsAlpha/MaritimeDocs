import { r2, R2_BUCKET_NAME } from "./lib/r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

async function main() {
    const prefix = "student-management-system/certificate-templates/";
    console.log(`Listing objects in ${R2_BUCKET_NAME} with prefix: ${prefix}`);
    
    try {
        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await r2.send(command);

        if (!response.Contents || response.Contents.length === 0) {
            console.log("No files found in that directory. Are you sure you uploaded it there?");
            return;
        }

        response.Contents.forEach((c: any) => {
            console.log(`- ${c.Key} (${c.Size} bytes)`);
        });

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
