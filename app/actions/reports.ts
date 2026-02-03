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

import ExcelJS from 'exceljs';

export async function exportFeedbackReportExcel() {
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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Feedback');

        // Define Columns
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Student Name', key: 'studentName', width: 25 },
            { header: 'Course Attended', key: 'course', width: 30 },
            { header: 'Source', key: 'source', width: 15 },
            { header: 'Registration (1-5)', key: 'reg', width: 18 },
            { header: 'Practical (1-5)', key: 'prac', width: 18 },
            { header: 'Materials (1-5)', key: 'mat', width: 18 },
            { header: 'Content (1-5)', key: 'cont', width: 18 },
            { header: 'Instructor (1-5)', key: 'inst', width: 18 },
            { header: 'Overall (1-5)', key: 'over', width: 18 },
            { header: 'Recommend?', key: 'rec', width: 15 },
            { header: 'Comment', key: 'comment', width: 50 },
        ];

        // Style Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F4E78' } // Dark Blue
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;

        // Add Data
        feedbacks.forEach(f => {
            const row = worksheet.addRow({
                date: f.createdAt.toISOString().split('T')[0],
                studentName: f.student.fullName,
                course: f.courseAttended || f.student.course || "N/A",
                source: f.source || "N/A",
                reg: f.registrationProcess,
                prac: f.practicalStandards,
                mat: f.courseMaterials,
                cont: f.courseContent,
                inst: f.instructorEffectiveness,
                over: f.overallImpression,
                rec: f.recommend, // Enum: YES, NO, MAYBE
                comment: f.comment || ""
            });

            // Center align rating numbers
            ['reg', 'prac', 'mat', 'cont', 'inst', 'over'].forEach(key => {
                // @ts-ignore
                row.getCell(key).alignment = { horizontal: 'center' };
            });

            // Color code "Recommend" cell
            const recCell = row.getCell('rec');
            recCell.alignment = { horizontal: 'center' };
            if (f.recommend === 'YES') {
                recCell.font = { color: { argb: 'FF006100' }, bold: true }; // Dark Green
                recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Light Green
            } else if (f.recommend === 'NO') {
                recCell.font = { color: { argb: 'FF9C0006' }, bold: true }; // Dark Red
                recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Light Red
            }
        });

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer).toString('base64');

    } catch (error) {
        console.error("Feedback Report Error:", error);
        throw new Error("Failed to export feedback: " + (error as Error).message);
    }
}
