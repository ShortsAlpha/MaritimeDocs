"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Plus, Search, Loader2 } from "lucide-react"
import { searchStudentsForAssignment, assignStudentsToEvent } from "@/app/actions/event-students"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Student {
    id: string
    fullName: string
    studentNumber: string | null
    status: string
}

interface EventStudentSelectorProps {
    eventId: string
    onSuccess: () => void
}

export function EventStudentSelector({ eventId, onSuccess }: EventStudentSelectorProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [students, setStudents] = useState<Student[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [assigning, setAssigning] = useState(false)

    // Load unassigned students when opened
    useEffect(() => {
        if (open) {
            handleSearch("")
        }
    }, [open])

    async function handleSearch(term: string) {
        setQuery(term)

        setLoading(true)
        // If searching, show all students. If not searching, show only unassigned.
        const shouldFilterUnassigned = !term.trim()

        const res = await searchStudentsForAssignment(term, eventId, shouldFilterUnassigned)
        if (res.success && res.students) {
            setStudents(res.students as any)
        }
        setLoading(false)
    }

    function toggleStudent(id: string) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    async function handleAssign() {
        if (selectedIds.length === 0) return

        setAssigning(true)
        const res = await assignStudentsToEvent(eventId, selectedIds)
        if (res.success) {
            toast.success("Students assigned successfully")
            setOpen(false)
            setQuery("")
            setStudents([])
            setSelectedIds([])
            onSuccess()
        } else {
            toast.error(res.message)
        }
        setAssigning(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Students
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Students to Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or student number..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                        {loading ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Searching...
                            </div>
                        ) : students.length > 0 ? (
                            students.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => toggleStudent(student.id)}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-sm cursor-pointer hover:bg-muted",
                                        selectedIds.includes(student.id) && "bg-primary/10"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{student.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{student.studentNumber || "No Number"}</span>
                                    </div>
                                    {selectedIds.includes(student.id) && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))
                        ) : query.length > 1 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                No students found.
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                Type to search...
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedIds.length} selected
                        </span>
                        <Button onClick={handleAssign} disabled={selectedIds.length === 0 || assigning}>
                            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
