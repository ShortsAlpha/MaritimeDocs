'use client'

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateDocumentType } from "@/app/actions/document-type"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

export function EditDocTypeDialog({ docType }: { docType: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            await updateDocumentType(docType.id, formData)
            toast.success("Document type updated")
            setOpen(false)
        } catch (error) {
            toast.error("Failed to update document type")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Document Type</DialogTitle>
                    <DialogDescription>
                        Make changes to the document type here.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input id="title" name="title" defaultValue={docType.title} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <div className="col-span-3">
                                <Select name="category" defaultValue={docType.category}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OFFICE">Office</SelectItem>
                                        <SelectItem value="STUDENT">Student</SelectItem>
                                        <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                                        <SelectItem value="MEDICAL">Medical</SelectItem>
                                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="col-start-2 col-span-3 flex items-center space-x-2">
                                <Checkbox id="isRequired" name="isRequired" defaultChecked={docType.isRequired} />
                                <Label htmlFor="isRequired">Required Document</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
