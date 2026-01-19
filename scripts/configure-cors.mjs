import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
dotenv.config();

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function configureCors() {
    console.log("Configuring CORS for bucket:", process.env.R2_BUCKET_NAME);

    try {
        await r2.send(new PutBucketCorsCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["PUT", "POST", "GET", "HEAD"], // Added HEAD/GET/POST just in case
                        AllowedOrigins: ["*"], // Allow all for development. In prod, strict to domain.
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        }));
        console.log("Successfully configured CORS!");
    } catch (error) {
        console.error("Error configuring CORS:", error);
    }
}

configureCors();
