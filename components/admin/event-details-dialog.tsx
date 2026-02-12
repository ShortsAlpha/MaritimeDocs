"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Plus, Trash2, User, FileSpreadsheet } from "lucide-react"
import { toggleEventChecklistItem, addChecklistItem, deleteEventChecklistItem, deleteCourseEvent, updateChecklistNote } from "@/app/actions/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: Date
    events: any[]
}

export function EventDetailsDialog({ open, onOpenChange, date, events }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule for {date.toDateString()}</DialogTitle>
                    <DialogDescription>
                        {events.length} class{events.length !== 1 ? 'es' : ''} scheduled for this day.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No events scheduled.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventStudentSelector } from "./event-student-selector"
import { getEventStudents, removeStudentFromEvent } from "@/app/actions/event-students"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, CheckCircle2, Download } from "lucide-react"
import { EventStudentManager } from "./event-student-manager"

// ... existing imports

function EventCard({ event }: { event: any }) {
    const [newItem, setNewItem] = useState("")
    const [isPending, setIsPending] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [checklistItems, setChecklistItems] = useState(event.resource?.checklist || [])

    useEffect(() => {
        setChecklistItems(event.resource?.checklist || [])
    }, [event.resource?.checklist])


    const handleAddItem = async () => {
        if (!newItem.trim() || isPending) return
        setIsPending(true)

        try {
            const result = await addChecklistItem(event.id, newItem)

            if (result.success && result.item) {
                setChecklistItems((prev: any[]) => [...prev, result.item])
                setNewItem("")
            }
        } catch (error) {
            console.error("Failed to add item", error)
        } finally {
            setIsPending(false)
        }
    }

    const handleToggle = async (itemId: string, checked: boolean) => {
        setChecklistItems((prev: any[]) => prev.map((item) =>
            item.id === itemId ? {
                ...item,
                isCompleted: checked,
                completedAt: checked ? new Date().toISOString() : null,
                completedBy: checked ? "You" : null
            } : item
        ))

        const result = await toggleEventChecklistItem(itemId, checked)

        if (result.success && (result as any).item) {
            const updatedItem = (result as any).item
            setChecklistItems((prev: any[]) => prev.map((item) =>
                item.id === itemId ? updatedItem : item
            ))
        }
    }

    const handleNoteUpdate = async (itemId: string, note: string) => {
        setChecklistItems((prev: any[]) => prev.map((item) =>
            item.id === itemId ? { ...item, note } : item
        ))

        await updateChecklistNote(itemId, note)
    }

    const handleDeleteEvent = async () => {
        setIsDeleting(true)
        const res = await deleteCourseEvent(event.id)
        if (res.success) {
            toast.success("Event deleted")
        } else {
            toast.error("Failed to delete event")
            setIsDeleting(false)
        }
        setShowDeleteConfirm(false)
    }

    const handleDelete = async (itemId: string) => {
        setChecklistItems((prev: any[]) => prev.filter((item) => item.id !== itemId))
        await deleteEventChecklistItem(itemId)
    }

    const handleExportExcel = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default

            // 1. Fetch the template
            const templateName = "MALTA - Course Flow - MOY Limited (1).xlsx"
            const response = await fetch(`/templates/${encodeURIComponent(templateName)}`)
            if (!response.ok) throw new Error("Template not found")
            const buffer = await response.arrayBuffer()

            // 2. Load into Workbook
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(buffer)
            const ws = workbook.getWorksheet(1) || workbook.worksheets[0]

            // 3. Fill Header Info
            const startDateStr = event.start ? format(new Date(event.start), "dd.MM.yyyy") : ""
            const locStr = event.resource?.location || ""
            ws.getCell("D2").value = `${startDateStr}${locStr ? "-" + locStr : ""}`
            ws.getCell("D2").alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

            const instrName = event.resource?.instructor?.fullName || ""
            ws.getCell("D3").value = instrName

            // Header E5: Note
            ws.getCell("E5").value = "Note"
            ws.getCell("E5").style = { ...ws.getCell("F5").style }

            // Header G5: Checked By
            ws.getCell("G5").value = "Checked By"
            ws.getCell("G5").style = { ...ws.getCell("F5").style }

                // Clean up green fills in specific cells E22, E23, E24
                ;["E22", "E23", "E24"].forEach(cell => {
                    ws.getCell(cell).fill = { type: 'pattern', pattern: 'none' }
                })

                // Remove red text from specific C cells (Set to Black)
                ;["C22", "C23", "C24", "C31", "C32", "C33", "C34", "C35"].forEach(cellAddress => {
                    const cell = ws.getCell(cellAddress)
                    if (cell.font) {
                        cell.font = { ...cell.font, color: { argb: 'FF000000' } }
                    }
                })

            // Widen Column G
            ws.getColumn(7).width = 25

            // 4. Fill Data
            const centerStyle: any = { vertical: 'middle', horizontal: 'center', wrapText: true }

            ws.eachRow((row, rowNumber) => {
                if (rowNumber < 6) return

                // Special fix for Row 28 (B28 Orange)
                if (rowNumber === 28) {
                    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } } as any
                }

                // Special styling for Row 29 (Force B, D-G Gray)
                if (rowNumber === 29) {
                    const grayFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
                    row.getCell(2).fill = grayFill
                        ;[4, 5, 6, 7].forEach(col => row.getCell(col).fill = grayFill)
                }

                const cellC = row.getCell(3)
                let labelInExcel = ""
                const val = cellC.value
                if (val && typeof val === 'object' && 'richText' in val) {
                    labelInExcel = (val as any).richText.map((t: any) => t.text).join('')
                } else if (val) {
                    labelInExcel = val.toString()
                }
                labelInExcel = labelInExcel.trim()

                if (!labelInExcel) {
                    const grayFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
                        ;[4, 5, 6, 7].forEach(col => row.getCell(col).fill = grayFill)
                    return
                }

                // Adjust layout
                row.height = 55
                row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }

                // Theme extension: Apply F style to G
                const cellG = row.getCell(7)
                cellG.style = { ...row.getCell(6).style }

                const matchedItem = checklistItems.find((item: any) => item.label.trim() === labelInExcel)

                if (matchedItem) {
                    // Column E: Note (Always write note if exists)
                    const cellE = row.getCell(5)
                    cellE.value = matchedItem.note || ""
                    cellE.alignment = centerStyle
                    cellE.fill = { type: 'pattern', pattern: 'none' }

                    if (matchedItem.isCompleted) {
                        // Column D: Date
                        const cellD = row.getCell(4)
                        if (matchedItem.completedAt) {
                            const dateObj = new Date(matchedItem.completedAt)
                            cellD.value = `${format(dateObj, "dd/MM/yyyy")}\n${format(dateObj, "HH:mm")}`
                        }
                        cellD.alignment = centerStyle

                        // Column G: Checked By
                        const name = matchedItem.completedBy || ""
                        cellG.value = name
                        cellG.alignment = centerStyle
                    }
                }

                // Ensure E is clean (no green) for all valid rows regardless of match
                row.getCell(5).fill = { type: 'pattern', pattern: 'none' }
            })

            // 6. Generate & Download
            const outBuffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([outBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${event.title}_Checklist.xlsx`
            a.click()
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error("Export failed", error)
            toast.error("Failed to export excel. Template might be missing.")
        }
    }

    return (
        <>
            <div className="flex flex-col gap-2 py-1 group/card relative">

                <div className="absolute top-0 right-0 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="pr-8">
                    <h4 className="font-semibold text-lg leading-none mb-2">{event.title}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                                {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                            </span>
                        </div>
                        {event.resource?.instructor && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{event.resource.instructor.fullName}</span>
                            </div>
                        )}
                        {event.resource?.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.resource.location}</span>
                            </div>
                        )}
                    </div>



                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="overview">Checklist</TabsTrigger>
                            <TabsTrigger value="students">Students</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 pt-4">
                            <h5 className="text-sm font-semibold mb-2">Checklist Items</h5>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                {checklistItems
                                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((item: any, index: number, array: any[]) => {
                                        const isPreviousCompleted = index === 0 || array[index - 1].isCompleted
                                        const isDisabled = !isPreviousCompleted && !item.isCompleted
                                        const showPhaseHeader = index === 0 || item.phase !== array[index - 1].phase

                                        return (
                                            <div key={item.id} className="flex flex-col gap-1">
                                                {showPhaseHeader && (
                                                    <div className="mt-2 mb-1 sticky top-0 bg-card z-20 pb-1 pt-1 shadow-sm">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                                                            {item.phase || "General"}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="relative flex items-center space-x-2 group pl-2 border-l-2 border-muted hover:border-primary/50 transition-colors">
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={item.isCompleted}
                                                        onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                                                        disabled={isDisabled}
                                                        className="transition-colors duration-300 z-10"
                                                    />
                                                    <div className="relative inline-block flex-1 min-w-0">
                                                        <label
                                                            htmlFor={item.id}
                                                            className={`text-sm font-medium leading-snug cursor-pointer transition-colors block whitespace-normal break-words ${item.isCompleted ? "line-through text-muted-foreground" : ""
                                                                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            title={item.label}
                                                        >
                                                            {item.label}
                                                        </label>
                                                    </div>

                                                    <div className="w-[150px] shrink-0">
                                                        <Input
                                                            placeholder="Note..."
                                                            defaultValue={item.note || ""}
                                                            className="h-6 text-xs px-2 bg-transparent border-transparent hover:border-input focus:border-primary transition-all"
                                                            onBlur={(e) => handleNoteUpdate(item.id, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.currentTarget.blur()
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity z-10 ml-auto"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {item.isCompleted && item.completedBy && (
                                                    <div className="text-xs text-muted-foreground ml-8">
                                                        Completed by {item.completedBy} at {item.completedAt ? format(new Date(item.completedAt), "HH:mm, dd MMM") : ""}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Input
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    placeholder="Add item..."
                                    className="h-8 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddItem()
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={handleAddItem}
                                    disabled={isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    onClick={handleExportExcel}
                                    title="Export Checklist"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="students" className="space-y-4 pt-4">
                            <EventStudentManager
                                eventId={event.id}
                                eventTitle={event.title}
                                eventStart={event.start}
                                eventResource={event.resource}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Delete Confirmation Alert (same as before) */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            "{event.title}" and remove it from the calendar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

