"use client"

import { useState } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStudent } from "@/app/actions/students"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

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
    name: "fullName" | "email" | "phone" | "address"
    value: string | null | undefined
    type?: string
    isMultiline?: boolean
}

export function EditableField({ studentId, label, name, value, type = "text", isMultiline = false }: EditableFieldProps) {
    const [open, setOpen] = useState(false)

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
                {/* Icon slot passed from parent or generic? We'll keep parent structure */}
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold truncate max-w-[200px] md:max-w-xs block">
                        {value || <span className="text-muted-foreground italic">Not set</span>}
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
