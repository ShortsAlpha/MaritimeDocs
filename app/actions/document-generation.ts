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

        // 1. Fetch template buffer
        let bytes: Uint8Array;
        if (templateDef.type === "pdf") {
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: templateDef.r2Key
            });
            const response = await r2.send(getCommand);
            if (!response.Body) return { success: false, message: "Empty template fetched from R2" };
            bytes = await response.Body.transformToByteArray();
        } else {
            const fs = await import("fs");
            const path = await import("path");
            const templatePath = path.join(process.cwd(), "public/templates", templateDef.localFile || "");
            if (!fs.existsSync(templatePath)) return { success: false, message: "DOCX template not found locally" };
            bytes = new Uint8Array(fs.readFileSync(templatePath));
        }

        // 2. Process based on type
        const { applyTMMetadataToStudent } = await import("@/lib/transport-malta");
        const processedStudent = await applyTMMetadataToStudent(student, course, templateDef.id);

        if (templateDef.type === "pdf") {
            const pdfDoc = await PDFDocument.load(bytes);
            const filler = TemplateFillers[templateDef.id];
            if (filler) {
                await filler(pdfDoc, processedStudent, course);
            }
            const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: false });
            return { 
                success: true, 
                base64: pdfBase64,
                templateTitle: templateDef.title,
                fileExt: "pdf"
            };
        } else {
            const PizZip = (await import("pizzip")).default;
            const Docxtemplater = (await import("docxtemplater")).default;
            const { format, isValid } = await import("date-fns");
            const zip = new PizZip(Buffer.from(bytes));
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            const dobObj = processedStudent.dateOfBirth;
            const dobFormatted = (dobObj && isValid(dobObj)) ? format(dobObj, 'dd.MM.yyyy') : "N/A";
            const issueDateObj = processedStudent.certificateIssueDate;
            const issueDateFormatted = (issueDateObj && isValid(issueDateObj)) ? format(issueDateObj, 'dd.MM.yyyy') : "N/A";
            const expiryDateObj = processedStudent.certificateExpiryDate;
            const expiryDateFormatted = (expiryDateObj && isValid(expiryDateObj)) ? format(expiryDateObj, 'dd.MM.yyyy') : "N/A";

            doc.render({
                fullName: processedStudent.fullName.toUpperCase(),
                dob: dobFormatted,
                passportNumber: processedStudent.passportNumber || "N/A",
                certNo: processedStudent.studentNumber || "N/A",
                courseTitle: templateDef.title,
                courseRegulations: templateDef.docRegulations || "",
                instructorName: "INSTRUCTOR NAME", 
                issueDate: issueDateFormatted,
                expiryDate: expiryDateFormatted
            });

            const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
            return { 
                success: true, 
                base64: buf.toString('base64'),
                templateTitle: templateDef.title,
                fileExt: "docx"
            };
        }

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

        // 1. Fetch template buffer
        let bytes: Uint8Array;
        if (templateDef.type === "pdf") {
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: templateDef.r2Key
            });
            const response = await r2.send(getCommand);
            if (!response.Body) return { success: false, message: "Empty template fetched from R2" };
            bytes = await response.Body.transformToByteArray();
        } else {
            const fs = await import("fs");
            const path = await import("path");
            const templatePath = path.join(process.cwd(), "public/templates", templateDef.localFile || "");
            if (!fs.existsSync(templatePath)) return { success: false, message: "DOCX template not found locally" };
            bytes = new Uint8Array(fs.readFileSync(templatePath));
        }

        // 2. Process based on type
        let buffer: Buffer;
        let fileExt = templateDef.type;
        let mimeType = templateDef.type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        
        const { applyTMMetadataToStudent } = await import("@/lib/transport-malta");
        const processedStudent = await applyTMMetadataToStudent(student, course, templateDef.id);

        if (templateDef.type === "pdf") {
            const pdfDoc = await PDFDocument.load(bytes);
            const filler = TemplateFillers[templateDef.id];
            if (filler) {
                await filler(pdfDoc, processedStudent, course);
            }
            const finalPdfBytes = await pdfDoc.save();
            buffer = Buffer.from(finalPdfBytes);
        } else {
            const PizZip = (await import("pizzip")).default;
            const Docxtemplater = (await import("docxtemplater")).default;
            const { format, isValid } = await import("date-fns");
            const zip = new PizZip(Buffer.from(bytes));
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            const dobObj = processedStudent.dateOfBirth;
            const dobFormatted = (dobObj && isValid(dobObj)) ? format(dobObj, 'dd.MM.yyyy') : "N/A";
            const issueDateObj = processedStudent.certificateIssueDate;
            const issueDateFormatted = (issueDateObj && isValid(issueDateObj)) ? format(issueDateObj, 'dd.MM.yyyy') : "N/A";
            const expiryDateObj = processedStudent.certificateExpiryDate;
            const expiryDateFormatted = (expiryDateObj && isValid(expiryDateObj)) ? format(expiryDateObj, 'dd.MM.yyyy') : "N/A";

            doc.render({
                fullName: processedStudent.fullName.toUpperCase(),
                dob: dobFormatted,
                passportNumber: processedStudent.passportNumber || "N/A",
                certNo: processedStudent.studentNumber || "N/A",
                courseTitle: templateDef.title,
                courseRegulations: templateDef.docRegulations || "",
                instructorName: "INSTRUCTOR NAME", 
                issueDate: issueDateFormatted,
                expiryDate: expiryDateFormatted
            });

            buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
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
        const key = `students/${student.id}/documents/generated/${Date.now()}-${safeTitle}.${fileExt}`;

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        await db.studentDocument.create({
            data: {
                studentId,
                documentTypeId: docType.id,
                fileUrl: publicUrl,
                fileType: fileExt,
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
