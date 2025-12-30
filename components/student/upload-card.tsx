'use client'

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveDocumentRecord } from "@/app/actions/document-upload";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Label } from "../ui/label";

type UploadCardProps = {
    docType: {
        id: string;
        title: string;
        description: string | null;
        isRequired: boolean;
    };
    currentDoc: {
        status: "PENDING" | "APPROVED" | "REJECTED";
        fileUrl: string;
        feedback: string | null;
    } | null;
};

export function UploadCard({ docType, currentDoc }: UploadCardProps) {
    const [uploading, setUploading] = useState(false);
    const [expiry, setExpiry] = useState("");

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);

            // 1. Get Presigned URL
            const res = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({
                    fileType: file.type,
                    docTypeId: docType.id,
                }),
            });

            if (!res.ok) throw new Error("Failed to get upload URL");

            const { signedUrl, fileUrl } = await res.json();

            // 2. Upload to R2
            const uploadRes = await fetch(signedUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file,
            });

            if (!uploadRes.ok) throw new Error("Failed to upload file");

            // 3. Save Record
            await saveDocumentRecord(docType.id, fileUrl, file.type, expiry);

        } catch (error) {
            console.error(error);
            alert("Upload failed! Check console.");
        } finally {
            setUploading(false);
        }
    }

    const getStatusBadge = () => {
        if (!currentDoc) return <Badge variant="outline">Missing</Badge>;
        if (currentDoc.status === "APPROVED") return <Badge className="bg-green-500">Approved</Badge>;
        if (currentDoc.status === "REJECTED") return <Badge variant="destructive">Rejected</Badge>;
        return <Badge className="bg-yellow-500">Pending</Badge>;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {docType.title} {docType.isRequired && <span className="text-red-500">*</span>}
                </CardTitle>
                {getStatusBadge()}
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-4">{docType.description}</p>

                {currentDoc?.status === "REJECTED" && (
                    <div className="mb-4 text-xs bg-red-100 text-red-700 p-2 rounded">
                        <strong>Rejection Reason:</strong> {currentDoc.feedback}
                    </div>
                )}

                {(!currentDoc || currentDoc.status === "REJECTED") && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor={`expiry-${docType.id}`} className="text-xs">Expiry Date (If applicable)</Label>
                            <Input
                                type="date"
                                id={`expiry-${docType.id}`}
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`file-${docType.id}`} className="text-xs">Upload Document</Label>
                            <Input
                                id={`file-${docType.id}`}
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                                className="h-9 text-xs"
                            />
                        </div>
                        {uploading && <div className="text-xs flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</div>}
                    </div>
                )}

                {currentDoc && currentDoc.status !== "REJECTED" && (
                    <div className="text-sm text-muted-foreground">
                        Document uploaded.
                        <a href={currentDoc.fileUrl} target="_blank" className="block text-blue-500 hover:underline mt-1 text-xs">View File</a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
