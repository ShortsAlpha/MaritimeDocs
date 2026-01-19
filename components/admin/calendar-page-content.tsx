"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarTwin } from "@/components/ui/calendar-twin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { CreateEventDialog } from "@/components/admin/create-event-dialog"
import { EventDetailsDialog } from "@/components/admin/event-details-dialog"

type Props = {
    events: any[]
    instructors: { id: string, fullName: string }[]
}

export function CalendarPageContent({ events, instructors }: Props) {
    const [date, setDate] = useState<Date>(new Date())
    const [createOpen, setCreateOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Derive events for the selected date ensuring reactivity
    const selectedEvents = events.filter(event => {
        const start = new Date(event.start)
        start.setHours(0, 0, 0, 0)
        const end = new Date(event.end)
        end.setHours(23, 59, 59, 999)
        const current = new Date(selectedDate)
        current.setHours(12, 0, 0, 0)
        return current >= start && current <= end
    })

    const handleDateChange = (newDate: Date) => {
        setDate(newDate)
        setSelectedDate(newDate)

        // Find events specifically for the click action logic
        const dayEvents = events.filter(event => {
            const start = new Date(event.start)
            start.setHours(0, 0, 0, 0)
            const end = new Date(event.end)
            end.setHours(23, 59, 59, 999)
            const current = new Date(newDate)
            current.setHours(12, 0, 0, 0)
            return current >= start && current <= end
        })

        if (dayEvents.length > 0) {
            setDetailsOpen(true)
        } else {
            setCreateOpen(true)
        }
    }

    return (
        <div className="flex flex-col gap-6 mt-6 items-center w-full">
            <CalendarTwin
                value={date}
                onChange={handleDateChange}
                events={events}
                className="w-full shadow-2xl"
            />

            <CreateEventDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                instructors={instructors}
                defaultDate={selectedDate}
            />

            <EventDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                date={selectedDate}
                events={selectedEvents}
            />
        </div>
    )
}
