'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function reviewDocument(docId: string, status: "APPROVED" | "REJECTED", feedback?: string) {
    await db.studentDocument.update({
        where: { id: docId },
        data: {
            status,
            feedback: feedback || null,
        },
    });

    revalidatePath("/admin/review");
    revalidatePath("/admin/students");
}
