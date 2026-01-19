import { db } from "@/lib/db";
import StatsCard from "@/components/statistics-card-1";
import StatsCardsWithLinks from "@/components/ui/stats-cards-with-links";

import { format } from "date-fns";
import { UpcomingCourses } from "@/components/dashboard/upcoming-courses";
import { PendingDocsWidget } from "@/components/dashboard/pending-docs-widget";



export default async function AdminPage() {
    // 1. Fetch Data
    const students = await db.student.findMany({
        include: { payments: true }
    });

    const payments = await db.payment.findMany();

    // Fetch Active Courses
    const activeCoursesCount = await db.courseEvent.count({
        where: {
            endDate: {
                gte: new Date()
            }
        }
    });

    // 2. Calculate KPIs
    const studentCount = students.length;

    // Convert decimals to numbers
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalExpectedRevenue = students.reduce((acc, s) => acc + Number(s.totalFee), 0);
    const outstandingBalance = totalExpectedRevenue - totalRevenue;

    // Completions (Graduated Students)
    const completionsCount = students.filter(s => s.status === 'GRADUATED').length;

    // 3. Prepare "Quick Stats" (StatsCardsWithLinks)
    const quickStats = [
        {
            name: "Total Students",
            value: studentCount.toString(),
            change: "+0%", // Needs history table for real delta
            changeType: "positive" as const, // Strict type
            href: "/admin/students",
        },
        {
            name: "Active Courses",
            value: activeCoursesCount.toString(),
            change: "Active",
            changeType: "positive" as const,
            href: "/admin/calendar",
        },
        {
            name: "Outstanding Payments",
            value: `€${outstandingBalance.toLocaleString('en-EU')}`,
            change: "Pending",
            changeType: outstandingBalance > 0 ? "negative" as const : "positive" as const, // Red if debt exists
            href: "/admin/students", // Or a finance page if exists
        },
    ];

    // 4. Prepare "Performance & Revenue" (StatsWithChart)
    // For now, we simulate chart history based on current totals because we don't have historical snapshots.
    // In a real app, we would query group-by date.

    // Mocking chart data based on real total to look nice but representing "Recent Activity"


    // Better Mock: 7 Days history generator (constant for stable UI, or randomized around average)





    // 5. Fetch Pending Documents
    const pendingDocs = await db.studentDocument.findMany({
        where: { status: 'PENDING' },
        include: {
            student: { select: { id: true, fullName: true } },
            documentType: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Quick Stats</h2>
                <StatsCardsWithLinks stats={quickStats} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <div className="col-span-4 space-y-6">

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Upcoming Courses</h2>
                        <UpcomingCourses />
                    </div>
                </div>
                <div className="col-span-3 space-y-6">
                    <div className="space-y-4">
                        {/* Pending Docs Widget */}
                        <PendingDocsWidget documents={pendingDocs as any} />
                    </div>
                </div>
            </div>
        </div>
    );
}
