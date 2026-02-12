
import { db } from "@/lib/db"
import { WorkbookView } from "@/components/admin/workbook/workbook-view"

export const dynamic = "force-dynamic"

export default async function WorkbookPage() {
    const events = await db.courseEvent.findMany({
        include: {
            instructor: true,
            checklist: true
        },
        orderBy: {
            startDate: 'desc'
        }
    })

    const transformedEvents = events.map(evt => ({
        id: evt.id,
        title: evt.title,
        startDate: evt.startDate,
        endDate: evt.endDate,
        resource: {
            location: evt.location || undefined,
            instructor: evt.instructor ? {
                fullName: evt.instructor.fullName
            } : undefined
        }
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Workbook</h1>
                    <p className="text-sm text-muted-foreground">Manage student lists and details for events.</p>
                </div>
            </div>

            <WorkbookView events={transformedEvents} />
        </div>
    )
}
