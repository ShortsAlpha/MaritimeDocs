import { db } from "@/lib/db";
import { ReportFilters } from "@/components/reports/report-filters";
import { FeedbackReportCard } from "@/components/reports/feedback-report-card";

export default async function ReportsPage() {
    // Fetch filter options
    const courses = await db.course.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } });
    const intakes = await db.intake.findMany({ select: { id: true, name: true }, orderBy: { startDate: 'desc' } });
    const nationalities = await db.student.groupBy({
        by: ['nationality'],
        where: { nationality: { not: null } },
        orderBy: { nationality: 'asc' }
    }).then(groups => groups.map(g => g.nationality).filter(Boolean) as string[]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Advanced Reporting</h1>
                <p className="text-muted-foreground">
                    Filter student records and export customized reports to Excel.
                </p>
            </div>

            <ReportFilters
                courses={courses}
                intakes={intakes}
                nationalities={nationalities}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <FeedbackReportCard />
            </div>
        </div>
    );
}
