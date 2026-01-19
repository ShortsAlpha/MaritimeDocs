'use client'

import { createCourseEvent } from "@/app/actions/calendar"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"

import { DateTimePicker } from "@/components/ui/date-time-picker"

const initialState = {
    message: "",
    success: false
}

type Props = {
    instructors: { id: string, fullName: string }[]
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate?: Date
}

export function CreateEventDialog({ instructors, open, onOpenChange, defaultDate }: Props) {
    const [state, formAction, isPending] = useActionState(createCourseEvent, initialState)
    const [startDate, setStartDate] = useState<Date | undefined>(defaultDate || new Date())
    const [endDate, setEndDate] = useState<Date | undefined>(defaultDate || new Date())
    const [checklist, setChecklist] = useState<string[]>([""])

    useEffect(() => {
        if (open) {
            setChecklist([""])
        }
        if (defaultDate) {
            const start = new Date(defaultDate)
            start.setHours(9, 0, 0, 0)
            const end = new Date(defaultDate)
            end.setHours(23, 30, 0, 0)
            setStartDate(start)
            setEndDate(end)
        }
    }, [defaultDate, open])

    useEffect(() => {
        if (state.success) {
            toast.success(state.message)
            onOpenChange(false)
        } else if (state.message) {
            toast.error(state.message)
        }
    }, [state, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Course</DialogTitle>
                    <DialogDescription>
                        Add a new course or event to the calendar.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="STCW Basic Training"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startDate" className="text-right">
                                Start
                            </Label>
                            <div className="col-span-3">
                                <DateTimePicker date={startDate} setDate={(date) => {
                                    setStartDate(date);
                                    // Auto-update end date if it's before start date or to keep a default 1-day duration if needed
                                    // For now, let's just ensure end date is at least start date if not set
                                    if (date && (!endDate || endDate < date)) {
                                        const end = new Date(date);
                                        end.setHours(23, 30, 0, 0); // Default to end of day
                                        setEndDate(end);
                                    }
                                }} />
                                <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ''} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="endDate" className="text-right">
                                End
                            </Label>
                            <div className="col-span-3">
                                <DateTimePicker date={endDate} setDate={setEndDate} />
                                <input type="hidden" name="endDate" value={endDate ? endDate.toISOString() : ''} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                                Location
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Classroom A"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="instructor" className="text-right">
                                Instructor
                            </Label>
                            <Select name="instructorId">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Instructor</SelectItem>
                                    {instructors.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">
                                Color
                            </Label>
                            <Select name="color" defaultValue="#3b82f6">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="#3b82f6"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500"></div> Blue</span></SelectItem>
                                    <SelectItem value="#10b981"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div> Green</span></SelectItem>
                                    <SelectItem value="#ef4444"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div> Red</span></SelectItem>
                                    <SelectItem value="#f59e0b"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500"></div> Orange</span></SelectItem>
                                    <SelectItem value="#8b5cf6"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-violet-500"></div> Purple</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                                Checklist
                            </Label>
                            <div className="col-span-3 space-y-2">
                                {checklist.map((item: string, index: number) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => {
                                                const newChecklist = [...checklist];
                                                newChecklist[index] = e.target.value;
                                                setChecklist(newChecklist);
                                            }}
                                            placeholder="Item name..."
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newChecklist = checklist.filter((_: string, i: number) => i !== index);
                                                setChecklist(newChecklist);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setChecklist([...checklist, ""])}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                                <input type="hidden" name="checklist" value={JSON.stringify(checklist)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Adding..." : "Add Event"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
