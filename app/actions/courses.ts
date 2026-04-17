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
export async function updateCourseChecklistTemplate(id: string, template: any) {
    try {
        await db.course.update({
            where: { id },
            data: { checklistTemplate: template }
        })

        // Cascade template changes to all events of this course
        const events = await db.courseEvent.findMany({
            where: { courseId: id },
            include: { checklist: true }
        })

        if (events.length > 0) {
            // Flatten new template into items
            const newTemplateItems: { phase: string, label: string, order: number }[] = []
            let order = 0
            if (Array.isArray(template)) {
                for (const phase of template) {
                    if (Array.isArray(phase.items) && phase.items.length > 0) {
                        for (const item of phase.items) {
                            newTemplateItems.push({
                                phase: phase.title || "General",
                                label: typeof item === 'string' ? item : String(item),
                                order: order++
                            })
                        }
                    } else if (phase.title && phase.title.trim() !== '') {
                        newTemplateItems.push({
                            phase: "General",
                            label: phase.title,
                            order: order++
                        })
                    }
                }
            }

            for (const event of events) {
                const hasCompletedItems = event.checklist.some(item => item.isCompleted)

                if (event.checklist.length === 0 || !hasCompletedItems) {
                    // Safe to completely overwrite if it's empty or nothing is checked off yet
                    if (event.checklist.length > 0) {
                        await db.eventChecklistItem.deleteMany({
                            where: { courseEventId: event.id }
                        })
                    }

                    if (newTemplateItems.length > 0) {
                        await db.eventChecklistItem.createMany({
                            data: newTemplateItems.map(item => ({
                                courseEventId: event.id,
                                label: item.label,
                                phase: item.phase,
                                order: item.order
                            }))
                        })
                    }
                } else {
                    // Has completed items: Append only missing ones to prevent data loss
                    const existingLabels = new Set(event.checklist.map(i => `${i.phase}::${i.label}`))
                    const itemsToAdd = newTemplateItems.filter(item => !existingLabels.has(`${item.phase}::${item.label}`))
                    
                    if (itemsToAdd.length > 0) {
                        await db.eventChecklistItem.createMany({
                            data: itemsToAdd.map(item => ({
                                courseEventId: event.id,
                                label: item.label,
                                phase: item.phase,
                                order: item.order 
                            }))
                        })
                    }
                }
            }
        }

        revalidatePath("/admin/settings")
        revalidatePath("/admin/calendar")
        return { success: true, message: "Checklist template updated and synced to existing events" }
    } catch (error) {
        console.error("Template Update Error:", error)
        return { success: false, message: "Failed to update template" }
    }
}

export async function getCourseChecklistTemplate(courseId: string) {
    try {
        const course = await db.course.findUnique({
            where: { id: courseId },
            select: { checklistTemplate: true }
        })
        return course?.checklistTemplate || []
    } catch (error) {
        console.error("Get Template Error:", error)
        return []
    }
}

// --- Course Document Requirements ---

export async function getCourseRequiredDocs(courseId: string) {
    try {
        const docs = await db.courseDocument.findMany({
            where: { courseId },
            include: { documentType: true }
        })
        return docs
    } catch (error) {
        console.error("Get Course Docs Error:", error)
        return []
    }
}

export async function toggleCourseDocument(courseId: string, documentTypeId: string) {
    try {
        // Check if exists
        const existing = await db.courseDocument.findUnique({
            where: {
                courseId_documentTypeId: {
                    courseId,
                    documentTypeId
                }
            }
        })

        if (existing) {
            // Remove it
            await db.courseDocument.delete({
                where: { id: existing.id }
            })
            revalidatePath("/admin/settings")
            return { success: true, message: "Document requirement removed", linked: false }
        } else {
            // Add it
            await db.courseDocument.create({
                data: {
                    courseId,
                    documentTypeId,
                    isRequired: true
                }
            })
            revalidatePath("/admin/settings")
            return { success: true, message: "Document requirement added", linked: true }
        }
    } catch (error) {
        console.error("Toggle Course Doc Error:", error)
        return { success: false, message: "Failed to toggle document" }
    }
}
