import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const { fileType, docTypeId } = await req.json();

        // Generate a unique file name
        const fileName = `${userId}/${docTypeId}-${Date.now()}`;

        // Create the command
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            ContentType: fileType,
        });

        // Generate presigned URL
        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        return NextResponse.json({
            signedUrl,
            fileUrl: `${process.env.R2_PUBLIC_URL}/${fileName}`, // Assuming public access or worker
            key: fileName
        });
    } catch (error) {
        console.error("Upload error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
