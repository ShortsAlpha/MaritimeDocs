"use client";

import { useState, useEffect, useMemo, useOptimistic, startTransition } from "react";
import { format, differenceInDays, addDays, isWeekend } from "date-fns";
import { Loader2, Users, Check, CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { getEventsWithStudents, getAttendanceForEvents, toggleAttendanceCell } from "@/app/actions/attendance";

type AttendanceRecord = {
    id: string;
    studentId: string;
    eventId: string;
    date: Date;
    isPresent: boolean;
};

export function AttendanceMatrix() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    
    // Remote state
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [optimisticAttendances, addOptimisticToggle] = useOptimistic(
        attendances,
        (state, newToggle: { studentId: string; eventId: string; date: Date; isPresent: boolean }) => {
            const dateStr = new Date(newToggle.date).toISOString().split('T')[0];
            const existingIndex = state.findIndex(a => 
                a.studentId === newToggle.studentId && 
                a.eventId === newToggle.eventId && 
                new Date(a.date).toISOString().split('T')[0] === dateStr
            );

            let newState = [...state];

            if (existingIndex >= 0) {
                if (!newToggle.isPresent) {
                    newState.splice(existingIndex, 1);
                } else {
                    newState[existingIndex] = { ...newState[existingIndex], isPresent: true };
                }
            } else if (newToggle.isPresent) {
                newState.push({
                    id: "temp-" + Date.now(),
                    studentId: newToggle.studentId,
                    eventId: newToggle.eventId,
                    date: newToggle.date,
                    isPresent: true
                });
            }
            return newState;
        }
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await getEventsWithStudents();
        if (res.success && res.events && res.events.length > 0) {
            setEvents(res.events);
            setSelectedEventId(res.events[0].id);
        }
        setLoading(false);
    };

    // When Event changes, load related attendance data
    useEffect(() => {
        if (!selectedEventId) return;

        const fetchMatrix = async () => {
            setLoading(true);
            const res = await getAttendanceForEvents([selectedEventId]);
            if (res.success && res.attendances) {
                setAttendances(res.attendances);
            }
            setLoading(false);
        };
        fetchMatrix();
    }, [selectedEventId]);

    const handleToggle = async (studentId: string, eventId: string, date: Date, currentState: boolean) => {
        const newState = !currentState;
        
        startTransition(() => {
            addOptimisticToggle({ studentId, eventId, date, isPresent: newState });
        });

        const res = await toggleAttendanceCell(studentId, eventId, date.toISOString(), newState);
        if (!res.success) {
            toast.error("Failed to save: " + res.message);
            // Re-fetch everything if it fails to fix sync
            const fetchMatrix = async () => {
                const r = await getAttendanceForEvents([selectedEventId]);
                if (r.success && r.attendances) setAttendances(r.attendances);
            };
            fetchMatrix();
        } else {
            // Manually sync local client state because useOptimistic will drop its payload
            // once this async transition boundary function finishes!
            setAttendances(prev => {
                const dateStr = new Date(date).toISOString().split('T')[0];
                const existingIndex = prev.findIndex(a => 
                    a.studentId === studentId && 
                    a.eventId === eventId && 
                    new Date(a.date).toISOString().split('T')[0] === dateStr
                );

                let next = [...prev];
                if (existingIndex >= 0) {
                    if (!newState) {
                        next.splice(existingIndex, 1);
                    } else {
                        next[existingIndex] = { ...next[existingIndex], isPresent: true };
                    }
                } else if (newState) {
                    next.push({
                        id: "temp-" + Date.now(),
                        studentId: studentId,
                        eventId: eventId,
                        date: date,
                        isPresent: true
                    });
                }
                return next;
            });
        }
    };

    const activeEvent = events.find(e => e.id === selectedEventId);

    // Determine students (from direct event relation or fallback to intake)
    const activeStudents = useMemo(() => {
        if (!activeEvent) return [];
        if (activeEvent.students && activeEvent.students.length > 0) return activeEvent.students;
        if (activeEvent.intake && activeEvent.intake.students) return activeEvent.intake.students;
        return [];
    }, [activeEvent]);

    const dates = useMemo(() => {
        if (!activeEvent) return [];
        const start = new Date(activeEvent.startDate);
        const end = new Date(activeEvent.endDate);
        const daysCount = Math.max(0, differenceInDays(end, start));
        
        const maxDays = Math.min(daysCount, 90); 
        let eventDates = [];
        for (let i = 0; i <= maxDays; i++) {
            eventDates.push(addDays(start, i));
        }
        return eventDates;
    }, [activeEvent]);

    const isPresentCell = (studentId: string, eventId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return optimisticAttendances.some(a => {
            const aDateStr = new Date(a.date).toISOString().split('T')[0];
            return a.studentId === studentId && 
                   a.eventId === eventId && 
                   aDateStr === dateStr &&
                   a.isPresent;
        });
    };

    if (loading && events.length === 0) {
        return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
    }

    if (!activeEvent) {
        return (
            <div className="p-12 text-center border rounded-lg bg-card shadow-sm">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold">No Events Found</h2>
                <p className="text-muted-foreground mt-2">Create calendar events linked to intakes to track attendance.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{activeEvent.title} Attendance</h2>
                    <p className="text-muted-foreground">Managing {activeStudents.length} students across {dates.length} days. Instructor: {activeEvent.instructor?.fullName || 'TBD'}</p>
                </div>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-[350px] border-primary/20 bg-card">
                        <SelectValue placeholder="Select Course Event" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map((evt: any) => (
                            <SelectItem key={evt.id} value={evt.id}>
                                {evt.title} ({format(new Date(evt.startDate), 'MMM d, yyyy')}) {evt.intake ? ` - ${evt.intake.name}` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading && events.length > 0 && <span className="text-xs text-muted-foreground animate-pulse">Syncing...</span>}

            <div className="rounded-xl border shadow-md bg-card ring-1 ring-border/50 overflow-hidden">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="inline-flex flex-col min-w-max pb-3">
                        
                        {/* Headers */}
                        <div className="flex sticky top-0 z-20">
                            {/* Top Left Corner */}
                            <div className="w-[280px] shrink-0 sticky left-0 z-30 flex items-center justify-center p-3 border-r border-b border-border bg-slate-100 dark:bg-slate-900 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                <div className="flex flex-col items-center opacity-80">
                                    <CalendarDays className="h-5 w-5 mb-1 text-primary" />
                                    <span className="font-semibold text-xs text-center uppercase tracking-widest text-muted-foreground">
                                        {activeEvent.intake ? `${activeEvent.intake.name}` : "EVENT ATTENDANCE"}
                                    </span>
                                </div>
                            </div>
                            
                            {/* The Single Event Column Group */}
                            <div className="flex flex-col text-center border-r border-border bg-slate-50 dark:bg-slate-950/50">
                                {/* Event Title Row */}
                                <div className="py-2.5 px-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 rounded-r-full"></div>
                                    <span className="font-semibold tracking-tight text-sm text-foreground">
                                        {activeEvent.title}
                                    </span>
                                </div>
                                {/* Days Row */}
                                <div className="flex">
                                    {dates.map((d: Date, j: number) => {
                                        const weekend = isWeekend(d);
                                        return (
                                            <div key={j} className={cn(
                                                "w-[46px] py-1.5 border-r border-b border-border/60 flex flex-col items-center justify-center transition-colors", 
                                                weekend ? "bg-slate-100 dark:bg-slate-800/80 text-muted-foreground" : "bg-transparent text-foreground"
                                            )}>
                                                <span className="text-[9px] font-medium uppercase opacity-50 mb-0.5 tracking-wider">{format(d, 'EEE')}</span>
                                                <span className="text-sm font-bold">{format(d, 'd')}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Student Rows */}
                        {activeStudents.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Users className="h-10 w-10 mb-3 opacity-20" />
                                <span>No students enrolled in this event.</span>
                            </div>
                        ) : (
                            activeStudents.map((student: any, rowIndex: number) => (
                                <div key={student.id} className="flex border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-sm group transition-colors duration-150">
                                    {/* Premium Student Name Cell */}
                                    <div className="w-[280px] shrink-0 sticky left-0 z-10 bg-card border-r border-border/60 flex items-center px-4 font-medium shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] group-hover:bg-accent/50 group-hover:text-accent-foreground transition-colors duration-150">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {rowIndex + 1}
                                            </div>
                                            <span className="tracking-tight">{student.fullName}</span>
                                        </div>
                                    </div>

                                    {/* Attendance Marks */}
                                    <div className="flex">
                                        {dates.map((d: Date, j: number) => {
                                            const weekend = isWeekend(d);
                                            const present = isPresentCell(student.id, activeEvent.id, d);
                                            return (
                                                <button
                                                    key={j}
                                                    onClick={() => handleToggle(student.id, activeEvent.id, d, present)}
                                                    className={cn(
                                                        "w-[46px] h-12 border-r border-border/50 flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40",
                                                        weekend ? "bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-700" : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
                                                        present && "bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                                    )}
                                                >
                                                    {present ? (
                                                        <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 drop-shadow-sm scale-110" strokeWidth={3} />
                                                    ) : (
                                                        <span className="opacity-0 group-hover:opacity-10 text-slate-400 dark:text-slate-500 text-lg transition-opacity duration-200">·</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2" />
                </ScrollArea>
            </div>
        </div>
    );
}

