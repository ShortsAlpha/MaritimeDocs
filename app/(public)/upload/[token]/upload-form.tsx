'use client';

import { generatePresignedUploadUrl, saveStudentDocumentRecord } from "@/app/actions/documents";

import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function UploadForm({ token, documentTypeId }: { token: string, documentTypeId: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        // 20MB Limit for direct uploads
        if (file.size > 20 * 1024 * 1024) {
            toast.error("File is too large (Max 20MB). Please contact support if you have issues.");
            event.target.value = ""; // Clear input
            return;
        }

        setIsUploading(true);
        try {
            // 1. Get Presigned URL
            const urlRes = await generatePresignedUploadUrl(`students/temp-upload-${token.substring(0,6)}`, file.name, file.type);
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
            const saveRes = await saveStudentDocumentRecord(
                token,
                documentTypeId,
                urlRes.publicUrl,
                file.type,
                file.name,
                file.size
            );

            if (saveRes.success) {
                toast.success("Document uploaded successfully! It is now in review.");
                router.refresh();
            } else {
                throw new Error(saveRes.message || "Failed to save document record");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Upload failed! " + (error.message || "A network error occurred. Please try again."), { duration: 5000 });
            if (formRef.current) formRef.current.reset();
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <form ref={formRef} className="w-full">
            <div className="relative">
                <Input
                    id={`file-upload-${documentTypeId}`}
                    type="file"
                    name="file"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden" // Hide the actual input
                />
                <label
                    htmlFor={`file-upload-${documentTypeId}`}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm h-10 cursor-pointer
                        ${isUploading
                            ? "bg-neutral-800 text-neutral-500 border-neutral-800 cursor-not-allowed"
                            : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        }
                    `}
                >
                    {isUploading ? (
                        <span className="flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <UploadCloud className="w-4 h-4 mr-2" />
                            Select Document to Upload
                        </span>
                    )}
                </label>
            </div>
        </form>
    );
}
