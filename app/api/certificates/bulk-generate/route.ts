import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadBufferToR2 } from "@/lib/r2"
import fs from "fs"
import path from "path"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { format, isValid } from "date-fns"
import { getTemplateForCourse } from "@/lib/pdf-templates"
import { TemplateFillers } from "@/lib/pdf-fillers"
import { PDFDocument } from "pdf-lib"
import { r2, R2_BUCKET_NAME } from "@/lib/r2"
import { GetObjectCommand } from "@aws-sdk/client-s3"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { courseTitle, instructorName, students } = body

        if (!students || !Array.isArray(students)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        const templateDef = getTemplateForCourse(courseTitle)
        if (!templateDef) {
            return NextResponse.json({ error: `Template definition not found for course: ${courseTitle}` }, { status: 400 })
        }

        let templateBuffer: Buffer;
        if (templateDef.type === "pdf") {
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: templateDef.r2Key
            })
            const response = await r2.send(getCommand)
            if (!response.Body) return NextResponse.json({ error: "Empty template fetched from R2" }, { status: 500 })
            const bytes = await response.Body.transformToByteArray()
            templateBuffer = Buffer.from(bytes)
        } else {
            const templatePath = path.join(process.cwd(), "public/templates", templateDef.localFile || "")
            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({ error: `Template file ${templateDef.localFile} not found` }, { status: 500 })
            }
            templateBuffer = fs.readFileSync(templatePath)
        }

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

            const parsedDob = (function() {
                if (!st.dob) return null;
                const parts = st.dob.split(/[./-]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) return new Date(parts.join('-'));
                    return new Date(parts.reverse().join('-'));
                }
                return new Date(st.dob);
            })();

            // Prepare student object for pdf-fillers, fallback to Excel data if DB fields are empty
            const studentData = dbStudent ? {
                ...dbStudent,
                passportNumber: dbStudent.passportNumber || identification || "N/A",
                dateOfBirth: dbStudent.dateOfBirth || parsedDob,
                certificateIssueDate: dbStudent.certificateIssueDate || new Date(),
                certificateExpiryDate: dbStudent.certificateExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            } : {
                fullName: `${st.name} ${st.surname}`.trim(),
                passportNumber: identification || "N/A",
                dateOfBirth: parsedDob,
                certificateIssueDate: new Date(),
                certificateExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            }
            
            // Inject instructor name and cert number directly to student mock
            const customData = {
                instructorName: instructorName || "INSTRUCTOR NAME",
                certNo: st.certNo || `${Date.now()}`
            }

            const dobObj = studentData.dateOfBirth
            const dobFormatted = (dobObj && isValid(dobObj)) ? format(dobObj, 'dd.MM.yyyy') : "N/A"
            const issueDateObj = studentData.certificateIssueDate
            const issueDateFormatted = (issueDateObj && isValid(issueDateObj)) ? format(issueDateObj, 'dd.MM.yyyy') : "N/A"
            const expiryDateObj = studentData.certificateExpiryDate
            const expiryDateFormatted = (expiryDateObj && isValid(expiryDateObj)) ? format(expiryDateObj, 'dd.MM.yyyy') : "N/A"

            // Retrieve custom mapped titles and regulations based on system course title
            const docTitle = templateDef.title
            const docRegulations = templateDef.docRegulations || ""

            if (templateDef.type === "pdf") {
                // 1) Open PDF and Fill
                const pdfDoc = await PDFDocument.load(templateBuffer)
                const fillerFn = TemplateFillers[templateDef.id]
                
                if (fillerFn) {
                    await fillerFn(pdfDoc, studentData, { title: docTitle, ...customData })
                }
                const finalPdfBytes = await pdfDoc.save()
                const buf = Buffer.from(finalPdfBytes)

                const r2FileName = `certificates/${Date.now()}-${st.surname}-${st.name}.pdf`.replace(/\s+/g, "_")
                const fileUrl = await uploadBufferToR2(buf, r2FileName)

                results.push({
                    studentId: dbStudent?.id || null,
                    url: fileUrl,
                    base64: buf.toString('base64'),
                    isMissingDb,
                    fileExt: "pdf"
                })

            } else {
                // 1) Open document and fill
                const zip = new PizZip(templateBuffer);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                doc.render({
                    fullName: studentData.fullName.toUpperCase(),
                    dob: dobFormatted,
                    passportNumber: studentData.passportNumber || "N/A",
                    certNo: st.certNo || "N/A",
                    courseTitle: docTitle,
                    courseRegulations: docRegulations,
                    instructorName: instructorName || "INSTRUCTOR NAME",
                    issueDate: issueDateFormatted,
                    expiryDate: expiryDateFormatted
                });

                const buf = doc.getZip().generate({
                    type: "nodebuffer",
                    compression: "DEFLATE",
                });

                // 2) Upload to R2
                const r2FileName = `certificates/${Date.now()}-${st.surname}-${st.name}.docx`.replace(/\s+/g, "_")
                const fileUrl = await uploadBufferToR2(
                    buf,
                    r2FileName
                )

                results.push({
                    studentId: dbStudent?.id || null,
                    url: fileUrl,
                    base64: buf.toString('base64'),
                    isMissingDb,
                    fileExt: "docx"
                })
            }
        }

        return NextResponse.json({ success: true, results })
        
    } catch (e: any) {
        console.error("Bulk Generate Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
