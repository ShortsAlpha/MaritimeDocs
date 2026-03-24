'use client';

import { getUploadUrl } from "@/app/actions/uploads";
import { sendExamNotesEmail } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadExamNoteFile } from "@/app/actions/documents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SendExamNotesDialog({ studentId, courseName, courses = [] }: { studentId: string, courseName?: string, courses?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [course, setCourse] = useState(courseName || "");
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setUploadProgress(0);

        if (!file || !course) {
            toast.error("Please select a course and a file");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Get Presigned URL directly from server to bypass 4.5MB Vercel payload limit
            const urlResult = await getUploadUrl(file.name, file.type, `students/${studentId}/exam-notes`);
            
            if (!urlResult.success || !urlResult.uploadUrl || !urlResult.key) {
                toast.error("Failed to generate secure upload link.");
                setIsLoading(false);
                return;
            }

            console.log("Presigned URL received, attempting XHR PUT to R2...", urlResult.uploadUrl.substring(0, 80));

            // 2. Upload natively via XHR to track 0-100% progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadProgress(100);
                        resolve();
                    } else {
                        reject(new Error(`Cloudflare R2 Error: ${xhr.status} - ${xhr.responseText.substring(0, 50)}`));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error("Network error during Cloudflare R2 upload.")));
                xhr.addEventListener('abort', () => reject(new Error("Upload aborted by user.")));

                xhr.open('PUT', urlResult.uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            const finalUrl = `${window.location.origin}/download?key=${encodeURIComponent(urlResult.key)}`;

            // 3. Send Email
            const emailRes = await sendExamNotesEmail(studentId, course, finalUrl);

            if (emailRes.success) {
                toast.success("Lecture notes sent successfully!");
                setIsOpen(false);
                setFile(null);
                setUploadProgress(0);
            } else {
                toast.error("Failed to send email");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Send Lecture Notes
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Lecture Notes</DialogTitle>
                    <DialogDescription>
                        Upload a file (PDF) to send to the student.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Course Name</Label>
                        <Select value={course} onValueChange={setCourse} required disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c) => (
                                    <SelectItem key={c.id} value={c.title}>
                                        {c.title}
                                    </SelectItem>
                                ))}
                                {/* Fallback if current course is not in list */}
                                {courseName && !courses.find(c => c.title === courseName) && (
                                    <SelectItem value={courseName}>{courseName}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Lecture Note File</Label>
                        <Input
                            type="file"
                            name="file"
                            required
                            accept=".pdf,.doc,.docx"
                            disabled={isLoading}
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    
                    {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-neutral-500 font-medium">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {isLoading && uploadProgress === 100 && (
                        <p className="text-xs text-center text-neutral-500 font-medium animate-pulse">
                            Upload complete. Generating and sending email...
                        </p>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Email"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
