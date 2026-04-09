'use server'

import { db } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
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

        return { success: true };
    } catch (error) {
        console.error("Error deleting payment:", error);
        return { success: false, message: "Failed to delete payment" };
    }
}
