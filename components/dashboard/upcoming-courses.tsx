import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

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
            instructor: true
        }
    })

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Upcoming Courses
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcomingEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming courses scheduled.</p>
                    ) : (
                        upcomingEvents.map((event) => (
                            <div key={event.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{event.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{format(event.startDate, "MMM d, h:mm a")}</span>
                                        <span>•</span>
                                        <span>{event.location || "No location"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {event.instructor && (
                                        <div className="text-xs text-right">
                                            <p className="text-muted-foreground">Instructor</p>
                                            <p className="font-medium">{event.instructor.fullName}</p>
                                        </div>
                                    )}
                                    <Badge variant="outline" style={{ borderColor: event.color || undefined, color: event.color || undefined }}>
                                        {event.color ? 'Scheduled' : 'Upcoming'}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
