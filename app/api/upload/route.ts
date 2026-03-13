import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchStoragePrefix } from "@/lib/branch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const subFolder = formData.get("subFolder") as string || "uploads";

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Get user's branch prefix
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { branch: true }
        });
        const prefix = user?.branch ? getBranchStoragePrefix(user.branch.code) : 'hq';
        const fileName = `${prefix}/${subFolder}/${Date.now()}-${file.name.replace(/\s/g, "-")}`;

        // Hardcode the verified bucket name to bypass Vercel env bugs
        const bucketName = "student-management-system";

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
        });

        console.log("DEBUG /api/upload -> Bucket:", bucketName, "Account:", process.env.R2_ACCOUNT_ID);

        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });

        await s3Client.send(command);

        return NextResponse.json({
            fileUrl: `${process.env.R2_PUBLIC_URL}/${fileName}`,
            key: fileName
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        
        // Return explicit runtime configurations to the frontend for debugging
        const fallbackBucket = "student-management-system";
        const debugInfo = `[Bucket used: '${fallbackBucket}', Account ID: '${process.env.R2_ACCOUNT_ID}']`;
        
        return new NextResponse(JSON.stringify({ 
            error: `${error.message || "Unknown S3 Error"} ${debugInfo}` 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
