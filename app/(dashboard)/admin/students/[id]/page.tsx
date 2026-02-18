import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Wallet, User, Calendar, FileText, CreditCard, Hash, Clock, ShieldCheck, Globe, CalendarDays } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DeleteStudentButton } from "@/components/admin/delete-student-button";
import { EditableField } from "@/components/admin/editable-field";
import { StudentStatusSelect } from "@/components/admin/student-status-select";


// Sub-components will be imported from separate files in next steps
// Placeholder imports for now, we will create these files next
import { StudentDocsTab } from "@/components/admin/student-docs-tab";
import { StudentAccountingTab } from "@/components/admin/student-accounting-tab";
import { SendWelcomeEmailButton } from "@/components/admin/send-welcome-button";
import { SendExamNotesDialog } from "@/components/admin/send-exam-notes-dialog";
import { SendFeedbackEmailButton } from "@/components/admin/send-feedback-email-button";
import { StudentPhotoUpload } from "@/components/admin/student-photo-upload";
import { getSignedProfilePhotoUrl } from "@/app/actions/students";

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
            payments: { orderBy: { date: "desc" } },
            feedbacks: { orderBy: { createdAt: "desc" } },
            intake: true
        }
    });

    if (!student) notFound();

    // Generate Signed URL
    const signedPhotoUrl = await getSignedProfilePhotoUrl(student.photoUrl);

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

    const courses = await db.course.findMany({ orderBy: { title: 'asc' } });

    return (
        <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 max-w-full xl:items-start transition-all">
                {/* Left Section: Back, Photo, Name */}
                <div className="flex items-start gap-4 flex-1 w-full">
                    <Link href="/admin/students">
                        <Button variant="outline" size="icon" className="shrink-0 mt-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <StudentPhotoUpload
                        studentId={student.id}
                        photoUrl={signedPhotoUrl}
                        fullName={student.fullName}
                        className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 shadow-lg rounded-full"
                    />

                    <div className="min-w-0 flex-1 pt-1">
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate break-words mb-2">{student.fullName}</h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-sm truncate">{student.email || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-sm truncate">{student.phone || "No phone"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Actions & Status */}
                {/* Right Section: Actions & Status */}
                <div className="flex flex-col gap-3 md:gap-4 w-full xl:w-auto">
                    {/* Row 1: Status & Balance */}
                    <div className="flex items-end justify-between gap-2 md:gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pl-1">
                                Status
                            </span>
                            <StudentStatusSelect
                                studentId={student.id}
                                currentStatus={student.status}
                                balance={balance}
                            />
                        </div>
                        <div className="flex flex-col items-end gap-0.5 pb-0.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</span>
                            <span className={`text-2xl font-bold tracking-tight ${balance > 0 ? "text-red-500" : "text-green-500"}`}>
                                €{balance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Quick Actions (Responsive Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <SendWelcomeEmailButton studentId={student.id} />
                        <SendExamNotesDialog
                            studentId={student.id}
                            courseName={student.course || ""}
                            courses={courses}
                        />
                        <SendFeedbackEmailButton studentId={student.id} />
                        <DeleteStudentButton studentId={student.id} />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4 w-full">
                <TabsList className="flex w-full justify-start overflow-x-auto flex-nowrap">
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
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Hash className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground">Student Number</span>
                                                <span className="text-sm font-medium">{student.studentNumber || "Not Assigned"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Calendar className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground">Intake Period</span>
                                                <span className="text-sm font-medium">{student.intake?.name || "No Intake Assigned"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Full Name"
                                                name="fullName"
                                                value={student.fullName}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Email Address"
                                                name="email"
                                                value={student.email}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Phone className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Phone Number"
                                                name="phone"
                                                value={student.phone}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <MapPin className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Address"
                                                name="address"
                                                value={student.address}
                                                isMultiline
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Certificate Issue Date"
                                                name="certificateIssueDate"
                                                type="date"
                                                value={student.certificateIssueDate ? format(student.certificateIssueDate, "yyyy-MM-dd") : ""}
                                                displayValue={student.certificateIssueDate ? format(student.certificateIssueDate, "PPP") : null}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Certificate Expiry Date"
                                                name="certificateExpiryDate"
                                                type="date"
                                                value={student.certificateExpiryDate ? format(student.certificateExpiryDate, "yyyy-MM-dd") : ""}
                                                displayValue={student.certificateExpiryDate ? format(student.certificateExpiryDate, "PPP") : null}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Globe className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Nationality"
                                                name="nationality"
                                                value={student.nationality}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <CalendarDays className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                studentId={student.id}
                                                label="Date of Birth"
                                                name="dateOfBirth"
                                                type="date"
                                                value={student.dateOfBirth ? format(student.dateOfBirth, "yyyy-MM-dd") : ""}
                                                displayValue={student.dateOfBirth ? `${differenceInYears(new Date(), student.dateOfBirth)} Years Old (${format(student.dateOfBirth, "PPP")})` : null}
                                                noTruncate
                                            />
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

                            {/* Student Feedback */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Student Feedback
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {student.feedbacks.length > 0 ? (
                                        <div className="space-y-4">
                                            {student.feedbacks.map((fb: any, i: any) => (
                                                <div key={i} className="border rounded-lg p-4 space-y-3 bg-card">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${fb.recommend === 'YES' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                fb.recommend === 'NO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                }`}>
                                                                {fb.recommend === 'YES' ? 'Recommended' : fb.recommend === 'NO' ? 'Not Recommended' : 'Maybe'}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{format(fb.createdAt, "PPP")}</span>
                                                        </div>
                                                        {fb.source && <span className="text-xs border px-1.5 py-0.5 rounded text-muted-foreground">
                                                            {fb.source.replace(/_/g, " ").split(' ').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                                        </span>}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                        {[
                                                            { label: "Registration", val: fb.registrationProcess },
                                                            { label: "Practical/Sim", val: fb.practicalStandards },
                                                            { label: "Materials", val: fb.courseMaterials },
                                                            { label: "Course Content", val: fb.courseContent },
                                                            { label: "Instructor", val: fb.instructorEffectiveness },
                                                            { label: "Staff", val: fb.staffFriendliness },
                                                            { label: "Learning", val: fb.learningEffectiveness },
                                                            { label: "Overall", val: fb.overallImpression }
                                                        ].map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-muted-foreground">{item.label}</span>
                                                                <div className="flex gap-0.5">
                                                                    {Array.from({ length: 5 }).map((_, s) => (
                                                                        <div key={s} className={`h-1.5 w-1.5 rounded-full ${s < (item.val || 0) ? 'bg-primary' : 'bg-muted'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {fb.comment && (
                                                        <div className="bg-muted/30 p-3 rounded-md text-sm italic text-muted-foreground relative">
                                                            <span className="absolute top-1 left-2 text-2xl opacity-20">"</span>
                                                            <p className="px-2">{fb.comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="bg-muted rounded-full p-3">
                                                <FileText className="h-6 w-6 opacity-50" />
                                            </div>
                                            <span className="text-sm">No feedback received yet.</span>
                                        </div>
                                    )}
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
