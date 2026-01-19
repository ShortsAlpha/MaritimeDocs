'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteFileFromR2 } from "@/lib/r2"
import { InstructorEmploymentType } from "@prisma/client"

const InstructorSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    bio: z.string().optional(),
    specialties: z.string().optional(),
    employmentType: z.nativeEnum(InstructorEmploymentType).default(InstructorEmploymentType.FULL_TIME),
})

export async function createInstructor(prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            bio: formData.get("bio"),
            specialties: formData.get("specialties"),
            employmentType: formData.get("employmentType"),
        }

        const data = InstructorSchema.parse(rowData)

        await db.instructor.create({
            data: {
                fullName: data.fullName,
                email: data.email || null,
                phone: data.phone || null,
                bio: data.bio || null,
                specialties: data.specialties || null,
                employmentType: data.employmentType,
            }
        })

        revalidatePath("/admin/instructors")
        return { success: true, message: "Instructor created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create instructor" }
    }
}

export async function updateInstructor(id: string, prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            bio: formData.get("bio"),
            specialties: formData.get("specialties"),
            employmentType: formData.get("employmentType"),
        }

        const data = InstructorSchema.partial().parse(rowData)

        await db.instructor.update({
            where: { id },
            data: {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.email !== undefined && { email: data.email || null }),
                ...(data.phone !== undefined && { phone: data.phone || null }),
                ...(data.bio !== undefined && { bio: data.bio || null }),
                ...(data.specialties !== undefined && { specialties: data.specialties || null }),
                ...(data.employmentType && { employmentType: data.employmentType }),
            }
        })

        revalidatePath(`/admin/instructors/${id}`)
        return { success: true, message: "Instructor updated successfully" }
    } catch (error: any) {
        console.error("Update match error", error)
        return { success: false, message: "Failed to update instructor" }
    }
}

export async function deleteInstructor(id: string) {
    try {
        // 1. Fetch all documents for this instructor to clean up R2
        const docs = await db.instructorDocument.findMany({
            where: { instructorId: id }
        });

        // 2. Parallel delete from R2
        await Promise.all(
            docs.map(doc => deleteFileFromR2(doc.fileUrl))
        );

        // 3. Delete instructor
        await db.instructor.delete({ where: { id } })

        revalidatePath("/admin/instructors")
        return { success: true }
    } catch (error) {
        console.error("Delete Instructor Error:", error)
        return { success: false, message: "Failed to delete instructor" }
    }
}
