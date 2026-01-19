'use client'

import { createInstructor } from "@/app/actions/instructors"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"

const initialState = {
    message: "",
    success: false
}

export function CreateInstructorDialog() {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(createInstructor, initialState)

    useEffect(() => {
        if (state.success) {
            toast.success(state.message)
            setOpen(false)
        } else if (state.message) {
            toast.error(state.message)
        }
    }, [state])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Instructor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Instructor</DialogTitle>
                    <DialogDescription>
                        Create a profile for a new instructor. Staff accounts are managed separately.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullName" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Captain John Doe"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@xone.com"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+1 234 567 890"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="specialties" className="text-right">
                                Specialties
                            </Label>
                            <Input
                                id="specialties"
                                name="specialties"
                                placeholder="Navigation, Radio, Safety"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="employmentType" className="text-right">
                                Employment
                            </Label>
                            <div className="col-span-3">
                                <Select name="employmentType" defaultValue="FULL_TIME">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bio" className="text-right">
                                Bio
                            </Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Short biography..."
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Creating..." : "Create Instructor"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
