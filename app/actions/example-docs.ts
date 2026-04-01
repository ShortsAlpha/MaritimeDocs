import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const bucketName = "student-management-system"; // Use hardcoded verified name

export async function getExampleDocuments() {
    try {
        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: "mail-example-documents/",
        });

        const response = await s3Client.send(command);
        
        if (!response.Contents) return [];

        const friendlyNames: Record<string, string> = {
            "Candidate Registration Form Malta Version.pdf": "Candidate Registration Form",
            "Marshall Island Waiver-and-release-form. (1).pdf": "Marshall Island Waiver And Release Form",
            "Training Agreement (1).pdf": "Training Agreement",
            "candidate_sea_time_form (1) (1) (1) (3).pdf": "Candidate Sea Time Form",
            "how to iyt registration (4).pdf": "How to Register IYT",
            "moy-student-acknowlge-course-completion-and-submission-time-limits-Rev2.pdf": "Moy Student Acknowlge Course Completion And Submission Time Limits"
        };

        // Return the clean file names and their keys
        return response.Contents
            .filter(item => 
                item.Key && 
                item.Key !== "mail-example-documents/" && 
                !item.Key.endsWith(".png") && 
                !item.Key.endsWith(".jpg")
            )
            .map(item => {
                const parts = item.Key!.split('/');
                const fileName = parts[parts.length - 1];
                return {
                    name: friendlyNames[fileName] || fileName,
                    key: item.Key!
                };
            });
    } catch (error) {
        console.error("Error fetching example documents:", error);
        return [];
    }
}
