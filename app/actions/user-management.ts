'use server'

import { db } from "@/lib/db"
import { getCurrentUserBranch } from "@/lib/branch"
import { revalidatePath } from "next/cache"

export async function updateUserRoleAndBranch(
    userId: string,
    role: string,
    branchId: string
) {
    const branch = await getCurrentUserBranch()
    if (!branch || branch.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                role: role as any,
                branchId: branchId,
            }
        })

        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to update user:', error)
        return { success: false, error: 'Failed to update user' }
    }
}

export async function getUsers() {
    const branch = await getCurrentUserBranch()
    if (!branch || branch.role !== 'SUPER_ADMIN') return []

    return db.user.findMany({
        include: { branch: true },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getBranches() {
    return db.branch.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true }
    })
}
