'use client';

import { getUploadUrl } from "@/app/actions/uploads";
import { sendExamNotesEmail } from "@/app/actions/email";
import { checkCloudLectureNotes } from "@/app/actions/lecture-notes";
import { sendCloudLectureNotes } from "@/app/actions/student-automation";
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
import { FileText, Loader2, Cloud, UploadCloud } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SendExamNotesDialog({ studentId, courseName, courses = [] }: { studentId: string, courseName?: string, courses?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // We store course ID if available, default to empty
    const defaultCourseId = courses.find(c => c.title === courseName)?.id || "";
    const [courseId, setCourseId] = useState(defaultCourseId);
    
    const [cloudFiles, setCloudFiles] = useState<any[]>([]);
    const [isCheckingCloud, setIsCheckingCloud] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'cloud' | 'manual'>('manual');
    
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const selectedCourseTitle = courses.find(c => c.id === courseId)?.title || courseName || "";

    useEffect(() => {
        if (!selectedCourseTitle || !isOpen) return;
        
        let active = true;
        setIsCheckingCloud(true);
        setCloudFiles([]);
        
        checkCloudLectureNotes(selectedCourseTitle).then(res => {
            if (!active) return;
            if (res.success && res.files) {
                setCloudFiles(res.files);
                if (res.files.length > 0) {
                    setDeliveryMethod('cloud');
                } else {
                    setDeliveryMethod('manual');
                }
            }
        }).finally(() => {
            if (active) setIsCheckingCloud(false);
        });

        return () => { active = false; };
    }, [selectedCourseTitle, isOpen]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        
        if (!courseId && !selectedCourseTitle) {
            toast.error("Please select a course");
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        try {
            if (deliveryMethod === 'cloud') {
                if (cloudFiles.length === 0) {
                    toast.error("No cloud files detected for this course.");
                    setIsLoading(false);
                    return;
                }
                
                const cId = courseId || courses.find(c => c.title === selectedCourseTitle)?.id;
                if (!cId) throw new Error("Could not map course ID.");

                const res = await sendCloudLectureNotes(studentId, cId, selectedCourseTitle);
                if (res.success) {
                    toast.success("Magic Student Portal Link sent successfully!");
                    setIsOpen(false);
                } else {
                    toast.error(res.error || "Failed to send lecture notes");
                }
            } else {
                // Manual Upload logic
                if (!file) {
                    toast.error("Please select a file to upload");
                    setIsLoading(false);
                    return;
                }

                // 1. Get Presigned URL directly from server to bypass payload limit
                const urlResult = await getUploadUrl(file.name, file.type, `students/${studentId}/exam-notes`);
                
                if (!urlResult.success || !urlResult.uploadUrl || !urlResult.key) {
                    toast.error("Failed to generate secure upload link.");
                    setIsLoading(false);
                    return;
                }

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

                    xhr.addEventListener('error', () => reject(new Error("Network error during upload.")));
                    xhr.addEventListener('abort', () => reject(new Error("Upload aborted by user.")));

                    xhr.open('PUT', urlResult.uploadUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                });

                const finalUrl = `${window.location.origin}/download?key=${encodeURIComponent(urlResult.key)}`;

                // 3. Send Email
                const emailRes = await sendExamNotesEmail(studentId, selectedCourseTitle, finalUrl);

                if (emailRes.success) {
                    toast.success("Lecture notes sent successfully!");
                    setIsOpen(false);
                    setFile(null);
                    setUploadProgress(0);
                } else {
                    toast.error("Failed to send email");
                }
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
                        Send auto-detected cloud notes or upload a custom file.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Course Name</Label>
                        <Select value={courseId} onValueChange={setCourseId} required disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isCheckingCloud && (
                        <div className="text-sm text-blue-600 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Checking cloud for files...
                        </div>
                    )}

                    {!isCheckingCloud && selectedCourseTitle && (
                        cloudFiles.length > 0 ? (
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-md text-sm border border-emerald-200 flex flex-col justify-center">
                                <div className="flex items-start gap-2">
                                    <Cloud className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span><strong>{cloudFiles.length} Cloud Documents</strong> available in the cloud.</span>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-[11px] opacity-85 border-t border-emerald-200/60 pt-2 pr-2">
                                            {cloudFiles.map((f, i) => (
                                                <div key={i} className="truncate font-medium flex items-center gap-1" title={f.name}>
                                                    <span className="text-emerald-500">•</span> {f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm border border-orange-200">
                                No cloud documents found. You must use manual upload.
                            </div>
                        )
                    )}

                    <Tabs value={deliveryMethod} onValueChange={(v: any) => setDeliveryMethod(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cloud" disabled={cloudFiles.length === 0}>
                                Cloud Portal
                            </TabsTrigger>
                            <TabsTrigger value="manual">Manual Upload</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="cloud" className="pt-2 text-sm text-neutral-500">
                            The student will receive a secure email link to download these {cloudFiles.length} documents.
                        </TabsContent>
                        <TabsContent value="manual" className="pt-2">
                            <div className="space-y-2">
                                <Label>Select Custom File</Label>
                                <Input
                                    type="file"
                                    name="file"
                                    required={deliveryMethod === 'manual'}
                                    accept=".pdf,.doc,.docx,.pptx"
                                    disabled={isLoading}
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                    
                    {isLoading && deliveryMethod === 'manual' && uploadProgress > 0 && uploadProgress < 100 && (
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
                    
                    {isLoading && deliveryMethod === 'manual' && uploadProgress === 100 && (
                        <p className="text-xs text-center text-neutral-500 font-medium animate-pulse">
                            Upload complete. Generating and sending email...
                        </p>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            deliveryMethod === 'cloud' ? "Send Magic Link via Email" : "Upload & Send Custom File"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
