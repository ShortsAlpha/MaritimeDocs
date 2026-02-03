'use server'

import { db } from "@/lib/db"
import { z } from "zod"
import { FeedbackSource, RecommendStatus } from "@prisma/client"

const FeedbackSchema = z.object({
    source: z.nativeEnum(FeedbackSource).optional(),

    // Ratings
    registrationProcess: z.coerce.number().min(1).max(5),
    practicalStandards: z.coerce.number().min(1).max(5),
    courseMaterials: z.coerce.number().min(1).max(5),
    courseContent: z.coerce.number().min(1).max(5),
    instructorEffectiveness: z.coerce.number().min(1).max(5),
    overallImpression: z.coerce.number().min(1).max(5),
    staffFriendliness: z.coerce.number().min(1).max(5),
    learningEffectiveness: z.coerce.number().min(1).max(5),

    // Conclusion
    recommend: z.nativeEnum(RecommendStatus),
    comment: z.string().optional(),

    token: z.string(),
    turnstileToken: z.string().optional()
})

async function verifyTurnstile(token: string) {
    if (!process.env.TURNSTILE_SECRET_KEY) return true

    try {
        const formData = new FormData();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        formData.append('response', token);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (e) {
        console.error("Turnstile verification error:", e);
        return false;
    }
}

export async function createFeedback(formData: FormData) {
    try {
        const rawData = {
            source: formData.get("source") || undefined,

            registrationProcess: formData.get("registrationProcess"),
            practicalStandards: formData.get("practicalStandards"),
            courseMaterials: formData.get("courseMaterials"),
            courseContent: formData.get("courseContent"),
            instructorEffectiveness: formData.get("instructorEffectiveness"),
            overallImpression: formData.get("overallImpression"),
            staffFriendliness: formData.get("staffFriendliness"),
            learningEffectiveness: formData.get("learningEffectiveness"),

            recommend: formData.get("recommend"),
            comment: formData.get("comment"),

            token: formData.get("token"),
            turnstileToken: formData.get("cf-turnstile-response"),
        }

        const data = FeedbackSchema.parse(rawData)

        if (process.env.TURNSTILE_SECRET_KEY) {
            const isHuman = await verifyTurnstile(data.turnstileToken || "");
            if (!isHuman) {
                return { success: false, message: "Security check failed. Please try again." }
            }
        }

        const student = await db.student.findUnique({
            where: { feedbackToken: data.token }
        })

        if (!student) {
            return { success: false, message: "Invalid feedback token" }
        }

        await db.feedback.create({
            data: {
                studentId: student.id,

                source: data.source,

                registrationProcess: data.registrationProcess,
                practicalStandards: data.practicalStandards,
                courseMaterials: data.courseMaterials,
                courseContent: data.courseContent,
                instructorEffectiveness: data.instructorEffectiveness,
                overallImpression: data.overallImpression,
                staffFriendliness: data.staffFriendliness,
                learningEffectiveness: data.learningEffectiveness,

                recommend: data.recommend,
                courseAttended: student.course || "Unknown",
                comment: data.comment,
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Feedback Create Error:", error)
        return { success: false, message: "Failed to submit feedback" }
    }
}
