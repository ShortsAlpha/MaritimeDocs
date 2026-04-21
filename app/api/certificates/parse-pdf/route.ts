import { NextResponse } from "next/server"
import { db } from "@/lib/db"
const PDFParser = require("pdf2json")

function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1)

        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError))
        pdfParser.on("pdfParser_dataReady", () => {
            const text = pdfParser.getRawTextContent()
            resolve(text)
        })

        pdfParser.parseBuffer(buffer)
    })
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as Blob | null
        
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const text = await extractTextFromPDF(buffer)

        // Extract lines
        const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l)
        
        let courseTitle = ""
        const resultJson: any[][] = []

        // 1. Locate Course Title
        // pdf2json often places title right above "MTC Course Code"
        const titleMatch = text.match(/([^\n]+?)\s*MTC Course Code/i)
        if (titleMatch && titleMatch[1]) {
            courseTitle = titleMatch[1].replace(/course\s+[\d\.]+$/i, "").trim()
        }

        // Just in case we didn't find it natively
        if (!courseTitle) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.toLowerCase().includes("title of training course")) {
                    const parts = line.split(/title of training course[:\s]*/i)
                    if (parts.length > 1 && parts[1].trim() !== "") {
                        courseTitle = parts[1].trim()
                    } else if (i + 1 < lines.length) {
                        courseTitle = lines[i+1].trim()
                    }
                    break 
                }
            }
        }

        // --- MATCH WITH DATABASE ---
        if (courseTitle) {
            try {
                const dbCourses = await db.course.findMany({ select: { title: true } })
                
                // Exclude generic words from matching
                const excludeWords = ['training', 'model', 'in', 'course', 'of', 'for']
                
                const searchWords = courseTitle.toLowerCase()
                    .replace(/[^a-z0-9]/g, ' ')
                    .split(' ')
                    .filter(w => w.length > 2 && !excludeWords.includes(w))

                let maxScore = 0
                let bestDbMatch = courseTitle

                for (const c of dbCourses) {
                    const dbWords = c.title.toLowerCase()
                        .replace(/[^a-z0-9]/g, ' ')
                        .split(' ')
                        .filter(w => w.length > 2 && !excludeWords.includes(w))
                        
                    let score = 0
                    for (const sw of searchWords) {
                        if (dbWords.includes(sw)) score += 1
                    }

                    // Calculate score bonus if order is preserved or entire string matches closely
                    if (c.title.toLowerCase() === courseTitle.toLowerCase()) {
                        score += 50
                    }

                    if (score > maxScore) {
                        maxScore = score
                        bestDbMatch = c.title
                    }
                }

                if (maxScore > 0) {
                    courseTitle = bestDbMatch
                }
            } catch (e) {
                console.error("DB matching failed", e)
            }
        }

        let instructorName = ""
        const instructorMatch = text.match(/Instructor[\/\s]*s['’\s]*Details:\s*([A-Za-z\s]+)/i)
        if (instructorMatch && instructorMatch[1]) {
            // Because PDF might merge this with Examiner details:
            instructorName = instructorMatch[1].replace(/Examiner[\s\S]*$/i, "").trim()
        }

        // Output fake header rows to trick the generic mapper on the frontend
        resultJson.push(["Title of Training Course", courseTitle || "Unknown Course"])
        resultJson.push(["No", "Surname", "Name", "Date of Birth", "Identification No", "Certificate No", "Mark", "Pass/Fail"])

        // 2. Parse Students
        // Format: [No] [Surname] [Name...] [31.03.1999] [ID] [Cert No...] [80%] [Pass]
        const dateFormatRegex = /\d{2}[\./]\d{2}[\./]\d{4}/

        for (const line of lines) {
            const dateMatch = line.match(dateFormatRegex)
            // check if the line starts with a digit followed by space, and has a date
            if (dateMatch && dateMatch.index !== undefined && line.match(/^\d+\s+/)) {
                
                const beforeDate = line.substring(0, dateMatch.index).trim()
                const dateAndAfter = line.substring(dateMatch.index).trim()
                
                const numMatch = beforeDate.match(/^(\d+)\s+/)
                const numStr = numMatch ? numMatch[1] : ""
                
                let namesStr = beforeDate
                if (numStr && numMatch) {
                    namesStr = namesStr.substring(numMatch[0].length).trim()
                }
                
                // First continuous block of caps/text is usually Surname, but it could have multiple words.
                // We'll just split on space. It's totally fine if they are shifted in our grid, because they are concatenated during generation.
                const nameParts = namesStr.split(/\s+/)
                const surname = nameParts[0]
                const name = nameParts.slice(1).join(" ")

                let dob = ""
                let idNo = ""
                let markStr = ""
                let passFailStr = ""
                let certNo = ""

                const dobMatch = dateAndAfter.match(dateFormatRegex)
                if (dobMatch) {
                    dob = dobMatch[0]
                    // NEW ROBUST PLUCKING LOGIC: pdf2json outputs columns in random horizontal order.
                    // We extract known patterns, then treat the remainder as ID and Cert No.
                    let rest = dateAndAfter.substring(dob.length).trim()

                    // Pluck Pass/Fail (Note: PDF often concatenates it without a space, e.g., 'PassTM AFF...')
                    const passFailMatch = rest.match(/(Pass|Fail)/i)
                    if (passFailMatch) {
                        passFailStr = passFailMatch[1]
                        rest = rest.replace(/(Pass|Fail)/i, '').trim()
                    }

                    // Pluck Mark
                    const markRegex = /(\d+(?:\.\d+)?%)/
                    const markMatch = rest.match(markRegex)
                    if (markMatch) {
                        markStr = markMatch[1]
                        rest = rest.replace(markRegex, '').trim()
                    }

                    // What is left is typically format: "ID_NO CERTIFICATE_NUMBER"
                    // Example: "105558563 TM AFF - 202504-02"
                    // We assume ID is the first chunk without spaces
                    const firstSpace = rest.indexOf(" ")
                    if (firstSpace > -1) {
                        idNo = rest.substring(0, firstSpace).trim()
                        certNo = rest.substring(firstSpace).trim()
                    } else {
                        idNo = rest.trim()
                    }
                }
                
                resultJson.push([numStr, surname, name, dob, idNo, certNo, markStr, passFailStr])
            }
        }

        return NextResponse.json({ success: true, table: resultJson, instructorName })

    } catch (e: any) {
        console.error("PDF Parsing Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
