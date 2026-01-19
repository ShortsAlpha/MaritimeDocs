'use client';

import { approveDocument, rejectDocument, getDocumentPreviewUrl } from "@/app/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText, Loader2, X, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PendingDocument {
    id: string;
    title: string | null;
    fileUrl: string;
    fileType: string;
    createdAt: Date;
    student: {
        id: string;
        fullName: string;
    };
    documentType: {
        title: string;
    };
}

export function PendingDocsWidget({ documents }: { documents: PendingDocument[] }) {
    const router = useRouter();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null);
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [router]);

    async function handleApprove(id: string) {
        setProcessingId(id);
        const res = await approveDocument(id);
        if (res.success) {
            toast.success("Document approved");
            router.refresh();
        } else {
            toast.error("Failed to approve");
        }
        setProcessingId(null);
    }

    async function handleReject(id: string) {
        setProcessingId(id);
        const res = await rejectDocument(id);
        if (res.success) {
            toast.success("Document rejected");
            router.refresh();
        } else {
            toast.error("Failed to reject");
        }
        setProcessingId(null);
    }

    async function handlePreview(doc: PendingDocument) {
        setLoadingPreview(doc.id);
        const res = await getDocumentPreviewUrl(doc.id);
        if (res.success && res.url) {
            setSelectedDoc({ ...doc, fileUrl: res.url });
        } else {
            toast.error("Preview failed");
        }
        setLoadingPreview(null);
    }

    if (documents.length === 0) {
        return (
            <Card className="h-full border-none shadow-sm bg-background/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        Pending Documents
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground p-6 text-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-green-500/10 to-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">All Caught Up!</h3>
                    <p className="text-sm max-w-[200px]">There are no pending documents to review right now.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="h-full border-none shadow-sm flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        Pending Documents
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-500/20 dark:text-yellow-400">
                            {documents.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                    <div className="divide-y">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 hover:bg-muted/50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                            {doc.student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <Link
                                                href={`/admin/students/${doc.student.id}`}
                                                className="text-sm font-semibold hover:text-primary transition-colors truncate"
                                            >
                                                {doc.student.fullName}
                                            </Link>
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <FileText className="h-3 w-3" />
                                            <span className="truncate">{doc.documentType.title}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs gap-1.5 flex-1 sm:flex-none border-dashed hover:border-solid hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-800 dark:hover:text-blue-400"
                                                onClick={() => handlePreview(doc)}
                                                disabled={loadingPreview === doc.id}
                                            >
                                                {loadingPreview === doc.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Eye className="h-3 w-3" />
                                                )}
                                                Preview
                                            </Button>

                                            <div className="flex items-center gap-1 ml-auto">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => handleReject(doc.id)}
                                                    disabled={!!processingId}
                                                    title="Reject Document"
                                                >
                                                    {processingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                                    onClick={() => handleApprove(doc.id)}
                                                    disabled={!!processingId}
                                                    title="Approve Document"
                                                >
                                                    {processingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 sm:max-w-[90vw]">
                    <DialogHeader className="p-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <span className="truncate max-w-[500px]">{selectedDoc?.title || selectedDoc?.documentType.title || "Document Preview"}</span>
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
        </>
    );
}
