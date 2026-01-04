'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteFileFromR2 } from "@/lib/r2"

const StudentSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    course: z.string().optional(),
    totalFee: z.coerce.number().min(0, "Fee must be positive"),
})

export async function createStudent(prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            course: formData.get("course"),
            totalFee: formData.get("totalFee"),
        }

        const data = StudentSchema.parse(rowData)

        await db.student.create({
            data: {
                fullName: data.fullName,
                email: data.email || null,
                phone: data.phone || null,
                course: data.course || null,
                totalFee: data.totalFee,
            }
        })

        revalidatePath("/admin/students")
        return { success: true, message: "Student created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create student" }
    }
}

export async function deleteStudent(id: string) {
    try {
        // 1. Fetch all documents for this student to clean up R2
        const docs = await db.studentDocument.findMany({
            where: { studentId: id }
        });

        // 2. Parallel delete from R2
        await Promise.all(
            docs.map(doc => deleteFileFromR2(doc.fileUrl))
        );

        // 3. Delete student (Cascade deletes document records in DB)
        await db.student.delete({ where: { id } })

        revalidatePath("/admin/students")
        return { success: true }
    } catch (error) {
        console.error("Delete Student Error:", error)
        return { success: false, message: "Failed to delete student" }
    }
}
