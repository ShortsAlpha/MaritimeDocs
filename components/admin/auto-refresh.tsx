'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(true);
    const [countdown, setCountdown] = useState(intervalMs / 1000);

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 0; // Signal trigger
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [enabled]);

    useEffect(() => {
        if (countdown === 0 && enabled) {
            router.refresh();
            setCountdown(intervalMs / 1000);
        }
    }, [countdown, enabled, intervalMs, router]);

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-mono"
                onClick={() => setEnabled(!enabled)}
            >
                {enabled ? (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin text-green-500" />
                        LIVE ({countdown}s)
                    </>
                ) : (
                    <>
                        <Pause className="h-3 w-3" />
                        PAUSED
                    </>
                )}
            </Button>
        </div>
    );
}
