import { db } from "@/lib/db";

import { CalendarPageContent } from "@/components/admin/calendar-page-content";

export default async function AdminCalendarPage() {
    const events = await db.courseEvent.findMany({
        include: {
            instructor: true,
            checklist: {
                orderBy: { id: 'asc' }
            }
        }
    });

    const instructors = await db.instructor.findMany({
        select: { id: true, fullName: true }
    });

    // Transform for big-calendar
    const calendarEvents = events.map(evt => ({
        id: evt.id,
        title: evt.title + (evt.instructor ? ` (${evt.instructor.fullName})` : ''),
        start: evt.startDate,
        end: evt.endDate,
        resource: evt,
        color: evt.color || undefined,
        checklist: evt.checklist
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Course Calendar</h1>
                    <p className="text-sm text-muted-foreground">Schedule classes and manage instructors.</p>
                </div>
            </div>

            <CalendarPageContent events={calendarEvents} instructors={instructors} />
        </div>
    );
}
