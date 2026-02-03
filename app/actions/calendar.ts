'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const EventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    location: z.string().optional(),
    instructorId: z.string().optional(),
    courseId: z.string().optional(),
    intakeId: z.string().optional(),
    color: z.string().optional(),
    checklist: z.string().optional(), // JSON string of items or array? Let's use JSON string for simplicity in FormData
})

import { currentUser } from "@clerk/nextjs/server"

// ... existing imports ...

// ... createCourseEvent (ensure it assigns order if checklist provided) ...
// Actually, for createCourseEvent, the checklist items are created in bulk. Prisma handles order if we used autoincrement but here we don't.
// We should probably map them with index as order.

export async function createCourseEvent(prevState: any, formData: FormData) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const rowData = {
            title: formData.get("title"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            location: formData.get("location"),
            instructorId: formData.get("instructorId") === "none" ? undefined : formData.get("instructorId"),
            courseId: formData.get("courseId") === "none" ? undefined : formData.get("courseId"),
            intakeId: formData.get("intakeId") === "none" ? undefined : formData.get("intakeId"),
            color: formData.get("color"),
            checklist: formData.get("checklist"),
        }

        const data = EventSchema.parse(rowData)

        // Parse checklist JSON if present
        let checklistItems: string[] = []
        if (data.checklist) {
            try {
                checklistItems = JSON.parse(data.checklist)
            } catch (e) {
                console.error("Failed to parse checklist JSON", e)
            }
        }

        await db.courseEvent.create({
            data: {
                title: data.title,
                startDate: data.startDate,
                endDate: data.endDate,
                location: data.location,
                instructorId: data.instructorId,
                courseId: data.courseId,
                intakeId: data.intakeId,
                color: data.color,
                checklist: {
                    create: checklistItems.map((item, index) => ({
                        label: item,
                        order: index
                    }))
                }
            }
        })

        revalidatePath("/admin/calendar")
        return { success: true, message: "Event created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create event" }
    }
}

export async function deleteCourseEvent(id: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        await db.courseEvent.delete({
            where: { id }
        })
        revalidatePath("/admin/calendar")
        return { success: true }
    } catch (error) {
        console.error("Delete Event Error:", error)
        return { success: false, message: "Failed to delete event" }
    }
}

export async function toggleEventChecklistItem(itemId: string, isCompleted: boolean) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        // 1. Get the item to know its event and order
        const item = await db.eventChecklistItem.findUnique({
            where: { id: itemId },
            include: { courseEvent: { include: { checklist: true } } }
        })

        if (!item) return { success: false, message: "Item not found" }

        // 2. Sequential Check: If marking as completed, check if previous items are done
        if (isCompleted) {
            const previousItems = await db.eventChecklistItem.findMany({
                where: {
                    courseEventId: item.courseEventId,
                    order: { lt: item.order },
                    isCompleted: false
                }
            })

            if (previousItems.length > 0) {
                return { success: false, message: "Previous steps must be completed first." }
            }
        }

        // 4. Update
        const updatedItem = await db.eventChecklistItem.update({
            where: { id: itemId },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                completedBy: isCompleted ? `${user.firstName} ${user.lastName}` : null
            }
        })

        revalidatePath("/admin/calendar")

        return { success: true, item: updatedItem }

    } catch (error) {
        console.error("Toggle Checklist Error:", error)
        return { success: false, message: "Failed to update item" }
    }
}

export async function addChecklistItem(eventId: string, label: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        // Find max order
        const lastItem = await db.eventChecklistItem.findFirst({
            where: { courseEventId: eventId },
            orderBy: { order: 'desc' }
        })
        const newOrder = lastItem ? lastItem.order + 1 : 0

        const newItem = await db.eventChecklistItem.create({
            data: {
                label,
                courseEventId: eventId,
                order: newOrder
            }
        })
        revalidatePath("/admin/calendar")
        return { success: true, item: newItem }
    } catch (error) {
        console.error("Add Checklist Item Error:", error)
        return { success: false }
    }
}

export async function deleteEventChecklistItem(itemId: string) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        await db.eventChecklistItem.delete({
            where: { id: itemId }
        })
        revalidatePath("/admin/calendar")
        return { success: true }
    } catch (error) {
        console.error("Delete Checklist Item Error:", error)
        return { success: false }
    }
}
