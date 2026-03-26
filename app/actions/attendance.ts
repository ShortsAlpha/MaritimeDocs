"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getEventsWithStudents() {
    try {
        const events = await db.courseEvent.findMany({
            include: {
                instructor: true,
                intake: {
                    include: {
                        students: {
                            select: { id: true, fullName: true },
                            orderBy: { fullName: 'asc' }
                        }
                    }
                },
                students: {
                    select: { id: true, fullName: true },
                    orderBy: { fullName: 'asc' }
                }
            },
            orderBy: { startDate: 'desc' }
        });
        return { success: true, events };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getAttendanceForEvents(eventIds: string[]) {
    try {
        const attendances = await db.attendance.findMany({
            where: {
                eventId: { in: eventIds }
            }
        });
        return { success: true, attendances };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function toggleAttendanceCell(studentId: string, eventId: string, date: string, isPresent: boolean) {
    try {
        // Find existing record for this exact day
        // Date objects from client must be stripped to midnight UTC to ensure consistency
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const existing = await db.attendance.findFirst({
            where: {
                studentId,
                eventId,
                date: normalizedDate
            }
        });

        if (existing) {
            // Update or delete
            if (!isPresent) {
                // If toggled off, we can just delete the record to save space or mark false
                await db.attendance.delete({ where: { id: existing.id } });
            } else {
                await db.attendance.update({
                    where: { id: existing.id },
                    data: { isPresent: true }
                });
            }
        } else {
            // Create new
            if (isPresent) {
                await db.attendance.create({
                    data: {
                        studentId,
                        eventId,
                        date: normalizedDate,
                        isPresent: true
                    }
                });
            }
        }

        revalidatePath("/admin/attendance");
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling attendance:", error);
        return { success: false, message: error.message };
    }
}
