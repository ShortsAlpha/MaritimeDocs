'use client';

import { sendExamNotesEmail } from "@/app/actions/email";
import { uploadPendingDocument } from "@/app/actions/documents"; // We can reuse logic or direct R2 upload
// Actually, better to have a specific upload action for this so it doesn't create a 'StudentDocument' record linked to checking?
// Or just upload to a temp folder.
// I'll create a simple helper in this file or use a new action.
// Let's use a new simple action in this file? No, server actions in separate file.
// I'll add `uploadExamNote` to `app/actions/documents.ts`.

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
import { FileText, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadExamNoteFile } from "@/app/actions/documents";

export function SendExamNotesDialog({ studentId, courseName }: { studentId: string, courseName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [course, setCourse] = useState(courseName || "");

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        const file = formData.get("file") as File;

        if (!file || !course) {
            toast.error("Please fill all fields");
            setIsLoading(false);
            return;
        }

        // 1. Upload File
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("studentId", studentId);

        const uploadRes = await uploadExamNoteFile(uploadFormData);

        if (!uploadRes.success || !uploadRes.url) {
            toast.error("Failed to upload note");
            setIsLoading(false);
            return;
        }

        // 2. Send Email
        const emailRes = await sendExamNotesEmail(studentId, course, uploadRes.url);

        if (emailRes.success) {
            toast.success("Exam notes sent!");
            setIsOpen(false);
        } else {
            toast.error("Failed to send email");
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Send Exam Notes
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Exam Notes</DialogTitle>
                    <DialogDescription>
                        Upload a file (PDF) to send to the student.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Course Name</Label>
                        <Input
                            value={course}
                            onChange={e => setCourse(e.target.value)}
                            placeholder="e.g. Navigation 101"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Exam Note File</Label>
                        <Input type="file" name="file" required accept=".pdf,.doc,.docx" />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Email"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
