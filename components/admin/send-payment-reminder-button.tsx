'use client';

import { sendPaymentReminderEmail } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SendPaymentReminderButton({ studentId }: { studentId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSend() {
        setIsLoading(true);
        const res = await sendPaymentReminderEmail(studentId);
        if (res.success) {
            toast.success("Payment reminder sent successfully!");
            router.refresh();
        } else {
            toast.error(res.message || "Failed to send payment reminder");
        }
        setIsLoading(false);
    }

    return (
        <Button 
            onClick={handleSend} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2 h-9"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
                <CreditCard className="h-4 w-4 text-orange-500" />
            )}
            Send Payment Reminder
        </Button>
    );
}
