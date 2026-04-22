'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, CalendarIcon } from "lucide-react"
import { createStudent } from "@/app/actions/students"
import { Select as RadixSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Course } from "@prisma/client"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import Select from "react-select"

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

import countriesData from "@/official-names-of-countries-2026.json"

const countryOptions = countriesData.map((c: any) => ({ value: c.country, label: c.country }))

export function CreateStudentDialog({ courses = [], intakes = [] }: Props) {
    const [open, setOpen] = useState(false)
    const [dob, setDob] = useState<Date | undefined>(undefined)
    const [inputValue, setInputValue] = useState("")
    const [selectedCourses, setSelectedCourses] = useState<readonly any[]>([])
    const [selectedNationality, setSelectedNationality] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        const res = await createStudent(null, formData)
        if (res.success) {
            setOpen(false)
            setSelectedCourses([])
            setSelectedNationality(null)
            setDob(undefined)
            setInputValue("")
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
                        <Label htmlFor="course">Courses</Label>
                        <Select
                            isMulti
                            name="coursesSelect"
                            options={courses.map(c => ({ value: c.id, label: c.title }))}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="intakeId">Intake (Optional)</Label>
                            <RadixSelect name="intakeId">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select intake" />
                                </SelectTrigger>
                                <SelectContent>
                                    {intakes.map((intake) => (
                                        <SelectItem key={intake.id} value={intake.id}>{intake.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </RadixSelect>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Select
                                name="nationalitySelect"
                                options={countryOptions}
                                value={selectedNationality}
                                onChange={(newValue) => setSelectedNationality(newValue)}
                                placeholder="Select country..."
                                unstyled
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `flex w-full min-h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
                                    menu: () => "mt-1 rounded-md border bg-popover text-popover-foreground shadow-md z-50",
                                    menuList: () => "p-1 max-h-[200px] overflow-auto",
                                    option: ({ isFocused, isSelected }) =>
                                        `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none ${isFocused ? 'bg-accent text-accent-foreground' : ''} ${isSelected ? 'bg-accent/50 font-medium' : ''}`,
                                    input: () => "text-sm text-foreground m-0 p-0",
                                    placeholder: () => "text-muted-foreground text-sm",
                                    clearIndicator: () => "text-muted-foreground hover:text-foreground cursor-pointer p-1",
                                    dropdownIndicator: () => "text-muted-foreground hover:text-foreground cursor-pointer p-1",
                                    noOptionsMessage: () => "text-muted-foreground text-sm py-2",
                                    singleValue: () => "text-sm text-foreground",
                                }}
                            />
                            <input type="hidden" name="nationality" value={selectedNationality?.value || ""} />
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
