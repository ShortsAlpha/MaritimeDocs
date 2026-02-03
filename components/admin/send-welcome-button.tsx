'use client';

import { sendDocumentRequest } from "@/app/actions/student-automation";
import { Button } from "@/components/ui/button";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SendWelcomeEmailButton({ studentId }: { studentId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSend() {
        setIsLoading(true);
        const res = await sendDocumentRequest(studentId);
        if (res.success) {
            toast.success(res.message || "Document request sent and status updated!");
            router.refresh();
        } else {
            toast.error(res.error || "Failed to send request");
        }
        setIsLoading(false);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSend} disabled={isLoading}>
            <Mail className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : "Send Document Request"}
        </Button>
    );
}
