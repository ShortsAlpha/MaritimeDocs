"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Download, FileArchive, Loader2, Users, Award } from "lucide-react"
import * as XLSX from "xlsx"
import * as mammoth from "mammoth"
import { toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface ParsedStudent {
    id: string; // random id for list
    surname: string;
    name: string;
    dob: string;
    identification: string;
    certNo: string;
    mark: string;
    passFail: string;
}

export default function BulkCertificatesPage() {
    const [file, setFile] = useState<File | null>(null)
    const [courseTitle, setCourseTitle] = useState<string>("")
    const [instructorName, setInstructorName] = useState<string>("")
    const [students, setStudents] = useState<ParsedStudent[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedDocs, setGeneratedDocs] = useState<{ studentId: string, url: string, base64: string, isMissingDb: boolean }[]>([])
    const [debugInfo, setDebugInfo] = useState<string>("")

    const updateStudent = (index: number, field: keyof ParsedStudent, value: string) => {
        const newStudents = [...students]
        newStudents[index] = { ...newStudents[index], [field]: value }
        setStudents(newStudents)
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0]
        if (!uploadedFile) return

        setFile(uploadedFile)
        parseFile(uploadedFile)
    }

    const parseFile = async (file: File) => {
        setIsParsing(true)
        setGeneratedDocs([])
        setInstructorName("")
        try {
            const data = await file.arrayBuffer()
            let json: any[][] = []
            let rawHtml = ""

            if (file.name.toLowerCase().endsWith('.docx')) {
                const result = await mammoth.convertToHtml({ arrayBuffer: data })
                rawHtml = result.value
                const parser = new DOMParser()
                const doc = parser.parseFromString(rawHtml, "text/html")
                const tables = doc.querySelectorAll("table")
                
                tables.forEach(table => {
                    const rows = table.querySelectorAll("tr")
                    rows.forEach(tr => {
                        const rowData: string[] = []
                        tr.querySelectorAll("td, th").forEach(cell => {
                            rowData.push(cell.textContent?.trim() || "")
                        })
                        json.push(rowData)
                    })
                })
                
                // fallback if doc doesn't use real tables
                if (json.length === 0) {
                    const messages = doc.querySelectorAll("p")
                    messages.forEach(p => {
                       json.push([p.textContent?.trim() || ""])
                    })
                }
            } else if (file.name.toLowerCase().endsWith('.pdf')) {
                const formData = new FormData()
                formData.append("file", file)
                
                const res = await fetch("/api/certificates/parse-pdf", {
                    method: "POST",
                    body: formData
                })
                
                const responseData = await res.json()
                if (!res.ok) throw new Error(responseData.error || "Failed to parse PDF")
                if (responseData.table) {
                    json = responseData.table
                }
                if (responseData.instructorName) {
                    setInstructorName(responseData.instructorName)
                }
            } else {
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
            }
            
            let parsedCourseTitle = ""
            for (let r = 0; r < json.length; r++) {
                const row = json[r] || []
                for (let c = 0; c < row.length; c++) {
                    const cell = String(row[c] || "").trim()
                    if (cell.toLowerCase().includes("title of training course")) {
                        // finding the value in the next columns
                        for (let nextC = c + 1; nextC < row.length; nextC++) {
                            if (row[nextC]) {
                                parsedCourseTitle = String(row[nextC]).trim()
                                break
                            }
                        }
                    }
                }
                if (parsedCourseTitle) break
            }

            setCourseTitle(parsedCourseTitle || "Unknown Course")

            let headerRowIndex = -1
            let colMap: any = {}
            
            for (let r = 0; r < json.length; r++) {
                const row = json[r] || []
                
                // Word tables sometimes flatten text. Let's make it robust by checking joined row text
                const rowText = row.join(" ").toLowerCase()
                
                if (rowText.includes("identification") || rowText.includes("passport") || rowText.includes("seaman") || rowText.includes("surname")) {
                    headerRowIndex = r
                    for (let c = 0; c < row.length; c++) {
                        const v = String(row[c] || "").trim().toLowerCase()
                        if (v === "surname" || v.includes("surname")) colMap.surname = c
                        else if (v === "name" || v.includes("name")) colMap.name = c
                        if (v.includes("date of birth") || v.includes("dob")) colMap.dob = c
                        if (v.includes("identification") || v.includes("passport") || v.includes("seaman")) colMap.identification = c
                        if (v.includes("certificate no")) colMap.certNo = c
                        if (v.includes("mark")) colMap.mark = c
                        if (v.includes("pass") || v.includes("fail")) colMap.passFail = c
                    }
                    // if surname and name weren't isolated correctly in columns, it might be a weird table
                    break
                }
            }

            const parsedList: ParsedStudent[] = []
            if (headerRowIndex !== -1) {
                // Read from next row until empty
                for (let r = headerRowIndex + 1; r < json.length; r++) {
                    const row = json[r] || []
                    const surname = row[colMap.surname] || ""
                    const name = row[colMap.name] || ""
                    
                    if (!surname && !name) continue // stop or skip if empty row
                    if (String(surname).toLowerCase().includes("venue") || String(name).toLowerCase() === "name") continue;

                    parsedList.push({
                        id: crypto.randomUUID(),
                        surname: String(surname),
                        name: String(name),
                        dob: String(row[colMap.dob] || ""),
                        identification: String(row[colMap.identification] || ""),
                        certNo: String(row[colMap.certNo] || ""),
                        mark: String(row[colMap.mark] || ""),
                        passFail: String(row[colMap.passFail] || "")
                    })
                }
            }

            if (parsedList.length === 0) {
                toast.error("Could not parse student data from the file.")
                setDebugInfo(JSON.stringify({ 
                    fileType: file.name,
                    rawHtmlLength: rawHtml.length,
                    jsonLength: json.length,
                    headerRowIndex,
                    colMap,
                    jsonPreview: json.slice(0, 20)
                }, null, 2))
            } else {
                toast.success(`Successfully parsed ${parsedList.length} students.`)
                setStudents(parsedList)
                setDebugInfo("")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error reading file.")
        } finally {
            setIsParsing(false)
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        setGeneratedDocs([])
        
        try {
            const res = await fetch("/api/certificates/bulk-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseTitle,
                    instructorName,
                    students
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to generate certificates")
                
            setGeneratedDocs(json.results || [])
            toast.success("Certificates generated successfully.")
            
            // Warn if any student was not in DB
            const missing = json.results.filter((r: any) => r.isMissingDb)
            if (missing.length > 0) {
                toast.warning(`${missing.length} student(s) were not found in the Database. Certificates were generated but not saved to their profiles.`)
            }
            
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const downloadZip = async () => {
        try {
            const zip = new JSZip()
            const folder = zip.folder(`Certificates_${courseTitle.replace(/[^a-z0-9]/gi, '_')}`)
            if (!folder) return
            
            let addedCount = 0
            for (let i = 0; i < generatedDocs.length; i++) {
                const doc = generatedDocs[i]
                const st = students[i]
                
                const filename = `${st.name}_${st.surname}_Certificate.pdf`.replace(/\s+/g, '_')
                
                if (doc.base64) {
                    // Bypass R2 CORS/Auth by converting Server's Base64 directly into Blob
                    const byteString = atob(doc.base64)
                    const ab = new ArrayBuffer(byteString.length)
                    const ia = new Uint8Array(ab)
                    for (let j = 0; j < byteString.length; j++) {
                        ia[j] = byteString.charCodeAt(j)
                    }
                    const blob = new Blob([ab], { type: "application/pdf" })
                    folder.file(filename, blob)
                    addedCount++
                } else if (doc.url) {
                    // Fallback
                    const response = await fetch(doc.url)
                    const blob = await response.blob()
                    folder.file(filename, blob)
                    addedCount++
                }
            }

            if (addedCount === 0) {
                toast.error("No valid documents to ZIP")
                return
            }

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `Bulk_Certificates_${new Date().getTime()}.zip`)
            toast.success("ZIP downloaded!")
        } catch (error) {
            console.error(error)
            toast.error("Could not create ZIP file")
        }
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Bulk Certificates
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Upload an Ending List Excel or Word (.docx) to generate and download certificates in bulk.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Upload Section */}
                <div className="xl:col-span-1 space-y-6">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 dark:bg-slate-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .docx, .pdf"
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        {isParsing ? (
                             <Loader2 className="h-10 w-10 text-blue-500 dark:text-slate-400 animate-spin mb-4 relative z-10" />
                        ) : (
                             <FileText className="h-10 w-10 text-blue-500 dark:text-slate-400 mb-4 group-hover:scale-110 transition-transform relative z-10" />
                        )}
                        <p className="font-medium text-slate-900 dark:text-slate-100 relative z-10">
                            {file ? file.name : "Click to Upload File"}
                        </p>
                        <p className="text-sm text-slate-500 mt-2 relative z-10">
                            Supports .xlsx, .docx, and .pdf formats matching the standard Ending List template
                        </p>
                    </div>

                    {courseTitle && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Detected Course Title</h3>
                                <textarea 
                                    rows={2}
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    className="font-semibold text-lg text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 dark:focus:border-slate-400 focus:outline-none w-full transition-colors resize-none overflow-hidden leading-tight"
                                    placeholder="Enter Course Title..."
                                />
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Instructor Name</h3>
                                <input 
                                    type="text"
                                    value={instructorName}
                                    onChange={(e) => setInstructorName(e.target.value)}
                                    className="font-medium text-md text-slate-900 dark:text-slate-100 flex items-center gap-2 bg-transparent border-b border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 dark:focus:border-slate-400 focus:outline-none w-full transition-colors pb-1"
                                    placeholder="Enter Instructor Name..."
                                />
                            </div>
                        </div>
                    )}
                    
                    {debugInfo && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-xl text-xs overflow-auto max-h-96 border border-red-200 dark:border-red-800/50">
                            <h4 className="font-bold mb-2">Debug Info (Show this to assistant):</h4>
                            <pre className="whitespace-pre-wrap break-all">{debugInfo}</pre>
                        </div>
                    )}
                </div>

                {/* Data Preview Section */}
                <div className="xl:col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Students Preview ({students.length})</span>
                            </h3>

                            {students.length > 0 && generatedDocs.length === 0 && (
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                                    Generate {students.length} Certificates
                                </button>
                            )}

                            {generatedDocs.length > 0 && (
                                <button
                                    onClick={downloadZip}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-emerald-950 text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <FileArchive className="h-4 w-4" />
                                    Download All ZIP
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-auto">
                            {students.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p>Upload a file to preview student data</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 sticky top-0 shadow-sm z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">Surname</th>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">D.O.B</th>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">ID / Passport</th>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">Cert No</th>
                                            <th className="px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {students.map((st, i) => {
                                            const generated = generatedDocs[i]
                                            return (
                                                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={st.surname} 
                                                            onChange={(e) => updateStudent(i, 'surname', e.target.value)}
                                                            className="min-w-[120px] w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-950 rounded px-3 py-1.5 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                                            placeholder="Surname"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={st.name} 
                                                            onChange={(e) => updateStudent(i, 'name', e.target.value)}
                                                            className="min-w-[160px] w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-950 rounded px-3 py-1.5 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                                            placeholder="Name"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={st.dob} 
                                                            onChange={(e) => updateStudent(i, 'dob', e.target.value)}
                                                            className="w-24 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-950 rounded px-3 py-1.5 outline-none transition-all text-sm text-slate-600 dark:text-slate-300"
                                                            placeholder="DD.MM.YYYY"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={st.identification} 
                                                            onChange={(e) => updateStudent(i, 'identification', e.target.value)}
                                                            className="min-w-[110px] w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-950 rounded px-3 py-1.5 outline-none transition-all text-sm font-mono text-slate-600 dark:text-slate-300"
                                                            placeholder="ID No"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="text" 
                                                            value={st.certNo} 
                                                            onChange={(e) => updateStudent(i, 'certNo', e.target.value)}
                                                            className="min-w-[180px] w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-950 rounded px-3 py-1.5 outline-none transition-all text-sm font-mono text-slate-600 dark:text-slate-300"
                                                            placeholder="Cert No"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {generated ? (
                                                            <div className="flex items-center gap-3">
                                                                {generated.isMissingDb ? (
                                                                    <div className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        No Profile
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        Saved
                                                                    </div>
                                                                )}
                                                                
                                                                <a 
                                                                    href={generated.base64 ? `data:application/pdf;base64,${generated.base64}` : generated.url}
                                                                    download={`${st.name}_${st.surname}_Certificate.pdf`.replace(/\s+/g, '_')}
                                                                    className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                    title="Download Certificate"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">Pending</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
