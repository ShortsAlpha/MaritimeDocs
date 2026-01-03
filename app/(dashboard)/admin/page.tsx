import { db } from "@/lib/db";
import StatsCard from "@/components/statistics-card-1";
import StatsCardsWithLinks from "@/components/ui/stats-cards-with-links";
import StatsWithChart from "@/components/ui/stats-with-chart";
import { format } from "date-fns";


export default async function AdminPage() {
    // 1. Fetch Data
    const students = await db.student.findMany({
        include: { payments: true }
    });

    const payments = await db.payment.findMany();

    // 2. Calculate KPIs
    const studentCount = students.length;

    // Convert decimals to numbers
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const totalExpectedRevenue = students.reduce((acc, s) => acc + Number(s.totalFee), 0);
    const outstandingBalance = totalExpectedRevenue - totalRevenue;

    // 3. Prepare Stats
    const stats = [
        {
            title: 'Total Revenue',
            value: totalRevenue,
            delta: 12.5, // Dummy delta
            lastMonth: totalRevenue * 0.9, // Dummy last month
            positive: true,
            prefix: '€',
            suffix: '',
        },
        {
            title: 'Outstanding Balance',
            value: outstandingBalance,
            delta: -2.0,
            lastMonth: outstandingBalance + 200,
            positive: false,
            prefix: '€',
            suffix: '',
        },
        {
            title: 'Total Students',
            value: studentCount,
            delta: 8.2,
            lastMonth: Math.max(0, studentCount - 1),
            positive: true,
            prefix: '',
            suffix: '',
        },
        {
            title: 'Payments This Month',
            value: payments.filter(p => p.date >= new Date(new Date().setDate(1))).length,
            delta: 5.0,
            lastMonth: 0,
            positive: true,
            prefix: '',
            suffix: '',
            format: (v: number) => v.toString()
        },
    ];

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            </div>

            {/* <StatsCard stats={stats} /> */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Quick Stats</h2>
                <StatsCardsWithLinks />
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Performance & Revenue</h2>
                <StatsWithChart />
            </div>
        </div>
    );
}
