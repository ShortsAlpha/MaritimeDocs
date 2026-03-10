'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentUserBranch } from '@/lib/branch'
import { revalidatePath } from 'next/cache'

const BRANCH_OVERRIDE_COOKIE = 'branch-override'

/**
 * Sets the active branch override for SUPER_ADMIN users.
 * Pass null or "all" to view all branches.
 */
export async function setActiveBranch(branchId: string | null) {
    const branch = await getCurrentUserBranch()
    if (!branch || branch.role !== 'SUPER_ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const cookieStore = await cookies()

    if (!branchId || branchId === 'all') {
        cookieStore.delete(BRANCH_OVERRIDE_COOKIE)
    } else {
        // Verify the branch exists
        const targetBranch = await db.branch.findUnique({ where: { id: branchId } })
        if (!targetBranch) {
            return { success: false, message: 'Branch not found' }
        }
        cookieStore.set(BRANCH_OVERRIDE_COOKIE, branchId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        })
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

/**
 * Gets all available branches (for the switcher dropdown).
 */
export async function getAllBranches() {
    const branch = await getCurrentUserBranch()
    if (!branch || branch.role !== 'SUPER_ADMIN') return []

    return db.branch.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true }
    })
}

/**
 * Gets the currently active branch override from cookies.
 * Returns null if no override (meaning "All Branches" view).
 */
export async function getActiveBranchOverride(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(BRANCH_OVERRIDE_COOKIE)?.value || null
}
