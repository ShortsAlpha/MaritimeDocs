'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const StudentSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    totalFee: z.coerce.number().min(0, "Fee must be positive"),
})

export async function createStudent(prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            totalFee: formData.get("totalFee"),
        }

        const data = StudentSchema.parse(rowData)

        await db.student.create({
            data: {
                fullName: data.fullName,
                email: data.email || null,
                phone: data.phone || null,
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
        await db.student.delete({ where: { id } })
        revalidatePath("/admin/students")
        return { success: true }
    } catch (error) {
        return { success: false, message: "Failed to delete student" }
    }
}
