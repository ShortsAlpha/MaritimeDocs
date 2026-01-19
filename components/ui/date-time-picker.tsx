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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

    const setTime = (type: "hours" | "minutes", value: number) => {
        if (!date) return
        const newDate = new Date(date)
        if (type === "hours") {
            newDate.setHours(value)
        } else {
            newDate.setMinutes(value)
        }
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
                    {date ? format(date, "MM/dd/yyyy HH:mm") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                            if (d) {
                                const newDate = new Date(d)
                                if (date) {
                                    newDate.setHours(date.getHours())
                                    newDate.setMinutes(date.getMinutes())
                                }
                                setDate(newDate)
                                setIsOpen(false)
                            }
                        }}
                        initialFocus
                    />
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
                        <ScrollArea className="h-[300px] w-auto sm:w-[90px]">
                            <div className="flex flex-col p-2 gap-1 px-4 sm:pr-6">
                                <span className="text-xs font-semibold text-center mb-2 text-muted-foreground">Hours</span>
                                {hours.map((hour) => (
                                    <Button
                                        key={hour}
                                        size="icon"
                                        variant={date && date.getHours() === hour ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => setTime("hours", hour)}
                                    >
                                        {hour.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        <ScrollArea className="h-[300px] w-auto sm:w-[90px]">
                            <div className="flex flex-col p-2 gap-1 px-4 sm:pr-6">
                                <span className="text-xs font-semibold text-center mb-2 text-muted-foreground">Minutes</span>
                                {minutes.map((minute) => (
                                    <Button
                                        key={minute}
                                        size="icon"
                                        variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => setTime("minutes", minute)}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
