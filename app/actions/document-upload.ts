'use server'

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveDocumentRecord(docTypeId: string, fileUrl: string, fileType: string, expiryDate?: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.studentDocument.upsert({
        where: {
            userId_documentTypeId: {
                userId,
                documentTypeId: docTypeId,
            },
        },
        update: {
            fileType,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
        create: {
            userId,
            documentTypeId: docTypeId,
            fileUrl,
            fileType,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
    });

    revalidatePath("/portal");
}
