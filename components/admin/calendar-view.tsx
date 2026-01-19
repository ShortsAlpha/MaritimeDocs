'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from 'react'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

type Event = {
    id: string
    title: string
    start: Date
    end: Date
    resource?: any
    color?: string
}

type Props = {
    events: Event[]
    date?: Date
    onNavigate?: (newDate: Date) => void
}

export function CalendarView({ events, date, onNavigate }: Props) {
    const [view, setView] = useState<any>('month')

    const eventStyleGetter = (event: Event) => {
        const backgroundColor = event.color || '#3b82f6';
        return {
            style: {
                backgroundColor: backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    }

    return (
        <div className="h-[700px] bg-background text-foreground p-4 rounded-lg border shadow-sm">
            {/* Custom dark mode styles fix for big calendar could be added here or in globals.css */}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                date={date}
                onNavigate={onNavigate}
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                onView={setView}
                eventPropGetter={eventStyleGetter}
                components={{
                    // Optional: Custom components for event rendering
                }}
            />
        </div>
    )
}
