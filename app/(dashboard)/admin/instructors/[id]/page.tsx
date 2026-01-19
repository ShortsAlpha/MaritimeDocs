import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, User, Award, FileText, Briefcase } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DeleteInstructorButton } from "@/components/admin/delete-instructor-button";
import { EditableField } from "@/components/admin/editable-field";
import { InstructorDocsTab } from "@/components/admin/instructor-docs-tab";

// Sub-components being imported (InstructorDocsTab needs to be created, DeleteInstructorButton too)

export default async function InstructorDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const instructor = await db.instructor.findUnique({
        where: { id },
        include: {
            documents: {
                include: { documentType: true }
            }
        }
    });

    const docTypes = await db.documentType.findMany({
        where: { category: "INSTRUCTOR" },
        orderBy: { title: "asc" }
    });

    if (!instructor) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/instructors">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{instructor.fullName}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{instructor.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{instructor.phone || "No phone"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <DeleteInstructorButton instructorId={instructor.id} />
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents (CV & Certs)</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    Profile Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            {/* Note: EditableField needs to support 'instructor' endpoint or be generic. 
                                                Currently it likely points to 'students'. We might need to update EditableField or create EditableInstructorField.
                                                For simplicity, let's assume we update EditableField to accept an 'action' prop or similar, 
                                                OR we assume the user will ask to make it editable later. 
                                                Let's stick to display for now or use a new EditableInstructorField if needed.
                                                actually, let's check EditableField implementation.
                                            */}
                                            <div className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                                                <p className="text-sm font-medium">{instructor.fullName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">Email</span>
                                                <p className="text-sm font-medium">{instructor.email || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Phone className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">Phone</span>
                                                <p className="text-sm font-medium">{instructor.phone || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Award className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">Specialties</span>
                                                <p className="text-sm font-medium">{instructor.specialties || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="space-y-1">
                                                <span className="text-xs font-medium text-muted-foreground">Employment Status</span>
                                                <Badge variant="secondary">
                                                    {instructor.employmentType === 'FULL_TIME' ? 'Full Time' : 'Part Time'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {instructor.bio || "No biography provided."}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        System Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-muted-foreground">Joined</span>
                                        <p>{format(instructor.createdAt, "PPP")}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-muted-foreground">Documents</span>
                                        <p>{instructor.documents.length} Files</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="documents">
                    <InstructorDocsTab instructor={instructor} docTypes={docTypes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
