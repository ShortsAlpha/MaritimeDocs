"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { addMonths, format, startOfYear } from "date-fns"

interface CalendarTwinProps {
    value?: Date
    onChange?: (date: Date) => void
    className?: string
    yearRange?: [number, number] // [start, end] years
    events?: any[]
}

export function CalendarTwin({
    value,
    onChange,
    className,
    yearRange = [2000, 2035],
    events,
}: CalendarTwinProps) {
    const [view, setView] = React.useState<"month" | "year">("month")
    const [current, setCurrent] = React.useState<Date>(value ?? new Date())

    const handleSelect = (date: Date) => {
        onChange?.(date)
    }

    const goPrev = () => {
        if (view === "month") setCurrent(addMonths(current, -1))
        if (view === "year") {
            const prev = new Date(current)
            prev.setFullYear(prev.getFullYear() - 12)
            setCurrent(prev)
        }
    }

    const goNext = () => {
        if (view === "month") setCurrent(addMonths(current, 1))
        if (view === "year") {
            const next = new Date(current)
            next.setFullYear(next.getFullYear() + 12)
            setCurrent(next)
        }
    }

    const renderMonth = (month: Date) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1)
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        const days: Date[] = []
        for (let i = 1; i <= end.getDate(); i++) {
            days.push(new Date(month.getFullYear(), month.getMonth(), i))
        }

        return (
            <div className="w-full">
                <div className="mb-2 text-center text-sm font-medium">
                    {format(month, "MMMM yyyy")}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="h-12 flex items-center justify-center text-muted-foreground font-semibold">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: start.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-full aspect-square" />
                    ))}
                    {days.map((day) => {
                        const isSelected =
                            value &&
                            day.toDateString() === value.toDateString()
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleSelect(day)}
                                className={cn(
                                    "w-full aspect-square flex flex-col items-center justify-center rounded-lg text-lg font-medium transition-all hover:scale-105 relative",
                                    "bg-card text-foreground shadow-sm",
                                    "border border-border/60 dark:border-transparent dark:bg-transparent dark:shadow-none",
                                    "hover:border-primary/50 hover:shadow-md dark:hover:bg-accent/10",
                                    isSelected && "ring-1 ring-primary/20 z-10" // Very subtle indicator just in case
                                )}
                            >
                                <span>{day.getDate()}</span>
                                {events && (
                                    <div className="flex flex-col gap-1 w-full px-1 mt-1">
                                        {events
                                            .filter(e => {
                                                const start = new Date(e.start)
                                                start.setHours(0, 0, 0, 0)
                                                const end = new Date(e.end)
                                                end.setHours(23, 59, 59, 999) // Ensure end date includes the full day
                                                const current = new Date(day)
                                                current.setHours(12, 0, 0, 0) // Avoid timezone edge cases
                                                return current >= start && current <= end
                                            })
                                            .slice(0, 3)
                                            .map((e, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-[10px] px-1 py-0.5 rounded truncate text-white text-left w-full"
                                                    style={{ backgroundColor: e.color || '#3b82f6' }}
                                                    title={e.title}
                                                >
                                                    {e.title}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderYearGrid = () => {
        const currentYear = current.getFullYear()
        const start = Math.max(yearRange[0], currentYear - (currentYear % 12))
        const years = Array.from({ length: 12 }, (_, i) => start + i)

        return (
            <div className="p-2">
                <div className="grid grid-cols-3 gap-2">
                    {years.map((y) => (
                        <button
                            key={y}
                            onClick={() => {
                                const newDate = startOfYear(current)
                                newDate.setFullYear(y)
                                setCurrent(newDate)
                                setView("month")
                            }}
                            className={cn(
                                "h-10 rounded-md text-sm font-medium transition-colors",
                                y === currentYear
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent hover:text-foreground"
                            )}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "rounded-lg border bg-background p-6 w-full",
                className
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <button
                    onClick={() => setView(view === "month" ? "year" : "month")}
                    className="text-sm font-semibold hover:underline"
                >
                    {view === "month"
                        ? format(current, "MMMM yyyy")
                        : `${current.getFullYear()}`}
                </button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goNext}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {view === "month" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderMonth(current)}
                    {renderMonth(addMonths(current, 1))}
                </div>
            ) : (
                renderYearGrid()
            )}
        </div>
    )
}
