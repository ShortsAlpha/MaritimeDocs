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

    // Re-sync input and date when modal opens to ensure fresh state if props change (optional, but good)
    // Actually, when 'open' changes to true, we might want to reset? 
    // For now we keep state persistent or re-init if needed.

    async function handleUpdate(formData: FormData) {
        // We only send the field being updated
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
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3 w-3" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
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
                                                // Allow only numbers and dots
                                                if (value.match(/[^0-9.]/)) return
                                                // Limit length to 10 (dd.mm.yyyy)
                                                if (value.length > 10) return

                                                setInputValue(value)

                                                if (value.length === 10) {
                                                    const parsed = parse(value, "dd.MM.yyyy", new Date())
                                                    // Check strict validity
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
