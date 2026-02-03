'use server'

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type ReportFilters = {
    course?: string[];
    intakeId?: string;
    status?: string[];
    nationality?: string;
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export async function generateStudentReport(filters: ReportFilters) {
    try {
        const where: Prisma.StudentWhereInput = {};

        // 1. Course Filter
        if (filters.course && filters.course.length > 0) {
            where.course = { in: filters.course };
        }

        // 2. Intake Filter
        if (filters.intakeId && filters.intakeId !== 'all') {
            where.intakeId = filters.intakeId;
        }

        // 3. Status Filter
        if (filters.status && filters.status.length > 0) {
            where.status = { in: filters.status as any };
        }

        // 4. Nationality Filter
        if (filters.nationality && filters.nationality !== 'all') {
            where.nationality = filters.nationality;
        }

        // 5. Date Range (Created At)
        if (filters.dateRange?.from) {
            where.createdAt = {
                gte: filters.dateRange.from,
                lte: filters.dateRange.to || new Date()
            };
        }

        // Fetch students with payments to calculate financial status in memory
        // (Prisma doesn't easily support computed column filtering in 'where')
        const students = await db.student.findMany({
            where,
            include: {
                payments: true,
                intake: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // 6. Financial Status Filter implementation
        const filteredData = students.filter(student => {
            if (!filters.paymentStatus || filters.paymentStatus as string === 'all') return true;

            const totalFee = Number(student.totalFee);
            const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0);

            if (filters.paymentStatus === 'PAID') return totalPaid >= totalFee;
            if (filters.paymentStatus === 'UNPAID') return totalPaid === 0;
            if (filters.paymentStatus === 'PARTIAL') return totalPaid > 0 && totalPaid < totalFee;

            return true;
        });

        // Map to flat structure for Excel
        return filteredData.map(s => {
            const totalFee = Number(s.totalFee);
            const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);

            return {
                "Student Number": s.studentNumber || 'N/A',
                "Full Name": s.fullName,
                "Email": s.email || '',
                "Phone": s.phone || '',
                "Nationality": s.nationality || '',
                "Course": s.course || '',
                "Intake": s.intake?.name || '',
                "Status": s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                "Register Date": s.createdAt.toISOString().split('T')[0],
                "Total Fee": totalFee,
                "Total Paid": totalPaid,
                "Balance": totalFee - totalPaid,
                "Address": s.address ? s.address : 'No Address',
                "Date of Birth": s.dateOfBirth ? s.dateOfBirth.toISOString().split('T')[0] : ''
            };
        });

    } catch (error) {
        console.error("Report Generation Error:", error);
        throw new Error("Failed to generate report");
    }
}

export async function exportFeedbackReport() {
    try {
        const feedbacks = await db.feedback.findMany({
            include: {
                student: {
                    select: {
                        fullName: true,
                        course: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return feedbacks.map(f => ({
            "Date": f.createdAt.toISOString().split('T')[0],
            "Student Name": f.student.fullName,
            "Course Attended": f.courseAttended || f.student.course || "N/A",
            "Discovery Source": f.source || "N/A",

            "Registration Process (1-5)": f.registrationProcess,
            "Practical/Simulator (1-5)": f.practicalStandards,
            "Course Materials (1-5)": f.courseMaterials,
            "Course Content (1-5)": f.courseContent,
            "Instructor Effectiveness (1-5)": f.instructorEffectiveness,
            "Overall Impression (1-5)": f.overallImpression,
            "Staff Friendliness (1-5)": f.staffFriendliness,
            "Learning Effectiveness (1-5)": f.learningEffectiveness,

            "Recommend?": f.recommend,
            "Comment": f.comment || "",
        }));

    } catch (error) {
        console.error("Feedback Report Error:", error);
        throw new Error("Failed to export feedback");
    }
}
