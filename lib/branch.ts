import { db } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { cookies } from "next/headers"

export type BranchContext = {
  userId: string
  branchId: string
  branchCode: string
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "STAFF"
  timezone: string
  currency: string
  isOverride: boolean // true when SUPER_ADMIN has selected a specific branch
}

/**
 * Returns true if queries should be filtered by branchId.
 * SUPER_ADMIN without override = false (sees all)
 * SUPER_ADMIN with override = true (sees selected branch)
 * Everyone else = true (sees own branch)
 */
export function shouldFilterByBranch(branch: BranchContext | null): boolean {
  if (!branch) return false
  if (branch.role === 'SUPER_ADMIN' && !branch.isOverride) return false
  return true
}

const BRANCH_OVERRIDE_COOKIE = 'branch-override'

/**
 * Gets the current user's branch context from DB.
 * For SUPER_ADMIN users, checks for a branch override cookie
 * (set via the Branch Switcher UI).
 * Returns null if user is not authenticated or not found in DB.
 */
export async function getCurrentUserBranch(): Promise<BranchContext | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    const dbUser = await db.user.findUnique({
      where: { id: clerkUser.id },
      include: { branch: true }
    })

    if (!dbUser || !dbUser.branch) return null

    const role = dbUser.role as BranchContext["role"]

    // SUPER_ADMIN: check for branch override cookie
    if (role === 'SUPER_ADMIN') {
      try {
        const cookieStore = await cookies()
        const overrideBranchId = cookieStore.get(BRANCH_OVERRIDE_COOKIE)?.value

        if (overrideBranchId) {
          const overrideBranch = await db.branch.findUnique({
            where: { id: overrideBranchId }
          })
          if (overrideBranch) {
            return {
              userId: dbUser.id,
              branchId: overrideBranch.id,
              branchCode: overrideBranch.code,
              role, // Still SUPER_ADMIN but scoped to override branch
              timezone: overrideBranch.timezone,
              currency: overrideBranch.currency,
              isOverride: true,
            }
          }
        }
      } catch {
        // cookies() can fail in certain contexts, fall through
      }
    }

    return {
      userId: dbUser.id,
      branchId: dbUser.branch.id,
      branchCode: dbUser.branch.code,
      role,
      timezone: dbUser.branch.timezone,
      currency: dbUser.branch.currency,
      isOverride: false,
    }
  } catch (error) {
    console.error("getCurrentUserBranch error:", error)
    return null
  }
}

/**
 * Returns the R2 storage prefix for a branch.
 * e.g. "hq" for Malta, "bg" for Bulgaria, "gr" for Greece
 */
export function getBranchStoragePrefix(branchCode: string): string {
  return branchCode.toLowerCase()
}

