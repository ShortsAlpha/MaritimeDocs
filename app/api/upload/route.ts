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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const subFolder = formData.get("subFolder") as string || "uploads";

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${subFolder}/${Date.now()}-${file.name.replace(/\s/g, "-")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
        });

        await r2.send(command);

        return NextResponse.json({
            fileUrl: `${process.env.R2_PUBLIC_URL}/${fileName}`,
            key: fileName
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
