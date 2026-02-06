"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Course } from "@prisma/client"
import { ListChecks, Plus, Trash, GripVertical, ChevronDown, ChevronRight, Upload, Loader2, FileSpreadsheet } from "lucide-react"
import { read, utils } from "xlsx"
import { updateCourseChecklistTemplate } from "@/app/actions/courses"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type ChecklistPhase = {
    id: string
    title: string
    items: string[]
}

export function ChecklistTemplateDialog({ course }: { course: Course }) {
    const [open, setOpen] = useState(false)
    const [phases, setPhases] = useState<ChecklistPhase[]>([])
    const [loading, setLoading] = useState(false)

    // Load initial data
    useEffect(() => {
        if (course.checklistTemplate) {
            try {
                // Address type mismatch by casting unknown first
                const template = course.checklistTemplate as unknown as ChecklistPhase[]
                setPhases(template || [])
            } catch (e) {
                console.error("Failed to parse template", e)
            }
        }
    }, [course.checklistTemplate])

    const handleAddPhase = () => {
        const newPhase: ChecklistPhase = {
            id: crypto.randomUUID(),
            title: "New Phase",
            items: []
        }
        setPhases([...phases, newPhase])
    }

    const handleDeletePhase = (phaseId: string) => {
        setPhases(phases.filter(p => p.id !== phaseId))
    }

    const handleUpdatePhaseTitle = (phaseId: string, title: string) => {
        setPhases(phases.map(p => p.id === phaseId ? { ...p, title } : p))
    }

    const handleAddItem = (phaseId: string) => {
        setPhases(phases.map(p => {
            if (p.id === phaseId) {
                return { ...p, items: [...p.items, "New Item"] }
            }
            return p
        }))
    }

    const handleDeleteItem = (phaseId: string, itemIndex: number) => {
        setPhases(phases.map(p => {
            if (p.id === phaseId) {
                const newItems = [...p.items]
                newItems.splice(itemIndex, 1)
                return { ...p, items: newItems }
            }
            return p
        }))
    }

    const handleUpdateItem = (phaseId: string, itemIndex: number, text: string) => {
        setPhases(phases.map(p => {
            if (p.id === phaseId) {
                const newItems = [...p.items]
                newItems[itemIndex] = text
                return { ...p, items: newItems }
            }
            return p
        }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await updateCourseChecklistTemplate(course.id, phases)
            if (res.success) {
                toast.success("Checklist template saved")
                setOpen(false)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = read(bstr, { type: "binary" })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = utils.sheet_to_json(ws, { header: 1 }) as any[][]

            // Parse data: Expecting Col 0 = Phase (optional), Col 1 = Item
            // If Phase is empty, use previous phase.
            const newPhases: ChecklistPhase[] = []
            let currentPhase: ChecklistPhase | null = null

            // Skip header row if it looks like a header (e.g. contains "Phase" or "Item")
            let startIndex = 0
            if (data.length > 0 && (String(data[0][0]).toLowerCase().includes("phase") || String(data[0][1]).toLowerCase().includes("item"))) {
                startIndex = 1
            }

            // Heuristic to determine column mapping
            // Check first 20 rows for data distribution
            let hasColC = false
            for (let i = 0; i < Math.min(data.length, 20); i++) {
                if (data[i] && data[i][2]) {
                    hasColC = true
                    break
                }
            }

            for (let i = startIndex; i < data.length; i++) {
                const row = data[i]

                let phaseName = ""
                let itemName = ""

                if (hasColC) {
                    // Mode: Phase in Col B (1), Item in Col C (2)
                    // Col A is usually empty or irrelevant
                    const colB = row[1] ? String(row[1]).trim() : ""
                    const colC = row[2] ? String(row[2]).trim() : ""

                    if (colB) phaseName = colB
                    if (colC) itemName = colC
                } else {
                    // Legacy Mode: Phase in Col A (0), Item in Col B (1)
                    const colA = row[0] ? String(row[0]).trim() : ""
                    const colB = row[1] ? String(row[1]).trim() : ""

                    if (colA) phaseName = colA // Or if single col uppercase...
                    if (colB) itemName = colB

                    // Single column fallback (only A present)
                    if (!colB && colA) {
                        // Check for ALL CAPS Header
                        const isUpperCase = colA.length > 3 && colA === colA.toUpperCase() && /[A-Z]/.test(colA)
                        if (isUpperCase) {
                            phaseName = colA
                            itemName = ""
                        } else {
                            // Treat as item if we have a phase
                            if (currentPhase) {
                                itemName = colA
                                phaseName = ""
                            } else {
                                phaseName = colA
                                itemName = ""
                            }
                        }
                    }
                    // Single column fallback (only B present - indented)
                    if (!colA && colB) {
                        const isUpperCase = colB.length > 3 && colB === colB.toUpperCase() && /[A-Z]/.test(colB)
                        if (isUpperCase) {
                            phaseName = colB
                            itemName = ""
                        } else {
                            itemName = colB
                            phaseName = ""
                        }
                    }
                }

                if (!phaseName && !itemName) continue

                // Logic to update state
                // 1. Update Phase if detected
                if (phaseName) {
                    const cleanPhaseName = phaseName.replace(/[\r\n]+/g, " ").trim() // Handle wrapped text in merged cells
                    // Check if phase already exists (or is the current one)
                    if (!currentPhase || currentPhase.title !== cleanPhaseName) {
                        const existing = newPhases.find(p => p.title === cleanPhaseName)
                        if (existing) {
                            currentPhase = existing
                        } else {
                            currentPhase = {
                                id: crypto.randomUUID(),
                                title: cleanPhaseName,
                                items: []
                            }
                            newPhases.push(currentPhase)
                        }
                    }
                }

                // 2. Add Item if detected
                if (itemName && currentPhase) {
                    const cleanItemName = itemName.replace(/[\r\n]+/g, " ").trim()
                    if (!currentPhase.items.includes(cleanItemName)) {
                        currentPhase.items.push(cleanItemName)
                    }
                }
            }

            if (newPhases.length > 0) {
                if (confirm("This will replace the current checklist. Continue?")) {
                    setPhases(newPhases)
                    toast.success("Imported " + newPhases.length + " phases from Excel")
                }
            } else {
                toast.warning("No data found in Excel")
            }

            // Reset input
            e.target.value = ""
        }
        reader.readAsBinaryString(file)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600">
                    <ListChecks className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Checklist: {course.title}</DialogTitle>
                    <DialogDescription>
                        Define the standard checklist phases and items for this course.
                        These will be automatically copied when you create a new event.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1 border rounded-md">
                    {/* ... ScrollArea ... */}
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-4 p-2">
                            {phases.map((phase) => (
                                <div key={phase.id} className="border rounded-lg p-3 bg-card shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Phase Name</Label>
                                            <Input
                                                value={phase.title}
                                                onChange={(e) => handleUpdatePhaseTitle(phase.id, e.target.value)}
                                                className="font-semibold"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePhase(phase.id)}
                                            className="text-red-500 mt-5"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                                        {phase.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                <Input
                                                    value={item}
                                                    onChange={(e) => handleUpdateItem(phase.id, idx, e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleDeleteItem(phase.id, idx)}
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddItem(phase.id)}
                                            className="h-8 text-xs w-full border-dashed"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Item
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleAddPhase}>
                            <Plus className="h-4 w-4 mr-2" /> Add Phase
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                id="excel-upload"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Button variant="outline" onClick={() => document.getElementById('excel-upload')?.click()}>
                                <Upload className="h-4 w-4 mr-2" /> Import Excel
                            </Button>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Template
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
