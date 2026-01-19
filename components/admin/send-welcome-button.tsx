'use client';

import { sendStudentWelcomeEmail } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SendWelcomeEmailButton({ studentId }: { studentId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSend() {
        setIsLoading(true);
        const res = await sendStudentWelcomeEmail(studentId);
        if (res.success) {
            toast.success("Welcome email sent!");
        } else {
            toast.error(res.message);
        }
        setIsLoading(false);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSend} disabled={isLoading}>
            <Mail className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : "Send Upload Link"}
        </Button>
    );
}
