"use strict";
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { EventDetailsDialog } from "@/components/admin/event-details-dialog"

type Props = {
    events: any[]
}

export function UpcomingCoursesList({ events }: Props) {
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleEventClick = (event: any) => {
        // Map the event structure to what EventDetailsDialog expects if needed
        // The dialog expects 'events' array and 'date'.
        // We will pass [event] and event.startDate.
        // However, the EventDetailsDialog expects events to have 'resource' field for some things?
        // Let's check EventDetailsDialog implementation again.  
        // It uses event.resource for instructor/location if standard props aren't there?
        // Actually, looking at EventDetailsDialog, it uses:
        // event.title, event.start, event.end, event.color
        // event.resource.instructor.fullName (optional)
        // event.resource.location (optional)
        // event.resource.checklist (optional)

        // The Prisma event object has: title, startDate, endDate, location, color, instructor, checklist
        // We need to shape it to match what the dialog expects.

        const mappedEvent = {
            id: event.id,
            title: event.title,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            color: event.color,
            resource: {
                instructor: event.instructor,
                location: event.location,
                checklist: event.checklist
            }
        }

        setSelectedEvent(mappedEvent)
        setIsDialogOpen(true)
    }

    return (
        <>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Upcoming Courses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming courses scheduled.</p>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{event.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(new Date(event.startDate), "MMM d, h:mm a")}</span>
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

            {selectedEvent && (
                <EventDetailsDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    date={selectedEvent.start}
                    events={[selectedEvent]}
                />
            )}
        </>
    )
}
