import { db } from "@/lib/db";
import StatsCard from "@/components/statistics-card-1";
import StatsCardsWithLinks from "@/components/ui/stats-cards-with-links";

import { format } from "date-fns";
import { UpcomingCourses } from "@/components/dashboard/upcoming-courses";
import { PendingDocsWidget } from "@/components/dashboard/pending-docs-widget";
import { ActionsSummaryWidget } from "@/components/dashboard/actions-summary-widget";
import { checkDocumentCompleteness } from "@/app/actions/student-automation";
import { StudentStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { ExpiringCertificatesWidget } from "@/components/dashboard/expiring-certificates-widget";



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
    const completionsCount = students.filter(s => s.status === 'COURSE_COMPLETED').length;

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

    // 6. Fetch Students for Automation Suggestions
    // Students who need document requests (REGISTERED status)
    const documentsNeeded = await db.student.findMany({
        where: { status: 'REGISTERED' },
        select: {
            id: true,
            fullName: true,
            email: true,
            status: true
        }
    });

    // Students with documents ready for lecture notes
    // (DOCS_REQ_SENT or PAYMENT_COMPLETED with all required docs approved)
    const potentialNotesReady = await db.student.findMany({
        where: {
            OR: [
                { status: 'DOCS_REQ_SENT' as any },
                { status: 'PAYMENT_COMPLETED' as any }
            ]
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            status: true
        }
    });

    // Check which students have all documents complete (Optimized Bulk Check)
    const requiredDocTypes = await db.documentType.findMany({
        where: { isRequired: true },
        select: { id: true }
    });
    const requiredDocTypeIds = new Set(requiredDocTypes.map(d => d.id));

    const studentIds = potentialNotesReady.map(s => s.id);

    // Fetch all approved documents for these students in one query
    const allApprovedDocs = await db.studentDocument.findMany({
        where: {
            studentId: { in: studentIds },
            status: "APPROVED"
        },
        select: { studentId: true, documentTypeId: true }
    });

    // Group documents by student for efficient lookup
    const studentDocsMap = new Map<string, Set<string>>();
    allApprovedDocs.forEach(doc => {
        if (!studentDocsMap.has(doc.studentId)) {
            studentDocsMap.set(doc.studentId, new Set());
        }
        studentDocsMap.get(doc.studentId)!.add(doc.documentTypeId);
    });

    // Filter students who have ALL required document types
    const notesReady = potentialNotesReady.filter(student => {
        if (requiredDocTypeIds.size === 0) return true; // No required docs = ready

        const uploadedDocTypes = studentDocsMap.get(student.id);
        if (!uploadedDocTypes) return false;

        // Check if every required doc ID exists in the student's uploaded docs
        for (const reqId of requiredDocTypeIds) {
            if (!uploadedDocTypes.has(reqId)) return false;
        }
        return true;
    });

    // 7. Fetch Expiring Certificates (Next 30 Days)
    const expiringStudents = await db.student.findMany({
        where: {
            certificateExpiryDate: {
                gte: new Date(),
                lte: addDays(new Date(), 30)
            }
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            certificateExpiryDate: true
        },
        orderBy: {
            certificateExpiryDate: 'asc'
        },
        take: 10
    } as any);

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Quick Stats</h2>
                <StatsCardsWithLinks stats={quickStats} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-24">
                {/* Upcoming Courses (Top Left) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Upcoming Courses</h2>
                    <UpcomingCourses />
                </div>

                {/* Pending Documents (Top Right) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Pending Documents</h2>
                    <PendingDocsWidget documents={pendingDocs as any} />
                </div>

                {/* Automation Suggestions (Bottom Left) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Suggested Actions</h2>
                    <ActionsSummaryWidget
                        documentsNeeded={documentsNeeded}
                        notesReady={notesReady}
                    />
                </div>

                {/* Expiring Certificates (Bottom Right) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Expiring Certificates</h2>
                    <ExpiringCertificatesWidget students={expiringStudents as any} />
                </div>
            </div>
        </div>
    );
}
