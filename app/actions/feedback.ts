'use server'

import { db } from "@/lib/db"
import { z } from "zod"

const FeedbackSchema = z.object({
    courseRating: z.coerce.number().min(1).max(5),
    instructorRating: z.coerce.number().min(1).max(5),
    recommend: z.string().transform(val => val === "yes"),
    comment: z.string().optional(),
    token: z.string()
})

export async function createFeedback(formData: FormData) {
    try {
        const rawData = {
            courseRating: formData.get("courseRating"),
            instructorRating: formData.get("instructorRating"),
            recommend: formData.get("recommend"),
            comment: formData.get("comment"),
            token: formData.get("token"),
        }

        const data = FeedbackSchema.parse(rawData)

        const student = await db.student.findUnique({
            where: { feedbackToken: data.token }
        })

        if (!student) {
            return { success: false, message: "Invalid feedback token" }
        }

        // Check if feedback already exists? Maybe allow multiple or overwrite?
        // For simplicity, just create.

        await db.feedback.create({
            data: {
                studentId: student.id,
                courseRating: data.courseRating,
                instructorRating: data.instructorRating,
                recommend: data.recommend,
                comment: data.comment,
            }
        })

        // Optional: Invalidate token? 
        // student.feedbackToken = null?
        // User asked for "manual button", might want to allow re-send. 
        // I'll leave token valid for now.

        return { success: true }
    } catch (error) {
        console.error("Feedback Create Error:", error)
        return { success: false, message: "Failed to submit feedback" }
    }
}
