"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackUrl = "/admin/students" }: { fallbackUrl?: string }) {
    const router = useRouter();

    return (
        <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0 mt-2" 
            onClick={() => {
                if (window.history.length > 1) {
                    router.back();
                } else {
                    router.push(fallbackUrl);
                }
            }}
        >
            <ArrowLeft className="h-4 w-4" />
        </Button>
    );
}
