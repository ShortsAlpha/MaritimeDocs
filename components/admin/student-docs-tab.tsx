'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { uploadStudentDocument, deleteStudentDocument, getDownloadUrl } from "@/app/actions/uploads";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// R2 Upload Helper (simplified for internal use - assumes we get a presigned URL or just use server action for small files if we changed strategy, 
// BUT typically we still want direct-to-R2. 
// For this Internal CRM MVP, let's assume we use the server action 'uploadStudentDocument' which takes a fileUrl.
// So we still need the R2 upload logic. 
// I'll reuse the logic from the previous portal implementation but inline it here for simplicity.
// Wait, I need a server action to GET the presigned URL first. I'll use the existing /api/upload route or similar?
// Actually, for simplicity in this pivot, I'll rely on the existing 'student-upload.ts' pattern IF it was doing presigned stuff.
// Checking previous steps, 'document-upload.ts' was saving the record.
// I need a client-side upload handler.

function DocUploadDialog({ studentId, studentName, docType, onUploadComplete }: { studentId: string, studentName: string, docType: any, onUploadComplete: () => void }) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            // Create a safe folder name from student name
            const safeName = studentName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
            formData.append("subFolder", `students/${safeName}`);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Upload failed");
            }

            const { fileUrl } = await res.json();

            // Save Record
            await uploadStudentDocument(studentId, docType.id, fileUrl, file.type);

            onUploadComplete();
            setOpen(false);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
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

function DocList({ title, docs, docTypes, category, studentId, studentName }: { title: string, docs: any[], docTypes: any[], category: string, studentId: string, studentName: string }) {
    const categoryTypes = docTypes.filter(dt => dt.category === category);

    return (
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
                        {categoryTypes.map(type => {
                            const uploadedDocs = docs.filter(d => d.documentTypeId === type.id);
                            const hasDoc = uploadedDocs.length > 0;
                            const latestDoc = hasDoc ? uploadedDocs[0] : null; // Show latest if multiple?

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
                                                        const res = await getDownloadUrl(latestDoc.fileUrl);
                                                        if (res.success && res.url) {
                                                            window.location.href = res.url;
                                                        } else {
                                                            alert("Failed to download: " + (res.message || "Unknown error"));
                                                        }
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={async () => {
                                                        if (confirm("Delete this document?")) {
                                                            await deleteStudentDocument(latestDoc.id, studentId);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <DocUploadDialog
                                                studentId={studentId}
                                                studentName={studentName}
                                                docType={type}
                                                onUploadComplete={() => { }} // revalidatePath handles UI update
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
    )
}

export function StudentDocsTab({ student, docTypes }: { student: any, docTypes: any[] }) {
    return (
        <div className="space-y-6">
            <DocList
                title="Office Documents"
                docs={student.documents}
                docTypes={docTypes}
                category="OFFICE"
                studentId={student.id}
                studentName={student.fullName}
            />
            <DocList
                title="Student Documents"
                docs={student.documents}
                docTypes={docTypes}
                category="STUDENT"
                studentId={student.id}
                studentName={student.fullName}
            />
        </div>
    )
}
