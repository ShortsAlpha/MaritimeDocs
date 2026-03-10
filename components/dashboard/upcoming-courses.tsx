import { db } from "@/lib/db"
import { UpcomingCoursesList } from "./upcoming-courses-list"

export async function UpcomingCourses({ branchFilter = {} }: { branchFilter?: Record<string, any> }) {
    const upcomingEvents = await db.courseEvent.findMany({
        where: {
            startDate: {
                gte: new Date()
            },
            ...branchFilter
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
