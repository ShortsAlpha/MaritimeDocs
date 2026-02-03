'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, CalendarIcon } from "lucide-react"
import { createStudent } from "@/app/actions/students"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Course } from "@prisma/client"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Student"}
        </Button>
    )
}

type Props = {
    courses: Course[]
    intakes?: any[]
}

export function CreateStudentDialog({ courses = [], intakes = [] }: Props) {
    const [open, setOpen] = useState(false)
    const [dob, setDob] = useState<Date | undefined>(undefined)
    const [inputValue, setInputValue] = useState("")

    async function handleSubmit(formData: FormData) {
        const res = await createStudent(null, formData)
        if (res.success) {
            setOpen(false)
        } else {
            console.error(res.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Student
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" required placeholder="John Doe" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Select name="course">
                            <SelectTrigger className="w-full h-auto min-h-10 py-2 whitespace-normal [&>span]:line-clamp-none text-left">
                                <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c) => (
                                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="intakeId">Intake (Optional)</Label>
                            <Select name="intakeId">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select intake" />
                                </SelectTrigger>
                                <SelectContent>
                                    {intakes.map((intake) => (
                                        <SelectItem key={intake.id} value={intake.id}>{intake.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input id="nationality" name="nationality" placeholder="e.g. Turkish" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" placeholder="+1 234..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="DD.MM.YYYY"
                                    value={inputValue}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (value.match(/[^0-9.]/)) return
                                        if (value.length > 10) return

                                        setInputValue(value)

                                        if (value.length === 10) {
                                            const parsed = parse(value, "dd.MM.yyyy", new Date())
                                            if (isValid(parsed) && value === format(parsed, "dd.MM.yyyy")) {
                                                setDob(parsed)
                                            } else {
                                                setDob(undefined)
                                            }
                                        } else {
                                            setDob(undefined)
                                        }
                                    }}
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            size="icon"
                                            className={cn(
                                                "w-10 pl-0 text-left font-normal",
                                                !dob && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="h-4 w-4 opacity-50 mx-auto" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dob}
                                            onSelect={(date) => {
                                                setDob(date)
                                                if (date) {
                                                    setInputValue(format(date, "dd.MM.yyyy"))
                                                } else {
                                                    setInputValue("")
                                                }
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <input type="hidden" name="dateOfBirth" value={dob ? format(dob, "yyyy-MM-dd") : ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalFee">Total Course Fee (€)</Label>
                            <Input id="totalFee" name="totalFee" type="number" defaultValue="0" required min="0" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
