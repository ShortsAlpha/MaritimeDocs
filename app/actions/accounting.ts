'use server'

import { db } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
