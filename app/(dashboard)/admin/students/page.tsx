import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreateStudentDialog } from "@/components/admin/create-student-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default async function AdminStudentsPage() {
    // Fetch students with their payments to calculate balance
    const students = await db.student.findMany({
        include: {
            payments: true
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Student Management</h1>
                <CreateStudentDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Course Fee</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => {
                                const totalFee = Number(student.totalFee)
                                const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                                const balance = totalFee - totalPaid

                                return (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{student.fullName}</span>
                                                <span className="text-xs text-muted-foreground">Joined {format(student.createdAt, 'MMM d, yyyy')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{student.email || '-'}</span>
                                                <span className="text-muted-foreground">{student.phone || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>€{totalFee.toLocaleString()}</TableCell>
                                        <TableCell className="text-green-600 font-medium">€{totalPaid.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={balance > 0 ? "destructive" : "secondary"}>
                                                €{balance.toLocaleString()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/students/${student.id}`}>
                                                <Button variant="ghost" size="sm">

                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No students found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
