import { getStudentByToken, getPublicDocumentTypesForStudent, uploadPendingDocument } from "@/app/actions/documents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, UploadCloud, XCircle, FileText, ShieldCheck } from "lucide-react";
import { UploadForm } from "./upload-form";

export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const student = await getStudentByToken(token);

    if (!student) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardHeader className="text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-xl">Link Expired or Invalid</CardTitle>
                        <CardDescription>
                            This upload link is invalid or has expired. Please contact the administration.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const docTypes = await getPublicDocumentTypesForStudent(student.id);
    const existingDocs = student.documents;

    // Calculate progress
    const totalDocs = docTypes.length;
    const completedDocs = docTypes.filter(type => {
        const doc = existingDocs.find(d => d.documentTypeId === type.id);
        return doc?.status === 'PENDING' || doc?.status === 'APPROVED';
    }).length;
    const progressPercent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

    return (
        <div className="bg-neutral-950 pb-12">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Welcome, {student.fullName}
                            </h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Please upload the required documents to complete your registration.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 min-w-[180px]">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-neutral-400">Progress</span>
                                    <span className="text-xs font-bold text-white">{completedDocs}/{totalDocs}</span>
                                </div>
                                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${progressPercent}%`,
                                            background: progressPercent === 100
                                                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                        }}
                                    />
                                </div>
                            </div>
                            {progressPercent === 100 && <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docTypes.map((type) => {
                        const uploadedDoc = existingDocs.find(d => d.documentTypeId === type.id);
                        const isComplete = uploadedDoc?.status === 'PENDING' || uploadedDoc?.status === 'APPROVED';

                        return (
                            <div
                                key={type.id}
                                className={`rounded-xl border transition-all duration-200 ${
                                    isComplete
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                                }`}
                            >
                                <div className="p-4 sm:p-5">
                                    {/* Document header */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isComplete ? 'bg-emerald-500/10' : 'bg-neutral-800'
                                            }`}>
                                                {isComplete ? (
                                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                                                ) : (
                                                    <FileText className="w-4.5 h-4.5 text-neutral-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm text-neutral-200 leading-tight truncate">
                                                    {type.title}
                                                </h3>
                                                {type.description && (
                                                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{type.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <div className="shrink-0">
                                            {uploadedDoc ? (
                                                <>
                                                    {uploadedDoc.status === 'APPROVED' && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Received
                                                        </span>
                                                    )}
                                                    {uploadedDoc.status === 'PENDING' && (
                                                        <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                                                            <UploadCloud className="w-3 h-3" />
                                                            In Review
                                                        </span>
                                                    )}
                                                    {uploadedDoc.status === 'REJECTED' && (
                                                        <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                                                            <XCircle className="w-3 h-3" />
                                                            Rejected
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                                    Missing
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Upload form or rejection note */}
                                    {!isComplete && (
                                        <div className={uploadedDoc?.status === 'REJECTED' ? "pt-3 border-t border-neutral-800/50 mt-1" : "mt-1"}>
                                            {uploadedDoc?.status === 'REJECTED' && (
                                                <p className="text-xs text-red-400 mb-2 flex items-center gap-1.5">
                                                    <XCircle className="w-3 h-3 shrink-0" />
                                                    Please upload a new version.
                                                </p>
                                            )}
                                            <UploadForm
                                                token={token}
                                                documentTypeId={type.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer info */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-neutral-600">
                        Maximum file size: 10MB per document &middot; Accepted formats: PDF, JPG, PNG
                    </p>
                </div>
            </div>
        </div>
    );
}
