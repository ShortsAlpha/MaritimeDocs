'use client';

import { sendDocumentRequest } from "@/app/actions/student-automation";
import { Button } from "@/components/ui/button";
import { Mail, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function SendWelcomeEmailButton({ 
    studentId, 
    courses 
}: { 
    studentId: string;
    courses?: { id: string; title: string }[];
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");

    async function handleSend(courseId?: string) {
        setIsLoading(true);
        const res = await sendDocumentRequest(studentId, courseId);
        if (res.success) {
            toast.success(res.message || "Document request sent and status updated!");
            setIsDialogOpen(false);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to send request");
        }
        setIsLoading(false);
    }

    function onButtonClick() {
        if (courses && courses.length > 1) {
            setIsDialogOpen(true);
            // Default select the first one explicitly, or let user pick, let's leave empty initially
            setSelectedCourseId(courses[0].id);
        } else {
            // Direct send for single or no courses
            handleSend(courses?.[0]?.id);
        }
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={onButtonClick} disabled={isLoading}>
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? "Sending..." : "Send Document Request"}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Document Request</DialogTitle>
                        <DialogDescription>
                            This student is enrolled in multiple courses. Please select the course you are requesting documents for.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses?.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleSend(selectedCourseId)} disabled={isLoading || !selectedCourseId}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
