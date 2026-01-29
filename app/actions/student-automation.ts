"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { StudentStatus } from "@prisma/client"
import { sendStudentWelcomeEmail, sendExamNotesEmail } from "@/app/actions/email"

export async function sendDocumentRequest(studentId: string) {
    try {
        // Use the existing email action which handles token generation and template
        const emailResult = await sendStudentWelcomeEmail(studentId)

        if (!emailResult.success) {
            return { success: false, error: emailResult.message }
        }

        // Update student status to DOCS_REQ_SENT
        await db.student.update({
            where: { id: studentId },
            data: { status: StudentStatus.DOCS_REQ_SENT as any }
        })

        revalidatePath(`/admin/students/${studentId}`)
        revalidatePath("/admin/students")

        return { success: true, newStatus: StudentStatus.DOCS_REQ_SENT as any }
    } catch (error) {
        console.error("Error sending document request:", error)
        return { success: false, error: "Failed to send document request" }
    }
}

export async function sendLectureNotes(studentId: string) {
    try {
        const student = await db.student.findUnique({
            where: { id: studentId },
            select: { course: true }
        })

        // Use the existing email action
        // Note: We might want to pass a real notes URL if available in the future
        const emailResult = await sendExamNotesEmail(
            studentId,
            student?.course || "Maritime Course",
            "https://xone.academy/portal/notes" // Placeholder or real URL
        )

        if (!emailResult.success) {
            return { success: false, error: emailResult.message }
        }

        // Update student status to LECTURE_NOTES_SENT
        await db.student.update({
            where: { id: studentId },
            data: { status: StudentStatus.LECTURE_NOTES_SENT as any }
        })

        revalidatePath(`/admin/students/${studentId}`)
        revalidatePath("/admin/students")

        return { success: true, newStatus: StudentStatus.LECTURE_NOTES_SENT as any }
    } catch (error) {
        console.error("Error sending lecture notes:", error)
        return { success: false, error: "Failed to send lecture notes" }
    }
}

export async function checkDocumentCompleteness(studentId: string) {
    try {
        // Get all required document types
        const requiredDocTypes = await db.documentType.findMany({
            where: { isRequired: true },
            select: { id: true }
        })

        // Get student's approved documents
        const approvedDocs = await db.studentDocument.findMany({
            where: {
                studentId: studentId,
                status: "APPROVED"
            },
            select: { documentTypeId: true }
        })

        const approvedTypeIds = new Set(approvedDocs.map(d => d.documentTypeId))
        const allRequiredUploaded = requiredDocTypes.every(type =>
            approvedTypeIds.has(type.id)
        )

        return {
            success: true,
            allComplete: allRequiredUploaded,
            requiredCount: requiredDocTypes.length,
            approvedCount: approvedDocs.length
        }
    } catch (error) {
        console.error("Error checking document completeness:", error)
        return { success: false, allComplete: false }
    }
}
