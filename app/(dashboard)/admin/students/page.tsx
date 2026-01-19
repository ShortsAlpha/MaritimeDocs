import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreateStudentDialog } from "@/components/admin/create-student-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentFilter } from "@/components/admin/student-filter";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminStudentsPage(props: Props) {
    const searchParams = await props.searchParams;
    const courseFilter = typeof searchParams.course === 'string' ? searchParams.course : undefined;

    // Fetch students with their payments to calculate balance
    const students = await db.student.findMany({
        where: courseFilter ? {
            course: courseFilter
        } : undefined,
        include: {
            payments: true
        },
        orderBy: { createdAt: "desc" },
    });

    const courses = await db.course.findMany({
        orderBy: { title: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Student Management</h1>
                <div className="flex items-center gap-2">
                    <StudentFilter courses={courses} />
                    <CreateStudentDialog courses={courses} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Course Fee</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => {
                                const totalFee = Number(student.totalFee)
                                const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                                const balance = totalFee - totalPaid

                                const statusMap: Record<string, { label: string, color: string }> = {
                                    REGISTERED: { label: "Registered", color: "bg-blue-500" },
                                    ONGOING: { label: "Ongoing", color: "bg-green-500" },
                                    EXAM_PHASE: { label: "In Exam", color: "bg-amber-500" },
                                    DOCS_PENDING: { label: "Docs Pending", color: "bg-red-500" },
                                    GRADUATED: { label: "Graduated", color: "bg-purple-500" },
                                    CANCELLED: { label: "Cancelled", color: "bg-gray-500" }
                                };
                                const statusInfo = statusMap[student.status] || { label: student.status, color: "bg-gray-400" };

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
                                        <TableCell>
                                            <Badge variant="outline">{student.course || 'General'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                                                <span className="text-sm">{statusInfo.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>€{totalFee.toLocaleString()}</TableCell>
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
                                        No students found.
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
