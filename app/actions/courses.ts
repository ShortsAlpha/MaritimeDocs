'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CourseSchema = z.object({
    title: z.string().min(2, "Title is too short"),
})

export async function createCourse(prevState: any, formData: FormData) {
    try {
        const title = formData.get("title")

        const data = CourseSchema.parse({ title })

        await db.course.create({
            data: { title: data.title }
        })

        revalidatePath("/admin/settings")
        return { success: true, message: "Course created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create course" }
    }
}

export async function deleteCourse(id: string) {
    try {
        await db.course.delete({ where: { id } })
        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to delete course" }
    }
}

export async function updateCourse(id: string, formData: FormData) {
    try {
        const title = formData.get("title")
        const data = CourseSchema.parse({ title })

        await db.course.update({
            where: { id },
            data: { title: data.title }
        })

        revalidatePath("/admin/settings")
        return { success: true, message: "Course updated successfully" }
    } catch (error) {
        return { success: false, message: "Failed to update course" }
    }
}
