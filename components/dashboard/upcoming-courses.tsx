import { db } from "@/lib/db"
import { UpcomingCoursesList } from "./upcoming-courses-list"

export async function UpcomingCourses() {
    const upcomingEvents = await db.courseEvent.findMany({
        where: {
            startDate: {
                gte: new Date()
            }
        },
        orderBy: {
            startDate: 'asc'
        },
        take: 5,
        include: {
            instructor: true,
            checklist: true
        }
    })

    return <UpcomingCoursesList events={upcomingEvents} />
}
