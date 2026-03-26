import { TicketInbox } from "@/components/admin/tickets/ticket-inbox"

export const dynamic = "force-dynamic"

export default function TicketsPage() {
    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Tickets & Communications</h1>
                <p className="text-sm text-muted-foreground">Manage inbound emails and student replies natively.</p>
            </div>
            
            <div className="flex-1 min-h-0 bg-card rounded-xl border shadow-sm flex overflow-hidden">
                <TicketInbox />
            </div>
        </div>
    )
}
