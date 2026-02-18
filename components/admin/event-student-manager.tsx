"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Loader2, Trash2, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getEventStudents, removeStudentFromEvent } from "@/app/actions/event-students"
import { updateDocumentNote } from "@/app/actions/update-document-note"
import { EventStudentSelector } from "./event-student-selector"
import { cn } from "@/lib/utils"

type Props = {
    eventId: string
    eventTitle: string
    eventStart: Date
    eventResource?: {
        location?: string
        instructor?: {
            fullName: string
        }
    }
    viewMode?: "grid" | "list"
}

export function EventStudentManager({ eventId, eventTitle, eventStart, eventResource, viewMode = "list" }: Props) {
    const [students, setStudents] = useState<any[]>([])
    const [docTypes, setDocTypes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (eventId) fetchData()
    }, [eventId])

    async function fetchData() {
        setLoading(true)
        const res = await getEventStudents(eventId)
        if (res.success && res.students) {
            setStudents(res.students)
            if (res.documentTypes) {
                setDocTypes(res.documentTypes)
            }
        }
        setLoading(false)
    }

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm("Remove student from this event?")) return

        const prev = [...students]
        setStudents(prev.filter(s => s.id !== studentId))
        const res = await removeStudentFromEvent(eventId, studentId)
        if (!res.success) {
            toast.error("Failed to remove")
            setStudents(prev)
        } else {
            toast.success("Removed")
        }
    }

    const handleNoteUpdate = async (studentId: string, docTypeId: string, note: string) => {
        // Optimistic update to ensure instant color change
        setStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s

            // Clone existing notes array or create new
            let newNotes = s.documentNotes ? [...s.documentNotes] : []
            const existingNoteIndex = newNotes.findIndex((n: any) => n.documentTypeId === docTypeId)

            if (existingNoteIndex >= 0) {
                // Update existing note
                newNotes[existingNoteIndex] = { ...newNotes[existingNoteIndex], note }
            } else {
                // Create new note entry mockup
                newNotes.push({ documentTypeId: docTypeId, note })
            }

            return { ...s, documentNotes: newNotes }
        }))

        const res = await updateDocumentNote(studentId, docTypeId, note)
        if (!res.success) {
            toast.error("Failed to update note")
            fetchData() // Revert/Refresh on error
        }
    }

    // Placeholder for new export logic
    const handleExportStudentList = () => {
        toast.info("Export is being updated to support grid layout.")
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{viewMode === "grid" ? "Workbook Grid" : "Assigned Students"}</h3>
                <div className="flex gap-2">
                    <EventStudentSelector eventId={eventId} onSuccess={fetchData} />
                    {viewMode === "grid" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportStudentList}
                            disabled={students.length === 0}
                            title="Export Student List"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Docs</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : students.length > 0 ? (
                                students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{student.fullName}</span>
                                                <span className="text-xs text-muted-foreground">{student.studentNumber || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {student.status.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.isDocsComplete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger>
                                                        <AlertCircle className="h-5 w-5 text-red-500 mx-auto cursor-pointer hover:opacity-80" />
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-60 text-sm p-4">
                                                        <div className="font-semibold mb-2 text-red-600">Missing Documents:</div>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {student.missingDocs?.map((doc: string, i: number) => (
                                                                <li key={i}>{doc}</li>
                                                            ))}
                                                        </ul>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveStudent(student.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No students assigned.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="border rounded-md overflow-x-auto relative min-h-[150px] max-h-[60vh]">
                    <Table className="w-full min-w-[1000px] border-separate border-spacing-0">
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[50px] min-w-[50px] max-w-[50px] border-b border-r text-center sticky left-0 z-20 bg-muted/90 h-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">#</TableHead>
                                <TableHead className="w-[200px] min-w-[200px] border-b border-r sticky left-[50px] z-20 bg-muted/90 h-10 font-bold text-primary shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Student Name</TableHead>
                                {docTypes.map(dt => (
                                    <TableHead key={dt.id} className="text-center min-w-[140px] border-b border-r h-10 text-xs font-bold px-1 whitespace-normal leading-tight bg-muted/50">
                                        {dt.title}
                                    </TableHead>
                                ))}
                                <TableHead className="w-[50px] border-b h-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={docTypes.length + 3} className="text-center h-48">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                            <span className="text-muted-foreground text-sm">Loading workbook data...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow><TableCell colSpan={docTypes.length + 3} className="text-center h-24 text-muted-foreground">No students assigned to this event.</TableCell></TableRow>
                            ) : (
                                students.map((student, idx) => (
                                    <TableRow key={student.id} className="hover:bg-transparent group">
                                        <TableCell className="w-[50px] min-w-[50px] max-w-[50px] text-center text-muted-foreground border-b border-r sticky left-0 z-10 bg-background group-hover:bg-muted/5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">{idx + 1}</TableCell>
                                        <TableCell className="w-[200px] min-w-[200px] sticky left-[50px] bg-background z-10 border-b border-r group-hover:bg-muted/5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                                            <div className="flex flex-col py-1">
                                                <span className="font-semibold text-sm truncate">{student.fullName}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{student.studentNumber}</span>
                                            </div>
                                        </TableCell>

                                        {docTypes.map(dt => {
                                            const doc = student.documents?.find((d: any) => d.documentTypeId === dt.id)
                                            const noteParams = student.documentNotes?.find((n: any) => n.documentTypeId === dt.id)
                                            const note = noteParams?.note || ""

                                            const hasDoc = !!doc

                                            // Background logic: Note exists -> Yellow (Manual override)
                                            // No note but file exists -> Green (System success)
                                            // Neither -> Red (Missing)
                                            let bgColor = "bg-red-100"
                                            if (note) bgColor = "bg-yellow-100"
                                            else if (hasDoc) bgColor = "bg-green-50"

                                            return (
                                                <TableCell key={dt.id} className={cn("p-0 border-b border-r border-gray-400 dark:border-gray-600 relative h-10", bgColor)}>
                                                    {hasDoc && (
                                                        <div className="absolute top-1 right-1 z-10 pointer-events-none opacity-50" title="Document uploaded to system">
                                                            <div className="bg-green-200 rounded-full p-0.5">
                                                                <Check className="h-2 w-2 text-green-700" strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        className="w-full h-full px-2 py-1 bg-transparent text-xs font-medium text-center outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500/20 transition-all placeholder:text-red-300/50 text-black"
                                                        defaultValue={note}
                                                        placeholder={!hasDoc ? "MISSING" : ""}
                                                        onBlur={(e) => {
                                                            const val = e.target.value.trim()
                                                            if (val !== note) {
                                                                handleNoteUpdate(student.id, dt.id, val)
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur()
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                            )
                                        })}

                                        <TableCell className="border-b">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-destructive transition-colors" onClick={() => handleRemoveStudent(student.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {viewMode === "grid" && (
                <div className="text-xs text-muted-foreground flex gap-4 pl-1">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-50 border rounded-sm"></div>
                        <span>Missing Document</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Uploaded & Valid</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-100 border rounded-sm"></div>
                        <span>Has Note</span>
                    </div>
                </div>
            )}
        </div>
    )
}
