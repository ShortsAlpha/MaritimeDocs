"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined)
            return
        }

        // Preserve time if date already exists
        const newDate = new Date(selectedDate)
        if (date) {
            newDate.setHours(date.getHours())
            newDate.setMinutes(date.getMinutes())
        }
        setDate(newDate)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value
        if (!time) return

        const [hours, minutes] = time.split(':').map(Number)
        const newDate = date ? new Date(date) : new Date()
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setDate(newDate)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
