import { PaginationControls } from "@/components/ui/pagination-controls";
import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreateStudentDialog } from "@/components/admin/create-student-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentFilter } from "@/components/admin/student-filter";
import { SortableHeader } from "@/components/admin/sortable-header";
import { Prisma } from "@prisma/client";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminStudentsPage(props: Props) {
    const searchParams = await props.searchParams;
    const courseFilter = typeof searchParams.course === 'string' ? searchParams.course : undefined;
    const nationalityFilter = typeof searchParams.nationality === 'string' ? searchParams.nationality : undefined; // Handle nationality filter if it's there

    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
    const order = typeof searchParams.order === 'string' && searchParams.order === 'desc' ? 'desc' : 'asc';

    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
    const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize) : 10;
    const skip = (page - 1) * pageSize;

    // Build orderBy
    let orderBy: Prisma.StudentOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'country') {
        orderBy = { nationality: order };
    } else if (sort === 'course') {
        orderBy = { course: order };
    } else if (sort === 'status') {
        orderBy = { status: order };
    }

    // Build where
    const where: Prisma.StudentWhereInput = {};
    if (courseFilter && courseFilter !== 'all') {
        where.course = courseFilter;
    }
    if (nationalityFilter && nationalityFilter !== 'all') {
        where.nationality = nationalityFilter;
    }

    // Fetch students with their payments to calculate balance
    // Fetch students with their payments to calculate balance
    const [students, totalCount] = await Promise.all([
        db.student.findMany({
            where,
            include: {
                payments: true
            },
            orderBy,
            skip,
            take: pageSize
        }),
        db.student.count({ where })
    ]);

    const courses = await db.course.findMany({
        orderBy: { title: 'asc' }
    });

    const intakes = await db.intake.findMany({
        orderBy: { startDate: 'desc' }
    });

    const nationalities = await db.student.groupBy({
        by: ['nationality'],
        where: {
            nationality: { not: null }
        },
        orderBy: { nationality: 'asc' }
    }).then(groups => groups.map(g => g.nationality).filter(Boolean) as string[]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Student Management</h1>
                <div className="flex items-center gap-2">
                    <StudentFilter courses={courses} nationalities={nationalities} />
                    <CreateStudentDialog courses={courses} intakes={intakes} />
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
                                <TableHead>
                                    <SortableHeader
                                        column="country"
                                        currentSort={sort}
                                        currentOrder={order}
                                        label="Country"
                                        searchParams={searchParams}
                                    />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader
                                        column="course"
                                        currentSort={sort}
                                        currentOrder={order}
                                        label="Course Name"
                                        searchParams={searchParams}
                                    />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader
                                        column="status"
                                        currentSort={sort}
                                        currentOrder={order}
                                        label="Status"
                                        searchParams={searchParams}
                                    />
                                </TableHead>
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
                                    DOCS_REQ_SENT: { label: "Documents Request Sent", color: "bg-orange-500" },
                                    LECTURE_NOTES_SENT: { label: "Lecture Notes Sent", color: "bg-amber-500" },
                                    PAYMENT_COMPLETED: { label: "Payment Completed", color: "bg-green-600" },
                                    COURSE_ONGOING: { label: "Course Ongoing", color: "bg-green-500" },
                                    COURSE_COMPLETED: { label: "Course Completed", color: "bg-purple-500" },
                                    CERTIFICATE_APPLIED: { label: "Certificate Applied", color: "bg-indigo-500" },
                                    CERTIFICATE_SHIPPED: { label: "Certificate Shipped", color: "bg-pink-500" },
                                    // Legacy or fallback
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
                                            {student.nationality || '-'}
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
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PaginationControls
                totalCount={totalCount}
                pageSize={pageSize}
                currentPage={page}
            />
        </div>
    );
}
