"use client"

import { useState } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { updateStudent } from "@/app/actions/students"
import { toast } from "sonner"
import Select from "react-select"

interface StudentCoursesEditProps {
    studentId: string
    currentCourses: { id: string; title: string }[]
    allCourses: { id: string; title: string }[]
}

export function StudentCoursesEdit({ studentId, currentCourses, allCourses }: StudentCoursesEditProps) {
    const [open, setOpen] = useState(false)
    const [selectedCourses, setSelectedCourses] = useState<readonly any[]>(
        currentCourses.map(c => ({ value: c.id, label: c.title }))
    )
    const [saving, setSaving] = useState(false)

    async function handleUpdate(formData: FormData) {
        setSaving(true)
        const res = await updateStudent(studentId, null, formData)
        setSaving(false)
        if (res.success) {
            toast.success("Courses updated successfully")
            setOpen(false)
        } else {
            toast.error(res.message)
        }
    }

    return (
        <div className="group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors border">
            <div className="flex items-center gap-3 w-full">
                <div className="flex-1 w-full relative">
                    <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                    <div className="mt-1 flex flex-col gap-1 w-full">
                        {currentCourses.length > 0 ? currentCourses.map(c => (
                            <span key={c.id} className="text-sm font-semibold block uppercase">
                                {c.title}
                            </span>
                        )) : <span className="text-muted-foreground italic text-sm">No courses</span>}
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3 w-3" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Courses</DialogTitle>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Courses</Label>
                            <Select
                                isMulti
                                name="coursesSelect"
                                options={allCourses.map(c => ({ value: c.id, label: c.title }))}
                                value={selectedCourses}
                                onChange={(newValue) => setSelectedCourses(newValue)}
                                placeholder="Select courses..."
                                unstyled
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `flex w-full min-h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
                                    menu: () => "mt-1 rounded-md border bg-popover text-popover-foreground shadow-md z-50",
                                    menuList: () => "p-1",
                                    option: ({ isFocused, isSelected }) =>
                                        `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none ${isFocused ? 'bg-accent text-accent-foreground' : ''} ${isSelected ? 'bg-accent/50 font-medium' : ''}`,
                                    multiValue: () => "flex items-center gap-1 bg-secondary text-secondary-foreground rounded-sm px-1.5 py-0.5 m-0.5",
                                    multiValueLabel: () => "text-xs",
                                    multiValueRemove: () => "hover:bg-destructive hover:text-destructive-foreground rounded-sm px-0.5 cursor-pointer",
                                    input: () => "text-sm text-foreground m-0 p-0",
                                    placeholder: () => "text-muted-foreground text-sm",
                                    clearIndicator: () => "text-muted-foreground hover:text-foreground cursor-pointer p-1",
                                    dropdownIndicator: () => "text-muted-foreground hover:text-foreground cursor-pointer p-1",
                                    noOptionsMessage: () => "text-muted-foreground text-sm py-2",
                                }}
                            />
                            <input 
                                type="hidden" 
                                name="courses" 
                                value={JSON.stringify(selectedCourses.map(c => c.value))} 
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
