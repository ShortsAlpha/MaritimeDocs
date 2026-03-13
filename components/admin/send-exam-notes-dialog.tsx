'use client';

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

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        if (!file || !course) {
            toast.error("Please select a course and a file");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Upload File via standard API route (bypasses server action limits)
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("subFolder", `students/${studentId}/exam-notes`);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to upload note");
            }

            const uploadRes = await uploadResponse.json();

            if (!uploadRes.fileUrl) {
                toast.error("Upload succeeded but no URL returned.");
                setIsLoading(false);
                return;
            }

            // 2. Send Email
            const emailRes = await sendExamNotesEmail(studentId, course, uploadRes.fileUrl);

            if (emailRes.success) {
                toast.success("Lecture notes sent successfully!");
                setIsOpen(false);
                setFile(null);
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
                        <Select value={course} onValueChange={setCourse} required>
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
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Email"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
