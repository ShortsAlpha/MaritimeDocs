import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadBufferToR2 } from "@/lib/r2"
import fs from "fs"
import path from "path"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { format, isValid } from "date-fns"

function getCourseDetails(title: string): { docTitle: string, docRegulations: string } {
    const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const matches = (aliases: string[]) => aliases.some(alias => t.includes(alias.toLowerCase().replace(/[^a-z0-9]/g, '')));

    if (matches(["medical", "first aid"])) {
        return {
            docTitle: "Proficiency in Medical First Aid – IMO Model 1.14",
            docRegulations: "STCW 1978 / 2010 as amended. Code A VI-4 – 4.1 IMO Model course 1.14" 
        };
    }
    if (matches(["efficient deck", "edh"])) {
        return {
            docTitle: "Efficient Deck Hand – E.D.H.",
            docRegulations: "Merchant Shipping Directorate of the Authority for Transport in Malta\nSubsidiary Legislation 234.17 Merchant Shipping (Training and Certification) Regulations 1 st July, 2013*\nLegal Notice 153 Of 2013."
        };
    }
    if (matches(["fire fighting"])) {
        return {
            docTitle: "Advanced Fire Fighting – IMO Model 2.03",
            docRegulations: "STCW 1978 / 2010 as amended Code A VI/3 IMO Model course 2.03"
        };
    }
    if (matches(["leadership", "teamwork", "helm"])) {
        return {
            docTitle: "Leadership and Teamwork (Operational)",
            docRegulations: "STCW 1978 / 2010 as amended. Code A-II/1, A-III/1"
        };
    }
    if (matches(["gmdss", "general operator"])) {
        return {
            docTitle: "General Operator’s Certificate for the GMDSS Training",
            docRegulations: "Maltese Radiocommunications Regulations (Subsidiary Legislation 399.35\nRadio Regulations 2012\nSection  A-IV/2 of the STCW code"
        };
    }
    if (matches(["radar", "arpa"])) {
        return {
            docTitle: "RADAR Plotting and Navigation / Use of ARPA– IMO Model 1.07",
            docRegulations: "RADAR Plotting and Navigation / Use of ARPA Operational Level – IMO Model 1.07"
        };
    }
    if (matches(["ecdis", "electronic chart display"])) {
        return {
            docTitle: "Operational use of Electronic Chart Display System (ECDIS) – IMO Model 1.27",
            docRegulations: "STCW 1995 / 2010 as amended Section A-II/1 Reg.II/1,II/2, II/3, IMO Model course 1.27"
        };
    }
    if (matches(["survival craft", "rescue boat"])) {
        return {
            docTitle: "Proficiency in Survival Craft and Rescue Boats other than Fast Rescue Boats",
            docRegulations: "STCW 1978 / 2010 as amended, in accordance with sec. A-VI/2.1"
        };
    }

    // Fallback if no match
    return { docTitle: title || "UNKNOWN COURSE", docRegulations: "" };
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { courseTitle, instructorName, students } = body

        if (!students || !Array.isArray(students)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        // Dynamically find the newest template that includes "medical first aid"
        const templatesDir = path.join(process.cwd(), "public/templates")
        let templateFileName = "public/templates/medical.docx"
        if (fs.existsSync(templatesDir)) {
            const files = fs.readdirSync(templatesDir)
            let latestFile = ""
            let latestTime = 0
            for (const f of files) {
                if (f.toLowerCase().includes("medical first aid") && f.endsWith(".docx")) {
                    const stats = fs.statSync(path.join(templatesDir, f))
                    if (stats.mtimeMs > latestTime) {
                        latestTime = stats.mtimeMs
                        latestFile = f
                    }
                }
            }
            if (latestFile) {
                templateFileName = `public/templates/${latestFile}`
            }
        }

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
            const { docTitle, docRegulations } = getCourseDetails(courseTitle);

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
                base64: buf.toString('base64'),
                isMissingDb,
                fileExt: "docx"
            })
        }

        return NextResponse.json({ success: true, results })
        
    } catch (e: any) {
        console.error("Bulk Generate Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
