import { db } from "@/lib/db";
import { CreateDocTypeForm } from "@/components/admin/create-doc-type-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteDocumentType } from "@/app/actions/document-type";
import { Button } from "@/components/ui/button";
import { Trash2, Users, CalendarDays, FileText, GraduationCap, Settings as SettingsIcon } from "lucide-react";
import { EditDocTypeDialog } from "@/components/admin/edit-doc-type-dialog";

import { CourseSettings } from "@/components/admin/course-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIntakeForm } from "@/components/admin/create-intake-form";
import { DeleteIntakeButton } from "@/components/admin/delete-intake-button";
import { format } from "date-fns";
import { getCurrentUserBranch, shouldFilterByBranch } from "@/lib/branch";
import { UserManagement } from "@/components/admin/user-management";

function DocTypeTable({ types }: { types: any[] }) {
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-muted-foreground">Document Title</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Type</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {types.map((type: any) => (
                        <TableRow key={type.id} className="group hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium text-foreground">{type.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-background">{type.category}</Badge>
                            </TableCell>
                            <TableCell>
                                {type.isRequired ? (
                                    <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-none dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50">Required</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Optional</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditDocTypeDialog docType={type} />
                                    <form action={deleteDocumentType.bind(null, type.id)}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {types.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <FileText className="w-8 h-8 opacity-30" />
                                    <p>No document types found.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default async function AdminSettingsPage() {
    const branch = await getCurrentUserBranch();
    const branchFilter = shouldFilterByBranch(branch) ? { branchId: branch!.branchId } : {};

    const docTypes = await db.documentType.findMany({
        orderBy: { title: 'asc' }
    });

    const courses = await db.course.findMany({
        orderBy: { title: 'asc' }
    });

    const intakes = await db.intake.findMany({
        where: branchFilter,
        orderBy: { startDate: 'desc' }
    });

    const gridColsClass = branch?.role === 'SUPER_ADMIN' ? "md:grid-cols-4" : "md:grid-cols-3";

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-16 space-y-8 animate-in fade-in duration-500">
            
            {/* Page Header */}
            <div className="flex flex-col gap-1.5 border-b border-border/50 pb-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">System Defaults</h1>
                </div>
                <p className="text-muted-foreground ml-[44px]">
                    Configure and align standard protocols for enrollments, documentations, and application architecture.
                </p>
            </div>

            <Tabs defaultValue={branch?.role === 'SUPER_ADMIN' ? "users" : "intakes"} className="space-y-8">
                <TabsList className={`bg-muted/50 p-1.5 rounded-xl grid w-full grid-cols-1 sm:grid-cols-2 ${gridColsClass} h-auto shadow-sm border border-border/60`}>
                    {branch?.role === 'SUPER_ADMIN' && (
                        <TabsTrigger value="users" className="h-11 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium py-2 text-muted-foreground">
                            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> User Management</div>
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="intakes" className="h-11 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium py-2 text-muted-foreground">
                        <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Academic Intakes</div>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="h-11 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium py-2 text-muted-foreground">
                        <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Requirements</div>
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="h-11 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium py-2 text-muted-foreground">
                        <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Course Assets</div>
                    </TabsTrigger>
                </TabsList>

                {/* USER MANAGEMENT */}
                {branch?.role === 'SUPER_ADMIN' && (
                    <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
                        <Card className="border-border shadow-sm overflow-hidden border-0 bg-transparent">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-xl">Authentication & Roles</CardTitle>
                                <CardDescription>Provision branches and manage administrative permissions.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                                    <UserManagement />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* INTAKES */}
                <TabsContent value="intakes" className="focus-visible:outline-none">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Intake Schedules</h2>
                            <p className="text-sm text-muted-foreground mt-1">Define active enrollment periods to categorize incoming batches.</p>
                        </div>
                        
                        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                            {/* Left: Table */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden h-fit">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-semibold text-muted-foreground">Intake Name</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground">Launch Date</TableHead>
                                            <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {intakes.map((intake) => (
                                            <TableRow key={intake.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium text-foreground">{intake.name}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {intake.startDate ? format(intake.startDate, "d MMMM yyyy") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DeleteIntakeButton id={intake.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {intakes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <CalendarDays className="w-8 h-8 opacity-30" />
                                                        <p>No intake periods defined.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Right: Form */}
                            <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-6 h-fit">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="bg-background p-2 border border-border rounded-lg shadow-sm">
                                        <CalendarDays className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Deploy New Intake</h3>
                                </div>
                                <CreateIntakeForm />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* DOCUMENTS */}
                <TabsContent value="documents" className="focus-visible:outline-none">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Document Framework</h2>
                            <p className="text-sm text-muted-foreground mt-1">Standardize required document assets for students and instructors across the system.</p>
                        </div>
                        
                        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                            {/* Left: Table */}
                            <div className="flex flex-col">
                                <Tabs defaultValue="student" className="w-full">
                                    <TabsList className="mb-4 bg-muted/50 p-1 w-full justify-start max-w-sm rounded-[10px]">
                                        <TabsTrigger value="student" className="w-full text-sm rounded-md data-[state=active]:shadow-sm">Student Files</TabsTrigger>
                                        <TabsTrigger value="instructor" className="w-full text-sm rounded-md data-[state=active]:shadow-sm">Instructor Files</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="student" className="mt-0">
                                        <DocTypeTable types={docTypes.filter((t: any) => t.category !== 'INSTRUCTOR')} />
                                    </TabsContent>
                                    <TabsContent value="instructor" className="mt-0">
                                        <DocTypeTable types={docTypes.filter((t: any) => t.category === 'INSTRUCTOR')} />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Right: Form */}
                            <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-6 h-fit mt-12">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="bg-background p-2 border border-border rounded-lg shadow-sm">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Register Document</h3>
                                </div>
                                <CreateDocTypeForm />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* COURSES */}
                <TabsContent value="courses" className="focus-visible:outline-none">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Curriculum Dictionary</h2>
                            <p className="text-sm text-muted-foreground mt-1">Maintain the core registry of courses offered at your organization.</p>
                        </div>
                        
                        {/* the CourseSettings component already handles form structure, we let it span naturally */}
                        <div className="w-full bg-card rounded-2xl border border-border shadow-sm p-2 sm:p-6">
                            <CourseSettings courses={courses} allDocTypes={docTypes} />
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
