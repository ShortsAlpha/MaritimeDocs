"use server"

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { db } from "@/lib/db"

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const bucketName = "student-management-system"; 

// Mapping: System Course Title -> R2 Folder Name
const courseToR2FolderMap: Record<string, string> = {
    "MASTER OF YACHTS 200 GT LIMITED": "200 GT MOY IYT Limited",
    "MASTER OF YACHTS 200 GT UNLIMITED": "200 GT MOY IYT Unlimited",
    "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)": "200 Gt TM Lecture Notes",
    "STCW BASIC SAFETY TRAINING CERTIFICATE": "Basic Safety Training"
};

export async function checkCloudLectureNotes(courseTitle: string) {
    try {
        const folderName = courseToR2FolderMap[courseTitle];
        if (!folderName) {
            return { success: true, files: [], message: "No R2 folder mapping exists for this course." };
        }

        const prefix = `Lecture_Notes/${folderName}/`;

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        
        if (!response.Contents) return { success: true, files: [] };

        const files = response.Contents
            .filter(item => item.Key && item.Key !== prefix && !item.Key.endsWith('/'))
            .map(item => {
                const parts = item.Key!.split('/');
                const fileName = parts[parts.length - 1];
                return {
                    name: fileName,
                    key: item.Key!,
                    size: item.Size
                };
            });

        return { success: true, files };
    } catch (error) {
        console.error("Error fetching cloud lecture notes:", error);
        return { success: false, files: [], message: "Failed to fetch from R2" };
    }
}

export async function getSignedDownloadUrls(courseTitle: string) {
    const result = await checkCloudLectureNotes(courseTitle);
    if (!result.success || !result.files?.length) return result;

    try {
        const filesWithUrls = await Promise.all(result.files.map(async (file) => {
            const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: file.key,
            });
            // URL expires in 1 hour
            const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
            return {
                ...file,
                downloadUrl: signedUrl
            };
        }));
        
        return { success: true, files: filesWithUrls };
    } catch (err) {
        console.error("Error signing URLs:", err);
        return { success: false, files: [], message: "Failed to generate secure links" };
    }
}
