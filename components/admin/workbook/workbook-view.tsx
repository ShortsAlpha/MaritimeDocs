"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { EventStudentManager } from "../event-student-manager"
import { format } from "date-fns"

type Event = {
    id: string
    title: string
    startDate: Date
    endDate: Date
    resource?: any
}

type Props = {
    events: Event[]
}

export function WorkbookView({ events }: Props) {
    const [open, setOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string>("")

    const selectedEvent = events.find(e => e.id === selectedEventId)

    // Sort events by date descending by default for easier access to recent/upcoming
    const sortedEvents = [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Select Event</h2>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[400px] justify-between"
                        >
                            {selectedEventId
                                ? (() => {
                                    const e = events.find((event) => event.id === selectedEventId)
                                    return e ? `${format(new Date(e.startDate), "dd/MM")} - ${e.title}` : "Select event..."
                                })()
                                : "Select event..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Search event..." />
                            <CommandList>
                                <CommandEmpty>No event found.</CommandEmpty>
                                <CommandGroup>
                                    {sortedEvents.map((event) => (
                                        <CommandItem
                                            key={event.id}
                                            value={`${event.title} ${format(new Date(event.startDate), "yyyy-MM-dd")}`}
                                            onSelect={() => {
                                                setSelectedEventId(event.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedEventId === event.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{event.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(event.startDate), "PPP")}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedEvent ? (
                <div className="border rounded-lg p-6 bg-card shadow-sm">
                    <div className="mb-6 pb-4 border-b">
                        <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                            <span>📅 {format(new Date(selectedEvent.startDate), "PPP")}</span>
                            {selectedEvent.resource?.location && (
                                <span>📍 {selectedEvent.resource.location}</span>
                            )}
                            {selectedEvent.resource?.instructor && (
                                <span>👤 {selectedEvent.resource.instructor.fullName}</span>
                            )}
                        </div>
                    </div>

                    <EventStudentManager
                        eventId={selectedEvent.id}
                        eventTitle={selectedEvent.title}
                        eventStart={selectedEvent.startDate}
                        eventResource={selectedEvent.resource}
                        viewMode="grid"
                    />
                </div>
            ) : (
                <div className="h-[400px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    Select an event to manage its workbook
                </div>
            )}
        </div>
    )
}
