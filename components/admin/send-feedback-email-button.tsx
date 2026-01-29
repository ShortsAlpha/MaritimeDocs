'use client';

import { sendFeedbackEmail } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SendFeedbackEmailButton({ studentId }: { studentId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSend() {
        setIsLoading(true);
        const res = await sendFeedbackEmail(studentId);
        if (res.success) {
            toast.success("Feedback request sent!");
        } else {
            toast.error(res.message);
        }
        setIsLoading(false);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSend} disabled={isLoading}>
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : "Request Feedback"}
        </Button>
    );
}
