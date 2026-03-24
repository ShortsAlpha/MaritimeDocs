"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Assign students to an event
export async function assignStudentsToEvent(eventId: string, studentIds: string[]) {
    try {
        await db.courseEvent.update({
            where: { id: eventId },
            data: {
                students: {
                    connect: studentIds.map(id => ({ id }))
                }
            }
        })
        revalidatePath("/admin/calendar")
        return { success: true }
    } catch (error: any) {
        console.error("Error assigning students:", error)
        return { success: false, message: error.message }
    }
}

// Remove student from an event
export async function removeStudentFromEvent(eventId: string, studentId: string) {
    try {
        await db.courseEvent.update({
            where: { id: eventId },
            data: {
                students: {
                    disconnect: { id: studentId }
                }
            }
        })
        revalidatePath("/admin/calendar")
        return { success: true }
    } catch (error: any) {
        console.error("Error removing student:", error)
        return { success: false, message: error.message }
    }
}

// Get students for an event with their document status
export async function getEventStudents(eventId: string) {
    try {
        const event = await db.courseEvent.findUnique({
            where: { id: eventId },
            include: {
                students: {
                    include: {
                        documents: true,
                        documentNotes: true
                    },
                    orderBy: {
                        fullName: 'asc'
                    }
                }
            }
        })

        if (!event) return { success: false, message: "Event not found" }

        // Fetch only document types specifically required/mapped for this Event's Course
        let eventDocTypes: any[] = []
        if (event.courseId) {
            const courseDocs = await db.courseDocument.findMany({
                where: { courseId: event.courseId },
                include: { documentType: true },
                orderBy: { documentType: { title: 'asc' } }
            })
            eventDocTypes = courseDocs.map(cd => cd.documentType)
        }

        // Identify which ones are strictly required for "completeness" check 
        const requiredDocTypes = eventDocTypes.filter(d => d.isRequired)

        const studentsWithStatus = event.students.map(student => {
            const studentDocTypeIds = student.documents.map(d => d.documentTypeId)
            // missing is based on REQUIRED ones strictly mapped to this course
            const missingDocs = requiredDocTypes.filter(type => !studentDocTypeIds.includes(type.id))

            return {
                ...student,
                totalFee: student.totalFee.toNumber(),
                isDocsComplete: missingDocs.length === 0,
                missingDocs: missingDocs.map(d => d.title)
            }
        })

        return { success: true, students: studentsWithStatus, documentTypes: eventDocTypes }
    } catch (error: any) {
        console.error("Error fetching event students:", error)
        return { success: false, message: error.message }
    }
}

// Search students for assignment dialog
export async function searchStudentsForAssignment(query: string, excludeEventId?: string, onlyUnassigned?: boolean) {
    try {
        const whereClause: any = {
            AND: []
        }

        // If specific exclude ID is provided (don't show students already in THIS event)
        if (excludeEventId) {
            whereClause.AND.push({
                events: {
                    none: {
                        id: excludeEventId
                    }
                }
            })
        }

        // Filter for students who have never been assigned to ANY event
        if (onlyUnassigned) {
            whereClause.AND.push({
                events: {
                    none: {}
                }
            })
        }

        if (query.trim()) {
            whereClause.AND.push({
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { studentNumber: { contains: query, mode: 'insensitive' } }
                ]
            })
        }

        const students = await db.student.findMany({
            where: whereClause,
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                studentNumber: true,
                status: true,
                photoUrl: true
            }
        })
        return { success: true, students }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}
