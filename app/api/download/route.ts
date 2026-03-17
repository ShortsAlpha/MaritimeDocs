import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public download endpoint that generates a presigned URL for R2 files.
 * Usage: GET /api/download?key=hq/students/.../file.pdf
 * Redirects the user to a time-limited presigned URL (valid for 1 hour).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get("key");

        if (!key) {
            return new NextResponse("Missing file key", { status: 400 });
        }

        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });

        const command = new GetObjectCommand({
            Bucket: "student-management-system",
            Key: key,
        });

        // Generate a presigned URL valid for 1 hour (3600 seconds)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Redirect the user to the presigned URL
        return NextResponse.redirect(presignedUrl);
    } catch (error: any) {
        console.error("Download error:", error);
        return new NextResponse(
            JSON.stringify({ error: error.message || "Failed to generate download link" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
