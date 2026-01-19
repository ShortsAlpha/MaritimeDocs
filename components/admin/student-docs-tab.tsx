'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, Trash2, CloudUpload, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteStudentDocument, getDocumentPreviewUrl } from "@/app/actions/documents";

interface DocumentType {
    id: string;
    title: string;
    description: string | null;
    category: "OFFICE" | "STUDENT" | "CERTIFICATE" | "MEDICAL" | "INSTRUCTOR";
    isRequired: boolean;
}

interface StudentDocument {
    id: string;
    title: string | null;
    fileUrl: string;
    fileType: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    documentTypeId: string;
    documentType: DocumentType;
}

interface StudentDocsTabProps {
    student: {
        id: string;
        documents: StudentDocument[];
    };
    docTypes: DocumentType[];
}

export function StudentDocsTab({ student, docTypes }: StudentDocsTabProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<StudentDocument | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const categories = ["OFFICE", "STUDENT", "MEDICAL", "CERTIFICATE"];

    async function handlePreview(doc: StudentDocument) {
        setLoadingPreview(true);
        const res = await getDocumentPreviewUrl(doc.id);
        if (res.success && res.url) {
            setSelectedDoc({ ...doc, fileUrl: res.url });
        } else {
            toast.error("Preview failed");
            // Fallback to public URL just in case
            setSelectedDoc(doc);
        }
        setLoadingPreview(false);
    }

    async function handleDelete(docId: string) {
        if (!confirm("Are you sure you want to delete this document?")) return;
        setDeletingId(docId);
        const res = await deleteStudentDocument(docId);
        if (res.success) {
            toast.success("Document deleted");
            router.refresh();
        } else {
            toast.error("Failed to delete document");
        }
        setDeletingId(null);
    }

    return (
        <div className="space-y-8">
            {categories.map((category) => {
                const categoryTypes = docTypes.filter((dt) => dt.category === category);
                if (categoryTypes.length === 0) return null;

                const categoryName = category.charAt(0) + category.slice(1).toLowerCase() + " Documents";

                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold tracking-tight">{categoryName}</h3>
                        </div>
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[40%]">Document Type</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryTypes.map((type) => {
                                        const uploadedDoc = student.documents.find(
                                            (d) => d.documentTypeId === type.id
                                        );

                                        return (
                                            <TableRow key={type.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm flex items-center gap-2">
                                                                {type.title}
                                                                {type.isRequired && (
                                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                                        Required
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                            {uploadedDoc && uploadedDoc.title && uploadedDoc.title !== type.title && (
                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                    {uploadedDoc.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {uploadedDoc ? (
                                                        <span className="text-sm text-foreground">
                                                            {format(new Date(uploadedDoc.createdAt), "MMM d, yyyy")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {uploadedDoc ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => handlePreview(uploadedDoc)}
                                                                    disabled={loadingPreview}
                                                                >
                                                                    {loadingPreview && selectedDoc?.id === uploadedDoc.id ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <a href={uploadedDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleDelete(uploadedDoc.id)}
                                                                    disabled={!!deletingId}
                                                                >
                                                                    {deletingId === uploadedDoc.id ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                                                <CloudUpload className="h-3 w-3" />
                                                                Upload
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                );
            })}

            {/* Preview Dialog */}
            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 sm:max-w-[90vw]">
                    <DialogHeader className="p-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <span className="truncate max-w-[500px]">{selectedDoc?.title || "Document Preview"}</span>
                            {selectedDoc && (
                                <Badge variant="outline" className="ml-2 font-normal">
                                    {selectedDoc.fileType.toUpperCase()}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900 relative">
                        {selectedDoc ? (
                            selectedDoc.fileType === 'pdf' ? (
                                <iframe
                                    src={selectedDoc.fileUrl}
                                    className="w-full h-full border-0"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={selectedDoc.fileUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain shadow-lg rounded-sm"
                                    />
                                </div>
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading preview...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {student.documents.length === 0 && docTypes.length === 0 && (
                <div className="text-center py-12 text-zinc-500">No documents or document types found.</div>
            )}
        </div>
    );
}
