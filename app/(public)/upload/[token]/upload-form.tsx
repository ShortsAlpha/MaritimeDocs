'use client';

import { uploadPendingDocument } from "@/app/actions/documents";

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

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File is too large (Max 10MB). Please contact support if you have issues.");
            event.target.value = ""; // Clear input
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("token", token);
        formData.append("documentTypeId", documentTypeId);

        const res = await uploadPendingDocument(formData);

        if (res.success) {
            toast.success("Document uploaded successfully");
            router.refresh();
        } else {
            toast.error(res.message || "Failed to upload document");
            // Reset the form so they can try again if it failed
            if (formRef.current) formRef.current.reset();
        }
        setIsUploading(false);
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
