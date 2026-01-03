import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Wallet, User, Calendar, FileText, CreditCard, Hash, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DeleteStudentButton } from "@/components/admin/delete-student-button";

// Sub-components will be imported from separate files in next steps
// Placeholder imports for now, we will create these files next
import { StudentDocsTab } from "@/components/admin/student-docs-tab";
import { StudentAccountingTab } from "@/components/admin/student-accounting-tab";

export default async function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    console.log("Student ID page loading:", id);
    if (!id) {
        console.error("ID is missing!");
        return notFound();
    }
    const student = await db.student.findUnique({
        where: { id },
        include: {
            documents: { include: { documentType: true } },
            payments: { orderBy: { date: "desc" } }
        }
    });

    if (!student) notFound();

    const studentData = {
        ...student,
        totalFee: student.totalFee.toNumber(),
        payments: student.payments.map(p => ({
            ...p,
            amount: p.amount.toNumber()
        }))
    };

    const docTypes = await db.documentType.findMany();

    // Financial Calcs
    const totalFee = Number(student.totalFee);
    const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = totalFee - totalPaid;

    // ... (other imports)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/students">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{student.fullName}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{student.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{student.phone || "No phone"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <DeleteStudentButton studentId={student.id} />
                    <div className="flex flex-col items-end">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${balance > 0 ? "text-red-500" : "text-green-500"}`}>
                                €{balance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="accounting">Accounting</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                            <p className="text-sm font-semibold">{student.fullName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Mail className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                            <p className="text-sm text-blue-600 hover:underline">
                                                <a href={`mailto:${student.email}`}>{student.email || "N/A"}</a>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Phone className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                            <p className="text-sm">{student.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                            <MapPin className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                                            <p className="text-sm text-balance max-w-xs">{student.address || "No address provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            {/* Financial Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Wallet className="h-5 w-5 text-muted-foreground" />
                                        Financial Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1 p-3 border rounded-lg bg-muted/20">
                                            <span className="text-xs text-muted-foreground">Total Fee</span>
                                            <span className="text-lg font-bold">€{totalFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3 border rounded-lg bg-green-500/10 border-green-200 dark:border-green-900">
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Paid Amount</span>
                                            <span className="text-lg font-bold text-green-700 dark:text-green-400">€{totalPaid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3 border rounded-lg col-span-2 bg-red-500/10 border-red-200 dark:border-red-900">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Remaining Balance</span>
                                                <CreditCard className="h-4 w-4 text-red-500" />
                                            </div>
                                            <span className="text-2xl font-bold text-red-700 dark:text-red-400">€{balance.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* System Metadata */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                        System Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Registration
                                        </span>
                                        <p>{format(student.createdAt, "PPP")}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Last Active
                                        </span>
                                        <p>{format(student.updatedAt, "PPP")}</p>
                                    </div>
                                    <div className="space-y-0.5 col-span-2">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> Documents
                                        </span>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="secondary">{student.documents.length} Files</Badge>
                                            <Badge variant="outline">{student.payments.length} Transactions</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="documents">
                    <StudentDocsTab student={studentData} docTypes={docTypes} />
                </TabsContent>

                <TabsContent value="accounting">
                    <StudentAccountingTab student={studentData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
