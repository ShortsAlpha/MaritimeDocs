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
import { getCurrentUserBranch, shouldFilterByBranch } from "@/lib/branch";



export default async function AdminPage() {
    const branch = await getCurrentUserBranch();
    const branchFilter = shouldFilterByBranch(branch) ? { branchId: branch!.branchId } : {};
    // 1. Fetch Data Concurrently
    const [
        students,
        payments,
        activeCoursesCount,
        pendingDocs,
        documentsNeeded,
        potentialNotesReady,
        requiredDocTypes
    ] = await Promise.all([
        db.student.findMany({
            where: branchFilter,
            include: { payments: true }
        }),
        db.payment.findMany({ where: branchFilter }),
        db.courseEvent.count({
            where: {
                endDate: { gte: new Date() },
                ...branchFilter
            }
        }),
        db.studentDocument.findMany({
            where: {
                status: 'PENDING',
                ...(shouldFilterByBranch(branch) ? { student: { is: { branchId: branch!.branchId } } } : {})
            },
            include: {
                student: { select: { id: true, fullName: true } },
                documentType: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        db.student.findMany({
            where: { status: 'REGISTERED', ...branchFilter },
            select: { id: true, fullName: true, email: true, status: true }
        }),
        db.student.findMany({
            where: {
                OR: [
                    { status: 'DOCS_REQ_SENT' as any },
                    { status: 'PAYMENT_COMPLETED' as any }
                ],
                ...branchFilter
            },
            select: { id: true, fullName: true, email: true, status: true }
        }),
        db.documentType.findMany({
            where: { isRequired: true },
            select: { id: true }
        })
    ]);

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

    // Check which students have all documents complete (Optimized Bulk Check)
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
    const expiringDocs = await db.studentDocument.findMany({
        where: {
            expiryDate: {
                gte: new Date(),
                lte: addDays(new Date(), 30)
            },
            status: "APPROVED",
            documentType: {
                category: "CERTIFICATE"
            },
            ...(shouldFilterByBranch(branch) ? { student: { branchId: branch!.branchId } } : {})
        },
        include: {
            student: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true
                }
            },
            documentType: {
                select: { title: true }
            }
        },
        orderBy: {
            expiryDate: 'asc'
        },
        take: 10
    });

    const expiringStudents = expiringDocs.map(doc => ({
        id: doc.student.id,
        fullName: `${doc.student.fullName} (${doc.documentType.title})`,
        email: doc.student.email,
        phone: doc.student.phone,
        certificateExpiryDate: doc.expiryDate
    }));

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
                    <UpcomingCourses branchFilter={branchFilter} />
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
