import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateInstructorDialog } from "@/components/admin/create-instructor-dialog";
import { User, Mail, Phone, Award } from "lucide-react";

export default async function AdminInstructorsPage() {
    const instructors = await db.instructor.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Instructor Management</h1>
                <CreateInstructorDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Instructor List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Employment</TableHead>
                                <TableHead>Specialties</TableHead>
                                <TableHead>Bio</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {instructors.map((instructor) => (
                                <TableRow key={instructor.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{instructor.fullName}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-6">Joined {format(instructor.createdAt, 'MMM d, yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm gap-1">
                                            {instructor.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    <span>{instructor.email}</span>
                                                </div>
                                            )}
                                            {instructor.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">{instructor.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={instructor.employmentType === 'FULL_TIME' ? 'default' : 'secondary'}>
                                            {instructor.employmentType === 'FULL_TIME' ? 'Full Time' : 'Part Time'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {instructor.specialties ? instructor.specialties.split(',').map((spec, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{spec.trim()}</Badge>
                                            )) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={instructor.bio || ''}>
                                            {instructor.bio || '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/instructors/${instructor.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {instructors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No instructors found.
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
