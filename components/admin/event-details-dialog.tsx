"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Plus, Trash2, User } from "lucide-react"
import { toggleEventChecklistItem, addChecklistItem, deleteEventChecklistItem, deleteCourseEvent } from "@/app/actions/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: Date
    events: any[]
}

export function EventDetailsDialog({ open, onOpenChange, date, events }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule for {date.toDateString()}</DialogTitle>
                    <DialogDescription>
                        {events.length} class{events.length !== 1 ? 'es' : ''} scheduled for this day.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No events scheduled.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}



import { toast } from "sonner"
import { Loader2 } from "lucide-react"

function EventCard({ event }: { event: any }) {
    const [newItem, setNewItem] = useState("")
    const [isPending, setIsPending] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [checklistItems, setChecklistItems] = useState(event.resource?.checklist || [])

    // Sync state with props when event updates (e.g. after a revalidation)
    useEffect(() => {
        setChecklistItems(event.resource?.checklist || [])
    }, [event.resource?.checklist])

    const handleAddItem = async () => {
        if (!newItem.trim() || isPending) return
        setIsPending(true)

        try {
            const result = await addChecklistItem(event.id, newItem)

            if (result.success && result.item) {
                setChecklistItems((prev: any[]) => [...prev, result.item])
                setNewItem("")
            }
        } catch (error) {
            console.error("Failed to add item", error)
        } finally {
            setIsPending(false)
        }
    }

    const handleToggle = async (itemId: string, checked: boolean) => {
        // Optimistic update
        setChecklistItems((prev: any[]) => prev.map((item) =>
            item.id === itemId ? { ...item, isCompleted: checked } : item
        ))

        await toggleEventChecklistItem(itemId, checked)
        // No need to revert if it fails usually, but strictly we should. 
        // For this app, strict optimistic rollback is probably overkill.
    }

    const handleDeleteEvent = async () => {
        setIsDeleting(true)
        const res = await deleteCourseEvent(event.id)
        if (res.success) {
            toast.success("Event deleted")
        } else {
            toast.error("Failed to delete event")
            setIsDeleting(false)
        }
        setShowDeleteConfirm(false)
    }

    const handleDelete = async (itemId: string) => {
        // Optimistic update
        setChecklistItems((prev: any[]) => prev.filter((item) => item.id !== itemId))
        await deleteEventChecklistItem(itemId)
    }

    return (
        <>
            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm relative overflow-hidden group/card">
                <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                />
                {/* Delete Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="pl-2 pr-6">
                    <h4 className="font-semibold text-lg leading-none mb-2">{event.title}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                                {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                            </span>
                        </div>
                        {event.resource?.instructor && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{event.resource.instructor.fullName}</span>
                            </div>
                        )}
                        {event.resource?.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.resource.location}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-semibold mb-2">Checklist</h5>
                        <div className="space-y-4">
                            {checklistItems.map((item: any) => (
                                <div key={item.id} className="relative flex items-center space-x-2 group">
                                    <Checkbox
                                        id={item.id}
                                        checked={item.isCompleted}
                                        onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                                        className="transition-colors duration-300 z-10"
                                    />
                                    <div className="relative inline-block">
                                        <label
                                            htmlFor={item.id}
                                            className={`text-sm font-medium leading-none cursor-pointer transition-colors ${item.isCompleted ? "line-through text-muted-foreground" : ""
                                                }`}
                                        >
                                            {item.label}
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity z-10 ml-auto"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add item..."
                                className="h-8 text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddItem()
                                }}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={handleAddItem}
                                disabled={isPending}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            "{event.title}" and remove it from the calendar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
