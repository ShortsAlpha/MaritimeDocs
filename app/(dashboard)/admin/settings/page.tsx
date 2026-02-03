import { db } from "@/lib/db";
import { CreateDocTypeForm } from "@/components/admin/create-doc-type-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteDocumentType } from "@/app/actions/document-type";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditDocTypeDialog } from "@/components/admin/edit-doc-type-dialog";

import { CourseSettings } from "@/components/admin/course-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIntakeForm } from "@/components/admin/create-intake-form";
import { DeleteIntakeButton } from "@/components/admin/delete-intake-button";
import { format } from "date-fns";

function DocTypeTable({ types }: { types: any[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {types.map((type: any) => (
                    <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.title}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{type.category}</Badge>
                        </TableCell>
                        <TableCell>
                            {type.isRequired ? (
                                <Badge variant="destructive">Required</Badge>
                            ) : (
                                <Badge variant="secondary">Optional</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <EditDocTypeDialog docType={type} />
                                <form action={deleteDocumentType.bind(null, type.id)}>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {types.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No document types defined.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default async function AdminSettingsPage() {
    const docTypes = await db.documentType.findMany({
        orderBy: { title: 'asc' }
    });

    const courses = await db.course.findMany({
        orderBy: { title: 'asc' }
    });

    const intakes = await db.intake.findMany({
        orderBy: { startDate: 'desc' } // or createdAt desc
    });

    return (
        <div className="space-y-12 pb-12">

            {/* INTAKE MANAGEMENT SECTION */}
            <section>
                <h2 className="text-2xl font-bold tracking-tight">Intake Management</h2>
                <p className="text-muted-foreground mb-6">Manage student intake periods (e.g. March 2025).</p>
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Existing Intakes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    import {format} from "date-fns";

                                    // ... existing imports

                                    // ... existing code

                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {intakes.map((intake) => (
                                            <TableRow key={intake.id}>
                                                <TableCell className="font-medium">{intake.name}</TableCell>
                                                <TableCell>
                                                    {intake.startDate ? format(intake.startDate, "d MMMM yyyy") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DeleteIntakeButton id={intake.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {intakes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No intakes defined.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <CreateIntakeForm />
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold tracking-tight">Document Types</h2>
                <p className="text-muted-foreground mb-6">Manage the specific document requirements and categories for student applications.</p>
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Existing Types</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="student" className="w-full">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="student">Student Documents</TabsTrigger>
                                        <TabsTrigger value="instructor">Instructor Documents</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="student">
                                        <DocTypeTable types={docTypes.filter((t: any) => t.category !== 'INSTRUCTOR')} />
                                    </TabsContent>
                                    <TabsContent value="instructor">
                                        <DocTypeTable types={docTypes.filter((t: any) => t.category === 'INSTRUCTOR')} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <CreateDocTypeForm />
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
                <p className="text-muted-foreground mb-6">Add new courses to the system or modify existing course details.</p>
                <CourseSettings courses={courses} />
            </section>
        </div>
    );
}
