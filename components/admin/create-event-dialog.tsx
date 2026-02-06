import { useState, useActionState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createCourseEvent } from "@/app/actions/calendar"
import { getCourseChecklistTemplate } from "@/app/actions/courses"
import { format } from "date-fns"
import { Course, Instructor, Intake } from "@prisma/client"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"

type ChecklistPhase = {
    id: string
    title: string
    items: string[]
}

type Props = {
    instructors: { id: string; fullName: string }[]
    courses: { id: string; title: string }[]
    intakes?: { id: string; name: string }[]
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate?: Date
}

const initialState = {
    success: false,
    message: ""
}

export function CreateEventDialog({ instructors, courses = [], intakes = [], open, onOpenChange, defaultDate }: Props) {
    const [state, formAction, isPending] = useActionState(createCourseEvent, initialState)
    const [startDate, setStartDate] = useState<Date | undefined>(defaultDate || new Date())
    const [endDate, setEndDate] = useState<Date | undefined>(defaultDate || new Date())
    const [checklistTemplate, setChecklistTemplate] = useState<ChecklistPhase[]>([])
    const [selectedColor, setSelectedColor] = useState("#3b82f6")

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message)
                onOpenChange(false)
            } else {
                toast.error(state.message)
            }
        }
    }, [state, onOpenChange])

    useEffect(() => {
        if (defaultDate) {
            setStartDate(defaultDate)
            setEndDate(defaultDate)
        }
    }, [defaultDate])

    const handleCourseChange = async (courseId: string) => {
        if (courseId && courseId !== "none") {
            const template = await getCourseChecklistTemplate(courseId)
            if (template) {
                // @ts-ignore
                setChecklistTemplate(template)
            } else {
                setChecklistTemplate([])
            }
        } else {
            setChecklistTemplate([])
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Course to Calendar</DialogTitle>
                </DialogHeader>
                <form action={formAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="course" className="text-right">
                                Course
                            </Label>
                            <Select name="courseId" onValueChange={handleCourseChange}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select course (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Course</SelectItem>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                className="col-span-3"
                                placeholder="Event title"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Color</Label>
                            <div className="col-span-3 flex gap-2">
                                {[
                                    { value: "#3b82f6", label: "Blue" },
                                    { value: "#22c55e", label: "Green" },
                                    { value: "#ef4444", label: "Red" },
                                    { value: "#eab308", label: "Yellow" },
                                    { value: "#a855f7", label: "Purple" },
                                    { value: "#ec4899", label: "Pink" },
                                    { value: "#6b7280", label: "Gray" },
                                ].map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        className={`w-6 h-6 rounded-full transition-all ${selectedColor === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-110"}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setSelectedColor(c.value)}
                                        title={c.label}
                                    />
                                ))}
                                <input type="hidden" name="color" value={selectedColor} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Start Date</Label>
                            <div className="col-span-3">
                                <DateTimePicker date={startDate} setDate={setStartDate} />
                                <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ""} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">End Date</Label>
                            <div className="col-span-3">
                                <DateTimePicker date={endDate} setDate={setEndDate} />
                                <input type="hidden" name="endDate" value={endDate ? endDate.toISOString() : ""} />
                            </div>
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
                                    {instructors.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                                Checklist
                            </Label>
                            <div className="col-span-3 space-y-2">
                                {checklistTemplate.length > 0 ? (
                                    <div className="border rounded-md p-3 bg-muted/50 text-sm space-y-3 max-h-[200px] overflow-y-auto">
                                        <p className="font-semibold text-muted-foreground">Auto-loaded Checklist:</p>
                                        {checklistTemplate.map((phase) => (
                                            <div key={phase.id} className="space-y-1">
                                                <p className="font-medium text-xs uppercase tracking-wider text-primary">{phase.title}</p>
                                                <ul className="list-disc list-inside pl-1 text-muted-foreground">
                                                    {phase.items.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic py-2">Select a course to load its checklist.</p>
                                )}
                                <input type="hidden" name="checklist" value={JSON.stringify(checklistTemplate)} />
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
