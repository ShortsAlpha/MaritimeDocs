'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { deleteFileFromR2 } from "@/lib/r2"

export async function saveInstructorDocument(instructorId: string, fileName: string, fileKey: string, fileType: string, documentTypeId?: string) {
    try {
        await db.instructorDocument.create({
            data: {
                instructorId,
                title: fileName,
                fileUrl: fileKey,
                fileType: fileType,
                documentTypeId: documentTypeId || undefined
            }
        })
        revalidatePath(`/admin/instructors/${instructorId}`)
        return { success: true }
    } catch (error) {
        console.error("Save Intructor Doc Error:", error)
        return { success: false }
    }
}

export async function deleteInstructorDocument(docId: string, fileUrl: string) {
    try {
        await deleteFileFromR2(fileUrl)

        await db.instructorDocument.delete({
            where: { id: docId }
        })

        // We can't easily revalidate the specific path without passing instructor ID, 
        // but typically user is on the page so revalidating the page path in client might be needed 
        // OR we can just return success and let client refresh. 
        // Ideally we should know instructor ID or revalidate a broader path.
        revalidatePath("/admin/instructors/[id]", "page") // Generic revalidate attempt
        return { success: true }
    } catch (error) {
        console.error("Delete Instructor Doc Error:", error)
        return { success: false }
    }
}
