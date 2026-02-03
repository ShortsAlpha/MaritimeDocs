'use client';

import { useEffect } from "react";
import { logPageView } from "@/app/actions/logging";
import { usePathname } from "next/navigation";

export function PageViewLogger() {
    const pathname = usePathname();

    useEffect(() => {
        // Debounce or just log on mount
        if (pathname) {
            logPageView(pathname);
        }
    }, [pathname]);

    return null;
}
