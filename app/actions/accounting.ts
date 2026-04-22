'use server'

import { db } from "@/lib/db";
import { PaymentMethod, StudentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logger";
import { getCurrentUserBranch } from "@/lib/branch";

export async function addPayment(studentId: string, amount: number, method: PaymentMethod, note?: string, date?: Date) {
    try {
        const branch = await getCurrentUserBranch();

        await db.payment.create({
            data: {
                studentId,
                amount,
                method,
                note,
                date: date || new Date(),
                currency: branch?.currency || 'EUR',
                branchId: branch?.branchId || null,
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        const symbol = branch?.currency === 'BGN' ? 'лв' : '€';
        await logActivity({
            action: 'PAYMENT',
            title: `Payment Received: ${symbol}${amount}`,
            description: `Method: ${method} - Note: ${note || 'None'}`,
            userId: studentId,
            branchId: branch?.branchId,
            metadata: { amount, method, note, currency: branch?.currency }
        });

        await checkAndUpdatePaymentStatus(studentId);

        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to add payment" };
    }
}


export async function updateStudentFee(studentId: string, totalFee: number) {
    try {
        await db.student.update({
            where: { id: studentId },
            data: { totalFee }
        });

        revalidatePath(`/admin/students/${studentId}`);
        await checkAndUpdatePaymentStatus(studentId);
        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to update fee" };
    }
}

export async function updatePaymentAmount(paymentId: string, amount: number) {
    try {
        console.log(`Updating payment ${paymentId} to amount ${amount} (type: ${typeof amount})`);
        const payment = await db.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new Error("Payment not found");

        const updated = await db.payment.update({
            where: { id: paymentId },
            data: { amount }
        });
        console.log("Payment updated:", updated);

        revalidatePath(`/admin/students/${payment.studentId}`);

        await logActivity({
            action: 'PAYMENT',
            title: `Payment Updated: €${amount}`,
            description: `Payment ID: ${paymentId} updated`,
            userId: payment.studentId,
            metadata: { paymentId, newAmount: amount }
        });

        await checkAndUpdatePaymentStatus(payment.studentId);

        return { success: true };
    } catch (error) {
        console.error("Error updating payment:", error);
        return { success: false, message: "Failed to update payment amount" };
    }
}

export async function updatePaymentDate(paymentId: string, newDate: Date) {
    try {
        console.log(`Updating payment ${paymentId} to date ${newDate}`);
        const payment = await db.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new Error("Payment not found");

        const updated = await db.payment.update({
            where: { id: paymentId },
            data: { date: newDate }
        });

        revalidatePath(`/admin/students/${payment.studentId}`);

        await logActivity({
            action: 'PAYMENT',
            title: `Payment Date Updated`,
            description: `Payment ID: ${paymentId} date updated to ${newDate.toISOString()}`,
            userId: payment.studentId,
            metadata: { paymentId, newDate }
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating payment date:", error);
        return { success: false, message: "Failed to update payment date" };
    }
}

export async function deletePayment(paymentId: string) {
    try {
        console.log(`Deleting payment ${paymentId}`);
        const payment = await db.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new Error("Payment not found");

        await db.payment.delete({
            where: { id: paymentId }
        });

        revalidatePath(`/admin/students/${payment.studentId}`);

        await logActivity({
            action: 'PAYMENT',
            title: `Payment Deleted`,
            description: `Payment ID: ${paymentId} deleted. Amount was €${payment.amount.toString()}`,
            userId: payment.studentId,
            metadata: { paymentId, amount: payment.amount }
        });

        await checkAndUpdatePaymentStatus(payment.studentId);

        return { success: true };
    } catch (error) {
        console.error("Error deleting payment:", error);
        return { success: false, message: "Failed to delete payment" };
    }
}

export async function updateStudentPaymentDeadline(studentId: string, paymentDeadline: Date | null) {
    try {
        await db.student.update({
            where: { id: studentId },
            data: { 
                paymentDeadline,
                // Reset reminder sent if deadline is updated
                paymentReminderSent: paymentDeadline ? false : undefined 
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        await logActivity({
            action: 'PAYMENT',
            title: `Payment Deadline Updated`,
            description: paymentDeadline ? `Deadline set to ${paymentDeadline.toISOString()}` : `Deadline cleared`,
            userId: studentId,
            metadata: { paymentDeadline }
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating payment deadline:", error);
        return { success: false, message: "Failed to update payment deadline" };
    }
}

async function checkAndUpdatePaymentStatus(studentId: string) {
    try {
        const student = await db.student.findUnique({
            where: { id: studentId },
            include: { payments: true }
        });

        if (!student) return;

        const totalFee = Number(student.totalFee);
        const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0);

        const earlyStatuses = [
            StudentStatus.REGISTERED, 
            StudentStatus.DOCS_REQ_SENT, 
            StudentStatus.LECTURE_NOTES_SENT, 
            StudentStatus.PAYMENT_REMINDER_SENT
        ];

        if (totalPaid >= totalFee && totalFee > 0 && earlyStatuses.includes(student.status)) {
            await db.student.update({
                where: { id: studentId },
                data: { status: StudentStatus.PAYMENT_COMPLETED }
            });
            await logActivity({
                action: 'STATUS_UPDATE',
                title: 'Status Updated Automatically',
                description: 'Payment fully completed, status set to PAYMENT_COMPLETED',
                userId: studentId,
                metadata: { totalFee, totalPaid }
            });
        }
    } catch (error) {
        console.error("Failed to check and update payment status:", error);
    }
}
