'use server'

import { db } from "@/lib/db"

export async function getActivityLogs(limit = 50) {
    try {
        const logs = await db.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return logs;
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return [];
    }
}

import { logActivity } from "@/lib/logger";
import { currentUser } from "@clerk/nextjs/server";

export async function logPageView(path: string) {
    const user = await currentUser();
    if (!user) return;

    await logActivity({
        action: 'VIEW',
        title: `Viewed Page: ${path}`,
        userId: user.id,
        userEmail: user.emailAddresses[0]?.emailAddress,
        metadata: { path }
    });
}
