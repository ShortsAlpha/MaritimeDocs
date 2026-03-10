"use client"

import { useState, useEffect, useTransition } from "react"
import { updateUserRoleAndBranch, getUsers, getBranches } from "@/app/actions/user-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Building2 } from "lucide-react"

type User = {
    id: string
    email: string
    name: string | null
    role: string
    branchId: string | null
    branch: { id: string; code: string; name: string } | null
    createdAt: Date
}

type Branch = {
    id: string
    code: string
    name: string
}

const ROLE_OPTIONS = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-500/10 text-red-500' },
    { value: 'BRANCH_ADMIN', label: 'Branch Admin', color: 'bg-amber-500/10 text-amber-500' },
    { value: 'STAFF', label: 'Staff', color: 'bg-blue-500/10 text-blue-500' },
]

const FLAG_MAP: Record<string, string> = {
    HQ: "🇲🇹",
    BG: "🇧🇬",
    GR: "🇬🇷",
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [isPending, startTransition] = useTransition()
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            const [userList, branchList] = await Promise.all([
                getUsers(),
                getBranches()
            ])
            setUsers(userList as User[])
            setBranches(branchList)
        }
        load()
    }, [])

    function handleUpdate(userId: string, role: string, branchId: string) {
        setUpdatingId(userId)
        startTransition(async () => {
            const result = await updateUserRoleAndBranch(userId, role, branchId)
            if (result.success) {
                setUsers(prev => prev.map(u =>
                    u.id === userId
                        ? { ...u, role, branchId, branch: branches.find(b => b.id === branchId) || null }
                        : u
                ))
            }
            setUpdatingId(null)
        })
    }

    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Registered Users ({users.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Branch</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => {
                            const isUpdating = updatingId === user.id
                            return (
                                <TableRow key={user.id} className={isUpdating ? "opacity-50" : ""}>
                                    <TableCell className="font-medium">
                                        {user.name || "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            value={user.role}
                                            disabled={isUpdating}
                                            onChange={(e) => handleUpdate(user.id, e.target.value, user.branchId || '')}
                                            className="w-fit bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {ROLE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            value={user.branchId || ''}
                                            disabled={isUpdating || user.role === 'SUPER_ADMIN'}
                                            onChange={(e) => handleUpdate(user.id, user.role, e.target.value)}
                                            className="w-fit bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                        >
                                            <option value="">— No Branch —</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {FLAG_MAP[b.code] || "🏢"} {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
