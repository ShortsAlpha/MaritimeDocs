'use server'

import { db } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logger";

export async function addPayment(studentId: string, amount: number, method: PaymentMethod, note?: string) {
    try {
        await db.payment.create({
            data: {
                studentId,
                amount,
                method,
                note
            }
        });

        revalidatePath(`/admin/students/${studentId}`);

        await logActivity({
            action: 'PAYMENT',
            title: `Payment Received: €${amount}`,
            description: `Method: ${method} - Note: ${note || 'None'}`,
            userId: studentId,
            metadata: { amount, method, note }
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
