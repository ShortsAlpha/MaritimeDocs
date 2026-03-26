"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, CalendarDays, MessageSquare, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addStudentRemark, deleteStudentRemark } from "@/app/actions/students";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StudentRemarksTab({ studentId, remarks }: { studentId: string, remarks: any[] }) {
    const [note, setNote] = useState("");
    const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = () => {
        if (!note.trim()) {
            toast.error("Please enter a remark.");
            return;
        }
        startTransition(async () => {
            const res = await addStudentRemark(studentId, note, dateStr);
            if (res.success) {
                toast.success("Remark added");
                setNote("");
                setDateStr(format(new Date(), "yyyy-MM-dd"));
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteStudentRemark(id, studentId);
            if (res.success) {
                toast.success("Remark deleted");
            } else {
                toast.error(res.message);
            }
            setDeletingId(null);
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Student Remarks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 border p-4 rounded-xl bg-muted/40">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Textarea 
                                    placeholder="Add a new note or remark about this student..." 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="min-h-[100px] resize-y bg-background"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="w-full sm:w-[220px] flex flex-col gap-3 shrink-0">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" /> Date
                                    </label>
                                    <Input 
                                        type="date"
                                        value={dateStr}
                                        onChange={(e) => setDateStr(e.target.value)}
                                        className="bg-background"
                                        disabled={isPending}
                                    />
                                </div>
                                <Button 
                                    onClick={handleAdd} 
                                    disabled={isPending || !note.trim()} 
                                    className="w-full"
                                >
                                    {isPending && !deletingId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add Remark
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        {remarks.length === 0 ? (
                            <div className="text-center py-12 border rounded-xl bg-muted/20 border-dashed">
                                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-3" />
                                <h3 className="text-lg font-medium text-muted-foreground">No remarks yet</h3>
                                <p className="text-sm text-muted-foreground/70">Add notes and observations about the student above.</p>
                            </div>
                        ) : (
                            remarks.map((remark) => (
                                <div key={remark.id} className="group flex gap-4 p-4 rounded-xl border bg-card hover:bg-muted/10 transition-colors">
                                    <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center border bg-background shadow-sm">
                                        <div className="text-center leading-none text-foreground">
                                            <div className="text-[10px] font-bold uppercase text-muted-foreground">{format(new Date(remark.date), "MMM")}</div>
                                            <div className="text-sm font-black">{format(new Date(remark.date), "dd")}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {format(new Date(remark.date), "EEEE, MMMM do yyyy")}
                                                    <span className="opacity-50 mx-1">•</span>
                                                    Added {format(new Date(remark.createdAt), "MMM d")}
                                                </div>
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{remark.note}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                onClick={() => handleDelete(remark.id)}
                                                disabled={isPending}
                                            >
                                                {deletingId === remark.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
