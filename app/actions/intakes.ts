'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createIntake(name: string, startDate?: string) {
    try {
        await db.intake.create({
            data: {
                name,
                startDate: startDate ? new Date(startDate) : undefined,
                status: "ACTIVE"
            }
        });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Create Intake Error:", error);
        return { success: false, message: "Failed to create intake" };
    }
}

export async function deleteIntake(id: string) {
    try {
        await db.intake.delete({
            where: { id }
        });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Delete Intake Error:", error);
        return { success: false, message: "Failed to delete intake. It might have students assigned." };
    }
}

export async function getIntakes() {
    try {
        return await db.intake.findMany({
            orderBy: { startDate: 'desc' }
        });
    } catch (error) {
        return [];
    }
}
