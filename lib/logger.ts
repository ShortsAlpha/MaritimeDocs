import { db } from "@/lib/db";
import { headers } from "next/headers";

export type LogAction = 'LOGIN' | 'UPLOAD' | 'VIEW' | 'DELETE' | 'CREATE' | 'UPDATE' | 'EMAIL' | 'PAYMENT';

interface LogOptions {
    action: LogAction;
    title: string;
    description?: string;
    userId?: string;
    userEmail?: string;
    metadata?: Record<string, any>;
}

export async function logActivity({ action, title, description, userId, userEmail, metadata }: LogOptions) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await db.activityLog.create({
            data: {
                action,
                title,
                description,
                userId,
                userEmail,
                ipAddress: ip,
                userAgent: userAgent,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Fail silently to not disrupt the main flow
    }
}
