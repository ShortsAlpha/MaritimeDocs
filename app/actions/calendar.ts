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
    color: z.string().optional(),
    checklist: z.string().optional(), // JSON string of items or array? Let's use JSON string for simplicity in FormData
})

export async function createCourseEvent(prevState: any, formData: FormData) {
    try {
        const rowData = {
            title: formData.get("title"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            location: formData.get("location"),
            instructorId: formData.get("instructorId") === "none" ? undefined : formData.get("instructorId"),
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
                color: data.color,
                checklist: {
                    create: checklistItems.map(item => ({ label: item }))
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
        await db.eventChecklistItem.update({
            where: { id: itemId },
            data: { isCompleted }
        })
        revalidatePath("/admin/calendar")
        return { success: true }
    } catch (error) {
        console.error("Toggle Checklist Error:", error)
        return { success: false }
    }
}

export async function addChecklistItem(eventId: string, label: string) {
    try {
        const newItem = await db.eventChecklistItem.create({
            data: {
                label,
                courseEventId: eventId
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
