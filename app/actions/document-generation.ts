'use server';

import { db } from "@/lib/db";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/logger";
import { getTemplateForCourse } from "@/lib/pdf-templates";
import { TemplateFillers } from "@/lib/pdf-fillers";
import { PDFDocument } from 'pdf-lib';

/**
 * Downloads the blank PDF template from R2, fills it with student data using pdf-lib,
 * and returns it as a base64 string for client-side preview.
 */
export async function generateDocumentPreview(studentId: string, courseId: string) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const student = await db.student.findUnique({
            where: { id: studentId },
            include: { courses: true }
        });
        if (!student) return { success: false, message: "Student not found" };

        const course = student.courses.find(c => c.id === courseId);
        if (!course) return { success: false, message: "Course not found for this student" };

        const templateDef = getTemplateForCourse(course.title);
        if (!templateDef) return { success: false, message: "Template definition not found for this course" };

        // 1. Fetch template buffer from R2
        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: templateDef.r2Key
        });

        // Try getting it directly via S3 SDK. If public, fetch works too, but SDK is surer.
        const response = await r2.send(getCommand);
        if (!response.Body) return { success: false, message: "Empty template fetched from R2" };

        const bytes = await response.Body.transformToByteArray();

        // 2. Load with pdf-lib
        const pdfDoc = await PDFDocument.load(bytes);

        // 3. Fill the template (Safe from client bundle)
        const filler = TemplateFillers[templateDef.id];
        if (filler) {
            const { applyTMMetadataToStudent } = await import("@/lib/transport-malta");
            const processedStudent = await applyTMMetadataToStudent(student, course, templateDef.id);
            await filler(pdfDoc, processedStudent, course);
        }

        // 4. Save to base64
        const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: false });

        return { 
            success: true, 
            base64: pdfBase64,
            templateTitle: templateDef.title
        };

    } catch (error: any) {
        console.error("Preview Generation Error:", error);
        return { success: false, message: error.message || "Failed to generate preview" };
    }
}

/**
 * Re-generates and saves a PDF document to R2 for the student permanently.
 * Does NOT accept base64 from the client to prevent React RSC payload crashes.
 */
export async function saveGeneratedDocument(studentId: string, courseId: string) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const student = await db.student.findUnique({
            where: { id: studentId },
            include: { courses: true }
        });
        if (!student) return { success: false, message: "Student not found" };

        const course = student.courses.find(c => c.id === courseId);
        if (!course) return { success: false, message: "Course not found for this student" };

        const templateDef = getTemplateForCourse(course.title);
        if (!templateDef) return { success: false, message: "Template definition not found for this course" };

        const templateTitle = templateDef.title;

        // 1. Fetch template buffer from R2
        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: templateDef.r2Key
        });

        const response = await r2.send(getCommand);
        if (!response.Body) return { success: false, message: "Empty template fetched from R2" };

        const bytes = await response.Body.transformToByteArray();

        // 2. Load with pdf-lib and Fill
        const { applyTMMetadataToStudent } = await import("@/lib/transport-malta");
        const processedStudent = await applyTMMetadataToStudent(student, course, templateDef.id);

        const pdfDoc = await PDFDocument.load(bytes);
        const filler = TemplateFillers[templateDef.id];
        if (filler) {
            await filler(pdfDoc, processedStudent, course);
        }

        // Lock in the TM record if applicable
        if (processedStudent.__courseEventId) {
            const certTypeToUse = processedStudent.__certificateType || templateDef.id;
            await db.studentCertificate.upsert({
                where: {
                    studentId_courseEventId_certificateType: {
                        studentId: student.id,
                        courseEventId: processedStudent.__courseEventId,
                        certificateType: certTypeToUse
                    }
                },
                update: {}, // Once generated, usually we don't update it to avoid jumping numbers
                create: {
                    studentId: student.id,
                    courseEventId: processedStudent.__courseEventId,
                    certificateType: certTypeToUse,
                    certificateNo: processedStudent.studentNumber,
                    issueDate: processedStudent.certificateIssueDate,
                    expiryDate: processedStudent.certificateExpiryDate,
                }
            });
        }

        // 3. Save directly to Unit8Array buffer
        const finalPdfBytes = await pdfDoc.save();
        const buffer = Buffer.from(finalPdfBytes);

        // 4. Find or create the DocumentType for this certificate
        let docType = await db.documentType.findFirst({
            where: { title: templateTitle }
        });

        if (!docType) {
            docType = await db.documentType.create({
                data: {
                    title: templateTitle,
                    category: 'CERTIFICATE',
                    isRequired: false
                }
            });
        }

        // Ensure this DocumentType is mapped to the Course so the frontend UI tab displays it
        const existingMapping = await db.courseDocument.findUnique({
            where: {
                courseId_documentTypeId: {
                    courseId: course.id,
                    documentTypeId: docType.id
                }
            }
        });

        if (!existingMapping) {
            await db.courseDocument.create({
                data: {
                    courseId: course.id,
                    documentTypeId: docType.id,
                    isRequired: false
                }
            });
        }

        const safeTitle = templateTitle.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `students/${student.id}/documents/generated/${Date.now()}-${safeTitle}.pdf`;

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: "application/pdf",
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        await db.studentDocument.create({
            data: {
                studentId,
                documentTypeId: docType.id,
                fileUrl: publicUrl,
                fileType: "pdf",
                title: `${student.fullName} - ${templateTitle}`,
                status: "APPROVED" 
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        await logActivity({
            action: 'CREATE',
            title: `Admin generated document: ${templateTitle}`,
            description: `Generated for student ${student.fullName}`,
            userId: user.id,
            userEmail: user.emailAddresses[0]?.emailAddress || "Admin",
            metadata: { fileUrl: publicUrl, studentId }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Save Generated Doc Error:", error);
        return { success: false, message: error.message || "Failed to save generated document" };
    }
}
