import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { TemplateFillers } from "@/lib/pdf-fillers"
import { PDFDocument } from "pdf-lib"
import { uploadBufferToR2 } from "@/lib/r2"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { courseTitle, instructorName, students } = body

        if (!students || !Array.isArray(students)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        // Always use the universal template
        let templateId = "universal"
        let templateFileName = "public/templates/universal-template.pdf"

        const templatePath = path.join(process.cwd(), templateFileName)
        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: `Template file ${templateFileName} not found` }, { status: 500 })
        }

        const templateBuffer = fs.readFileSync(templatePath)

        const results = []

        for (const st of students) {
            // Find student in DB by Identification or Passport or name if necessary
            // We strip spaces to improve matching
            const identification = (st.identification || "").trim()

            let dbStudent = null
            if (identification) {
                dbStudent = await db.student.findFirst({
                    where: {
                        OR: [
                            { passportNumber: identification },
                            { studentNumber: identification }
                        ]
                    }
                })
            }

            // If not found by passport, try by name and surname 
            // This is a naive fallback if identification is slightly off
            if (!dbStudent && st.name && st.surname) {
                dbStudent = await db.student.findFirst({
                    where: {
                        fullName: {
                            contains: `${st.name} ${st.surname}`,
                            mode: "insensitive"
                        }
                    }
                })
            }

            let isMissingDb = !dbStudent

            // Prepare mock student object for pdf-fillers if missing DB
            const studentData = dbStudent || {
                fullName: `${st.name} ${st.surname}`.trim(),
                passportNumber: identification,
                dateOfBirth: (function() {
                    if (!st.dob) return null;
                    const parts = st.dob.split(/[./-]/);
                    if (parts.length === 3) {
                        if (parts[0].length === 4) return new Date(parts.join('-'));
                        return new Date(parts.reverse().join('-'));
                    }
                    return new Date(st.dob);
                })(),
                certificateIssueDate: new Date(),
                certificateExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            }
            
            // Inject instructor name and cert number directly to student mock
            const customData = {
                instructorName: instructorName || "INSTRUCTOR NAME",
                certNo: st.certNo || `${Date.now()}`
            }

            // 1) Open PDF and Fill
            const pdfDoc = await PDFDocument.load(templateBuffer)
            
            
            const fillerFn = TemplateFillers[templateId]
            if (fillerFn) {
                await fillerFn(pdfDoc, studentData, { title: courseTitle, ...customData })
            }

            const pdfBytes = await pdfDoc.save()
            const buffer = Buffer.from(pdfBytes)

            // 2) Upload to R2
            const r2FileName = `certificates/${Date.now()}-${st.surname}-${st.name}.pdf`.replace(/\s+/g, "_")
            const fileUrl = await uploadBufferToR2(
                buffer,
                r2FileName
            )

            // 3) Optionally save to DB if found
            // DISABLED FOR TESTING: We will re-enable this when processing official documents
            /*
            if (dbStudent && fileUrl) {
                // Find or create 'CERTIFICATE' document type
                let docType = await db.documentType.findFirst({
                    where: { category: "CERTIFICATE" }
                })
                if (!docType) {
                    docType = await db.documentType.create({
                        data: {
                            title: "Course Certificate",
                            category: "CERTIFICATE",
                            isRequired: false
                        }
                    })
                }

                await db.studentDocument.create({
                    data: {
                        title: `${courseTitle} Certificate`,
                        fileUrl: fileUrl,
                        fileType: "pdf",
                        studentId: dbStudent.id,
                        documentTypeId: docType.id,
                    }
                })

                await db.studentCertificate.upsert({
                    where: {
                        studentId_courseEventId_certificateType: {
                            studentId: dbStudent.id,
                            courseEventId: "BULK_GENERATED", // simple marker
                            certificateType: templateId
                        }
                    },
                    update: {},
                    create: {
                        studentId: dbStudent.id,
                        courseEventId: null,
                        certificateType: templateId,
                        certificateNo: st.certNo || `${Date.now()}`,
                        issueDate: new Date(),
                        expiryDate: studentData.certificateExpiryDate,
                    }
                })
            }
            */

            results.push({
                studentId: dbStudent?.id || null,
                url: fileUrl,
                base64: buffer.toString('base64'),
                isMissingDb
            })
        }

        return NextResponse.json({ success: true, results })
        
    } catch (e: any) {
        console.error("Bulk Generate Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
