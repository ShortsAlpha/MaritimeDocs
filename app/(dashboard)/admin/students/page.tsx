import { db } from "@/lib/db";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function AdminStudentsPage() {
    const students = await db.user.findMany({
        where: { role: "STUDENT" },
        include: {
            documents: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const docTypes = await db.documentType.findMany();
    const requiredCount = docTypes.filter((d: any) => d.isRequired).length;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Student Management</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Students</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student: any) => {
                                const approvedDocs = student.documents.filter((d: any) => d.status === "APPROVED").length;
                                const progress = requiredCount > 0 ? Math.round((approvedDocs / requiredCount) * 100) : 100;

                                return (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name || "N/A"}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{format(new Date(student.createdAt), "PP")}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden max-w-[100px]">
                                                    <div className="bg-primary h-full" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline">View</Badge>
                                            {/* Link to detail page could go here */}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No students registered yet.
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
