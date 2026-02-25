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
import { StudentSearch } from "@/components/admin/student-search";
import { Prisma, StudentStatus } from "@prisma/client";
import { Eye } from "lucide-react";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminStudentsPage(props: Props) {
    const searchParams = await props.searchParams;
    const courseFilter = typeof searchParams.course === 'string' ? searchParams.course : undefined;
    const nationalityFilter = typeof searchParams.nationality === 'string' ? searchParams.nationality : undefined; // Handle nationality filter if it's there

    const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
    const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const intakeFilter = typeof searchParams.intake === 'string' ? searchParams.intake : undefined;

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

    // Search Query
    if (query) {
        where.OR = [
            { fullName: { contains: query, mode: 'insensitive' } },
            { studentNumber: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (courseFilter && courseFilter !== 'all') {
        where.course = courseFilter;
    }
    if (nationalityFilter && nationalityFilter !== 'all') {
        where.nationality = nationalityFilter;
    }
    if (statusFilter && statusFilter !== 'all') {
        where.status = statusFilter as StudentStatus;
    }
    if (intakeFilter && intakeFilter !== 'all') {
        where.intakeId = intakeFilter;
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold">Student Management</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <StudentSearch />
                    <div className="flex items-center gap-2">
                        <StudentFilter courses={courses} nationalities={nationalities} intakes={intakes} />
                        <CreateStudentDialog courses={courses} intakes={intakes} />
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student List</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
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
                                ONGOING: { label: "Ongoing", color: "bg-green-500" },
                                EXAM_PHASE: { label: "In Exam", color: "bg-amber-500" },
                                DOCS_PENDING: { label: "Docs Pending", color: "bg-red-500" },
                                CANCELLED: { label: "Cancelled", color: "bg-gray-500" }
                            };
                            const statusInfo = statusMap[student.status] || { label: student.status, color: "bg-gray-400" };

                            return (
                                <div key={student.id} className="flex flex-col gap-3 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">{student.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{student.course || 'General'}</span>
                                        </div>
                                        <Badge variant={balance > 0 ? "destructive" : "secondary"} className="shrink-0">
                                            €{balance.toLocaleString()}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                                            <span className="text-muted-foreground">{statusInfo.label}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            Joined {format(student.createdAt, 'MMM d, yyyy')}
                                        </span>
                                        <Link href={`/admin/students/${student.id}`}>
                                            <Button variant="outline" size="sm" className="h-8">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                        {students.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No students found.
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto w-full">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>

                                    <TableHead className="hidden xl:table-cell">
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

                                        CANCELLED: { label: "Cancelled", color: "bg-gray-500" }
                                    };
                                    const statusInfo = statusMap[student.status] || { label: student.status, color: "bg-gray-400" };

                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium py-3">
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[140px] lg:max-w-[200px] xl:max-w-none" title={student.fullName}>{student.fullName}</span>
                                                    <span className="text-xs text-muted-foreground">Joined {format(student.createdAt, 'MMM d, yyyy')}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="hidden xl:table-cell">
                                                {student.nationality || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[160px] lg:max-w-[280px] xl:max-w-[400px]" title={student.course || 'General'}>
                                                    <Badge variant="outline" className="font-normal max-w-full">
                                                        <span className="truncate">{student.course || 'General'}</span>
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${statusInfo.color} shrink-0`} />
                                                    <span className="text-sm truncate max-w-[130px] lg:max-w-none" title={statusInfo.label}>{statusInfo.label}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant={balance > 0 ? "destructive" : "secondary"}>
                                                    €{balance.toLocaleString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/students/${student.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
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
                    </div>
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
