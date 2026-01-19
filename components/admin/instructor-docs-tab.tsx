'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Trash2, UploadCloud, Eye, Loader2, Upload } from "lucide-react"
import { format } from "date-fns"
import { getDownloadUrl, getUploadUrl } from "@/app/actions/uploads"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { saveInstructorDocument, deleteInstructorDocument } from "@/app/actions/instructor-docs"

function DocUploadDialog({ instructorId, docType, onUploadComplete }: { instructorId: string, docType: any, onUploadComplete: () => void }) {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // 1. Get Presigned URL
            const { uploadUrl, key } = await getUploadUrl(file.name, file.type, `instructors/${instructorId}`)

            // 2. Upload to R2
            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type }
            })

            // 3. Save to DB
            const result = await saveInstructorDocument(instructorId, docType.title, key, file.type, docType.id)

            if (result.success) {
                toast.success("Document uploaded successfully")
                onUploadComplete()
                setOpen(false)
            } else {
                throw new Error("Failed to save document record")
            }
        } catch (error) {
            console.error("Upload failed", error)
            toast.error("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload {docType.title}</DialogTitle>
                </DialogHeader>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="file">Document</Label>
                    <Input id="file" type="file" onChange={handleFileChange} disabled={uploading} />
                    {uploading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</p>}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DocPreviewDialog({ url, title, open, onOpenChange }: { url: string | null, title: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] w-full h-[95vh] p-4 flex flex-col">
                <DialogHeader className="px-0">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {url ? (
                    <iframe src={url} className="w-full h-full rounded-md border flex-1" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function DocList({ title, docs, docTypes, instructorId }: { title: string, docs: any[], docTypes: any[], instructorId: string }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState("")
    const [previewOpen, setPreviewOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [docToDelete, setDocToDelete] = useState<{ id: string, fileUrl: string } | null>(null)

    return (
        <>
            <DocPreviewDialog
                url={previewUrl}
                title={previewTitle}
                open={previewOpen}
                onOpenChange={(open) => {
                    setPreviewOpen(open)
                    if (!open) setPreviewUrl(null)
                }}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                                if (docToDelete) {
                                    const result = await deleteInstructorDocument(docToDelete.id, docToDelete.fileUrl)
                                    if (result.success) {
                                        toast.success("Document deleted")
                                    } else {
                                        toast.error("Delete failed")
                                    }
                                    setDocToDelete(null)
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docTypes.map(type => {
                                const uploadedDocs = docs.filter(d => d.documentTypeId === type.id)
                                const hasDoc = uploadedDocs.length > 0
                                const latestDoc = hasDoc ? uploadedDocs[0] : null

                                return (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {type.title}
                                                {type.isRequired && <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {hasDoc ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">Uploaded</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Missing</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {latestDoc ? format(new Date(latestDoc.createdAt), "MMM d, yyyy") : "-"}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {latestDoc ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            setPreviewTitle(type.title)
                                                            setPreviewOpen(true)
                                                            const res = await getDownloadUrl(latestDoc.fileUrl, { inline: true })
                                                            if (res.success && res.url) {
                                                                setPreviewUrl(res.url)
                                                            } else {
                                                                toast.error("Failed to load preview")
                                                                setPreviewOpen(false)
                                                            }
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            const res = await getDownloadUrl(latestDoc.fileUrl)
                                                            if (res.success && res.url) {
                                                                window.open(res.url, "_blank")
                                                            } else {
                                                                toast.error("Failed to download")
                                                            }
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            setDocToDelete({ id: latestDoc.id, fileUrl: latestDoc.fileUrl })
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <DocUploadDialog
                                                    instructorId={instructorId}
                                                    docType={type}
                                                    onUploadComplete={() => { }}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}

type Props = {
    instructor: any
    docTypes: any[]
}

export function InstructorDocsTab({ instructor, docTypes }: Props) {
    // Separate documents that have a type and those that don't (extras)
    const typedDocs = instructor.documents.filter((d: any) => d.documentTypeId)
    const extraDocs = instructor.documents.filter((d: any) => !d.documentTypeId)

    return (
        <div className="space-y-6">
            <DocList
                title="Required Documents"
                docs={typedDocs}
                docTypes={docTypes}
                instructorId={instructor.id}
            />

            {/* If there are extra docs uploaded manually before we had types, simply list them or create a generic list. 
                For now, we just show the main typed list as requested. 
                If the user wants 'Other Documents' section we can add it later.
            */}
        </div>
    )
}
