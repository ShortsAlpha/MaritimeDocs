"use client"

import { useState } from "react"
import { Pencil, Loader2, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStudent } from "@/app/actions/students"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"

import Select from "react-select"
import countriesData from "@/official-names-of-countries-2026.json"

const countryOptions = countriesData.map((c: any) => ({ value: c.country, label: c.country }))

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
    )
}

interface EditableFieldProps {
    studentId: string
    label: string
    name: string
    value: string | null | undefined
    displayValue?: string | null
    type?: string
    isMultiline?: boolean
    noTruncate?: boolean
}

export function EditableField({ studentId, label, name, value, displayValue, type = "text", isMultiline = false, noTruncate = false }: EditableFieldProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(
        type === "date" && value ? new Date(value) : undefined
    )
    const [inputValue, setInputValue] = useState(
        type === "date" && value ? format(new Date(value), "dd.MM.yyyy") : ""
    )
    
    // For nationality
    const initialNationality = type === "nationality" && value 
        ? { value: value, label: value } 
        : null;
    const [selectedNationality, setSelectedNationality] = useState<any>(initialNationality)

    async function handleUpdate(formData: FormData) {
        const res = await updateStudent(studentId, null, formData)
        if (res.success) {
            toast.success("Updated successfully")
            setOpen(false)
        } else {
            toast.error(res.message)
        }
    }

    return (
        <div className="group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className={`text-sm font-semibold block ${noTruncate ? "" : "truncate max-w-[200px] md:max-w-xs"}`}>
                        {(displayValue !== undefined ? displayValue : value) || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3 w-3" />
                    </Button>
                </DialogTrigger>
                <DialogContent className={type === "nationality" ? "overflow-visible" : ""}>
                    <DialogHeader>
                        <DialogTitle>Edit {label}</DialogTitle>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={name}>{label}</Label>
                            {isMultiline ? (
                                <textarea
                                    id={name}
                                    name={name}
                                    defaultValue={value || ""}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            ) : type === "date" ? (
                                <>
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
                                                        setDate(parsed)
                                                    } else {
                                                        setDate(undefined)
                                                    }
                                                } else {
                                                    setDate(undefined)
                                                }
                                            }}
                                        />
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    size="icon"
                                                    className={cn(
                                                        "w-10 pl-0 text-left font-normal shrink-0",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="h-4 w-4 opacity-50 mx-auto" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={(d) => {
                                                        setDate(d)
                                                        if (d) {
                                                            setInputValue(format(d, "dd.MM.yyyy"))
                                                        } else {
                                                            setInputValue("")
                                                        }
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />
                                </>
                            ) : type === "nationality" ? (
                                <>
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
                                    <input type="hidden" name={name} value={selectedNationality?.value || ""} />
                                </>
                            ) : (
                                <Input id={name} name={name} type={type} defaultValue={value || ""} />
                            )}
                        </div>
                        <div className="flex justify-end">
                            <SubmitButton />
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
