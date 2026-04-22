"use client"

import { useState, useEffect, useTransition } from "react"
import { updateUserRoleAndBranch, getUsers, getBranches, deleteUserAction } from "@/app/actions/user-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Shield, Building2, Trash2, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"

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
    { value: 'PENDING', label: 'Pending', color: 'bg-gray-500/10 text-gray-500' },
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
    const [deletingId, setDeletingId] = useState<string | null>(null)

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
                toast.success("User updated successfully")
            } else {
                toast.error("Failed to update user")
            }
            setUpdatingId(null)
        })
    }

    async function handleDelete(userId: string) {
        if (!confirm("Are you sure you want to completely delete this user? This cannot be undone.")) return;
        
        setDeletingId(userId)
        const result = await deleteUserAction(userId)
        if (result.success) {
            setUsers(prev => prev.filter(u => u.id !== userId))
            toast.success("User deleted successfully")
        } else {
            toast.error(result.error || "Failed to delete user")
        }
        setDeletingId(null)
    }

    if (users.length === 0 && !isPending) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                </CardContent>
            </Card>
        )
    }

    const activeUsers = users.filter(u => u.role !== 'PENDING')
    const pendingUsers = users.filter(u => u.role === 'PENDING')

    const UserTable = ({ data, emptyMessage }: { data: User[], emptyMessage: string }) => {
        if (data.length === 0) {
            return (
                <div className="py-8 text-center text-muted-foreground border rounded-lg bg-background">
                    {emptyMessage}
                </div>
            )
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(user => {
                        const isUpdating = updatingId === user.id
                        const isDeleting = deletingId === user.id
                        return (
                            <TableRow key={user.id} className={isUpdating || isDeleting ? "opacity-50" : ""}>
                                <TableCell className="font-medium">
                                    {user.name || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.email}
                                </TableCell>
                                <TableCell>
                                    <select
                                        value={user.role}
                                        disabled={isUpdating || isDeleting}
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
                                        disabled={isUpdating || isDeleting || user.role === 'SUPER_ADMIN'}
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
                                <TableCell>
                                    {user.role !== 'SUPER_ADMIN' && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDelete(user.id)}
                                            disabled={isDeleting || isUpdating}
                                            title="Delete User"
                                        >
                                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        )
    }

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Registered Users ({users.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs defaultValue="active" className="space-y-4">
                    <TabsList className="bg-muted/50 p-1 w-full sm:w-auto grid sm:inline-grid grid-cols-2">
                        <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-background">
                            Active Users <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/10">{activeUsers.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-md data-[state=active]:bg-background">
                            Pending Approvals 
                            {pendingUsers.length > 0 && (
                                <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <UserTable data={activeUsers} emptyMessage="No active users found." />
                        </div>
                    </TabsContent>

                    <TabsContent value="pending" className="mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <UserTable data={pendingUsers} emptyMessage="No pending user approvals." />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
