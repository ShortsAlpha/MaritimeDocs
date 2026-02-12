"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateDocumentNote(studentId: string, documentTypeId: string, note: string) {
    try {
        if (!note.trim()) {
            // If empty, delete the note
            await db.studentDocumentNote.deleteMany({
                where: {
                    studentId,
                    documentTypeId
                }
            })
        } else {
            await db.studentDocumentNote.upsert({
                where: {
                    studentId_documentTypeId: {
                        studentId,
                        documentTypeId
                    }
                },
                create: {
                    studentId,
                    documentTypeId,
                    note
                },
                update: {
                    note
                }
            })
        }

        revalidatePath("/admin/workbook")
        return { success: true }
    } catch (error: any) {
        console.error("Error updating document note:", error)
        return { success: false, message: error.message }
    }
}
