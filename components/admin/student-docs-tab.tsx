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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { FileText, Download, Trash2, CloudUpload, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteStudentDocument, getDocumentPreviewUrl, generatePresignedUploadUrl, saveAdminDocumentRecord } from "@/app/actions/documents";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
        courses?: {
            id: string;
            title: string;
            requiredDocuments?: { documentTypeId: string }[];
        }[];
    };
    docTypes: DocumentType[];
}

export function StudentDocsTab({ student, docTypes }: StudentDocsTabProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<StudentDocument | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [uploadDocTypeId, setUploadDocTypeId] = useState<string | null>(null);

    const categories = ["OFFICE", "STUDENT", "MEDICAL", "CERTIFICATE"];
    const courses = student.courses || [];
    const defaultTab = courses.length > 0 ? courses[0].id : "general";

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

    async function handleDownload(doc: StudentDocument) {
        toast.info("Generating secure download link...");
        const res = await getDocumentPreviewUrl(doc.id);
        if (res.success && res.url) {
            window.open(res.url, "_blank", "noopener,noreferrer");
        } else {
            toast.error(res.message || "Failed to generate download link");
        }
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

    const renderDocumentCategories = (courseId?: string) => {
        let hasAnyDocs = false;
        const renderedCategories = categories.map((category) => {
            let categoryTypes = docTypes.filter((dt) => dt.category === category);
            
            // Filter the docTypes based on its requiredDocuments
            if (courseId) {
                const currentCourse = courses.find(c => c.id === courseId);
                if (currentCourse && currentCourse.requiredDocuments && currentCourse.requiredDocuments.length > 0) {
                    const requiredDocTypeIds = currentCourse.requiredDocuments.map(rd => rd.documentTypeId);
                    categoryTypes = categoryTypes.filter(dt => requiredDocTypeIds.includes(dt.id));
                } else if (currentCourse && (!currentCourse.requiredDocuments || currentCourse.requiredDocuments.length === 0)) {
                    categoryTypes = []; // Force empty if no mappings exist
                }
            }

            if (categoryTypes.length === 0) return null;
            hasAnyDocs = true;

            const categoryName = category.charAt(0) + category.slice(1).toLowerCase() + " Documents";

            return (
                <div key={category} className="space-y-2 md:space-y-4 overflow-hidden w-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm md:text-lg font-semibold tracking-tight">{categoryName}</h3>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-2">
                            {categoryTypes.map((type) => {
                                // Important: We sort documents so that the latest version is always shown if multiple exist
                                const sortedDocs = [...student.documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                const uploadedDoc = sortedDocs.find(
                                    (d) => d.documentTypeId === type.id
                                );

                                return (
                                    <div key={type.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="p-1.5 bg-muted rounded-md text-muted-foreground shrink-0">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-xs truncate flex items-center gap-1.5">
                                                    {type.title}
                                                    {type.isRequired && (
                                                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-normal shrink-0">
                                                            Req
                                                        </Badge>
                                                    )}
                                                </span>
                                                {uploadedDoc ? (
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {format(new Date(uploadedDoc.createdAt), "MMM d, yyyy")}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">Not uploaded</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 ml-2">
                                            {uploadedDoc ? (
                                                <div className="flex items-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handlePreview(uploadedDoc)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleDownload(uploadedDoc)}
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive"
                                                        onClick={() => handleDelete(uploadedDoc.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => setUploadDocTypeId(type.id)}
                                                >
                                                    <CloudUpload className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block rounded-md border bg-card">
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
                                        const sortedDocs = [...student.documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                        const uploadedDoc = sortedDocs.find(
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
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8" 
                                                                    onClick={() => handleDownload(uploadedDoc)}
                                                                >
                                                                    <Download className="h-4 w-4" />
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
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-2"
                                                                onClick={() => setUploadDocTypeId(type.id)}
                                                            >
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
            });

        if (!hasAnyDocs) {
            return (
                <div className="p-8 mt-4 text-center border border-dashed rounded-lg bg-muted/20 text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <div>
                        <h3 className="font-medium text-foreground">No Requirements Mapped</h3>
                        <p className="text-sm mt-1">This course does not have any specific document requirements defined in the database.</p>
                        <p className="text-sm mt-1">Please ask an administrator to add required documents for this course.</p>
                    </div>
                </div>
            );
        }

        return <div className="space-y-8 mt-4">{renderedCategories}</div>;
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex w-full justify-start overflow-x-auto flex-nowrap mb-4 pb-1">
                {courses.map(course => {
                    const shortTitle = course.title.split(' - ')[0].split(' (')[0].trim();
                    return (
                        <TabsTrigger key={course.id} value={course.id} className="text-xs sm:text-sm whitespace-nowrap" title={course.title}>
                            {shortTitle.length > 35 ? shortTitle.substring(0, 35) + '...' : shortTitle}
                        </TabsTrigger>
                    );
                })}
            </TabsList>

                {courses.length === 0 ? (
                    <div className="p-8 mt-4 text-center border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                        No courses enrolled. Enroll the student in a course to manage documents.
                    </div>
                ) : (
                    courses.map(course => (
                        <TabsContent key={course.id} value={course.id}>
                            {renderDocumentCategories(course.id)}
                        </TabsContent>
                    ))
                )}
            </Tabs>

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

            <AdminUploadDialog
                open={!!uploadDocTypeId}
                onOpenChange={(open) => !open && setUploadDocTypeId(null)}
                studentId={student.id}
                documentTypeId={uploadDocTypeId || ""}
                onSuccess={() => {
                    setUploadDocTypeId(null);
                    router.refresh();
                }}
            />


            {student.documents.length === 0 && docTypes.length === 0 && (
                <div className="text-center py-12 text-zinc-500">No documents or document types found.</div>
            )}
        </div>
    );
}

function AdminUploadDialog({
    open,
    onOpenChange,
    studentId,
    documentTypeId,
    onSuccess
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    documentTypeId: string;
    onSuccess: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    async function handleUpload() {
        if (!file) return;

        // 20MB Limit for direct uploads
        if (file.size > 20 * 1024 * 1024) {
            toast.error("File is too large (Max 20MB).");
            return;
        }

        setUploading(true);
        try {
            // 1. Get Presigned URL
            const urlRes = await generatePresignedUploadUrl(`students/${studentId}/documents/admin-upload`, file.name, file.type);
            if (!urlRes.success || !urlRes.signedUrl || !urlRes.publicUrl) {
                throw new Error(urlRes.message || "Failed to get upload authorization");
            }

            // 2. Upload directly to Cloudflare R2
            const uploadRes = await fetch(urlRes.signedUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error(`R2 Upload failed with status ${uploadRes.status}`);
            }

            // 3. Save Record in Database
            const saveRes = await saveAdminDocumentRecord(
                studentId,
                documentTypeId,
                urlRes.publicUrl,
                file.type,
                file.name,
                file.size
            );

            if (saveRes.success) {
                toast.success("Document uploaded successfully");
                onSuccess();
                onOpenChange(false);
                setFile(null); // Reset file
            } else {
                throw new Error(saveRes.message || "Upload failed");
            }
        } catch (error: any) {
            console.error("Admin upload error:", error);
            toast.error("Upload failed! " + (error.message || "A network error occurred."));
        } finally {
            setUploading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select File</Label>
                        <Input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                        />
                    </div>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
