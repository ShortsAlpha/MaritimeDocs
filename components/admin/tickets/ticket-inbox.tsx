"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Inbox,
    Search,
    UserCircle,
    Reply,
    MoreVertical,
    Clock,
    CheckCircle2,
    Loader2,
    Paperclip
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { getTickets, getTicketMessages, resolveTicket, sendTicketReply } from "@/app/actions/tickets";

type Ticket = {
    id: string;
    subject: string;
    contactEmail: string | null;
    status: 'OPEN' | 'CLOSED';
    updatedAt: Date;
    student?: { fullName: string; photoUrl: string | null } | null;
    messages: any[];
}

export function TicketInbox() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [replyText, setReplyText] = useState("");
    
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (activeTicketId) {
            fetchMessages(activeTicketId);
        } else {
            setMessages([]);
        }
    }, [activeTicketId]);

    const fetchTickets = async () => {
        setLoadingList(true);
        const res = await getTickets();
        if (res.success && res.tickets) {
            // @ts-ignore
            setTickets(res.tickets);
        } else {
            toast.error("Failed to load tickets");
        }
        setLoadingList(false);
    };

    const fetchMessages = async (id: string) => {
        setLoadingThread(true);
        const res = await getTicketMessages(id);
        if (res.success && res.ticket) {
            setMessages(res.ticket.messages);
        }
        setLoadingThread(false);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeTicketId) return;

        setSending(true);
        const res = await sendTicketReply(activeTicketId, replyText);
        if (res.success) {
            toast.success("Reply sent seamlessly via Resend");
            setReplyText("");
            await fetchMessages(activeTicketId);
            fetchTickets(); // Refresh list to bump timestamp
        } else {
            toast.error(res.message || "Failed to send reply");
        }
        setSending(false);
    };

    const handleCloseTicket = async () => {
        if (!activeTicketId) return;
        const res = await resolveTicket(activeTicketId);
        if (res.success) {
            toast.success("Ticket closed");
            fetchTickets();
        }
    };

    const activeTicket = tickets.find(t => t.id === activeTicketId);

    return (
        <>
            {/* Left Sidebar: Thread List */}
            <div className="w-[380px] border-r flex flex-col bg-muted/40 shrink-0">
                <div className="p-4 border-b bg-background flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                        <Inbox className="h-5 w-5 text-primary" />
                        Inbox
                    </div>
                    <Badge variant="secondary">{tickets.length}</Badge>
                </div>
                <div className="p-4 border-b bg-background">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search emails..." className="pl-9 bg-muted/50" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {loadingList ? (
                        <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No tickets found.</div>
                    ) : (
                        <div className="flex flex-col">
                            {tickets.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setActiveTicketId(t.id)}
                                    className={cn(
                                        "flex flex-col items-start gap-2 p-4 text-left text-sm transition-all hover:bg-muted",
                                        activeTicketId === t.id ? "bg-muted border-l-4 border-l-primary" : "border-b border-l-4 border-l-transparent"
                                    )}
                                >
                                    <div className="w-full flex justify-between items-center gap-2">
                                        <div className="font-semibold truncate">
                                            {t.student ? t.student.fullName : t.contactEmail?.split('@')[0]}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium truncate w-full pr-4 text-foreground/80">
                                        {t.subject}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate w-full pr-4 line-clamp-1">
                                        {t.messages[0]?.body?.replace(/<[^>]*>?/gm, '') || "No content"}
                                    </div>
                                    {t.status === 'CLOSED' && (
                                        <Badge variant="secondary" className="text-[10px] h-4 mt-1 px-1">Closed</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Pane: Reading Pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-background relative">
                {!activeTicketId || !activeTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                        <Inbox className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h2 className="text-xl font-medium text-foreground">No conversation selected</h2>
                        <p className="text-sm mt-2">Select an email thread from the left to read and reply.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b flex items-center justify-between shrink-0">
                            <div className="flex items-start gap-4 overflow-hidden">
                                <Avatar className="h-12 w-12 border shadow-sm">
                                    <AvatarImage src={activeTicket.student?.photoUrl || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {activeTicket.student ? activeTicket.student.fullName.charAt(0) : <UserCircle />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                    <h2 className="text-xl font-semibold truncate leading-tight">{activeTicket.subject}</h2>
                                    <div className="text-sm text-muted-foreground truncate mt-1 flex items-center gap-2">
                                        <span>{activeTicket.student?.fullName || 'Unknown Student'}</span>
                                        <span>&middot;</span>
                                        <span>{activeTicket.contactEmail}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={handleCloseTicket} disabled={activeTicket.status === 'CLOSED'}>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                    {activeTicket.status === 'CLOSED' ? 'Closed' : 'Mark Resolved'}
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Thread ScrollArea */}
                        <ScrollArea className="flex-1 p-6 z-0">
                            {loadingThread ? (
                                <div className="py-12 text-center text-muted-foreground flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-6">
                                    {messages.map((msg, idx) => {
                                        const isStaff = !msg.isFromStudent;
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col gap-2 relative", isStaff ? "items-end" : "items-start")}>
                                                
                                                {/* Meta bar */}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                                    <span className="font-semibold text-foreground/70">{isStaff ? 'Xone Academy' : activeTicket.student?.fullName || msg.fromEmail}</span>
                                                    <span>&middot;</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                                                </div>

                                                {/* Message Bubble */}
                                                <div className={cn(
                                                    "px-5 py-4 rounded-2xl max-w-[90%] text-sm whitespace-pre-wrap shadow-sm border",
                                                    isStaff 
                                                        ? "bg-blue-600 text-white rounded-tr-sm border-blue-500" 
                                                        : "bg-muted rounded-tl-sm border-border"
                                                )}>
                                                    {msg.body}
                                                    
                                                    {msg.attachments && (
                                                        <div className="mt-4 pt-3 border-t border-current/10 flex flex-col gap-2">
                                                            <div className="text-xs font-semibold opacity-80 flex items-center gap-1"><Paperclip className="h-3 w-3"/> Attachments:</div>
                                                            {/* Render attachments array safely */}
                                                            {Object.entries(msg.attachments).map(([key, val]: any) => (
                                                                <a key={key} href={val} target="_blank" rel="noreferrer" className="text-xs bg-background/20 px-2 py-1 rounded truncate hover:bg-background/40 transition">
                                                                    📎 {typeof val === 'string' ? val.split('/').pop() : 'Attachment'}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Reply Box */}
                        <div className="p-4 border-t bg-muted/20 shrink-0 z-10">
                            <div className="max-w-3xl mx-auto flex flex-col gap-3 bg-background border rounded-xl shadow-sm p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                <Textarea 
                                    className="min-h-[100px] border-0 focus-visible:ring-0 resize-none shadow-none" 
                                    placeholder={activeTicket.status === 'CLOSED' ? "This ticket is closed. Reopen by replying..." : "Type your reply professionally..."}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    disabled={sending}
                                />
                                <div className="flex items-center justify-between px-2 pb-1">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button size="sm" className="gap-2 px-6" onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                                        Send Reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
