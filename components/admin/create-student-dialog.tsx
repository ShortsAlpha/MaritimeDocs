'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { createStudent } from "@/app/actions/students"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Student"}
        </Button>
    )
}

export function CreateStudentDialog() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await createStudent(null, formData)
        if (res.success) {
            setOpen(false)
        } else {
            // Optional: Handle error (e.g. toast)
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input id="phone" name="phone" placeholder="+1 234 567 890" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="totalFee">Total Course Fee (€)</Label>
                        <Input id="totalFee" name="totalFee" type="number" defaultValue="0" required min="0" />
                    </div>
                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
