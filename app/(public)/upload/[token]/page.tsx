import { getStudentByToken, getPublicDocumentTypes, uploadPendingDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
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

    const docTypes = await getPublicDocumentTypes();
    const existingDocs = student.documents;

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {student.fullName}</h1>
                    <p className="text-neutral-400">Please upload the required documents to complete your registration.</p>
                </div>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-white">Required Documents</CardTitle>
                        <CardDescription>
                            Upload clear copies of the following documents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {docTypes.map((type) => {
                            const uploadedDoc = existingDocs.find(d => d.documentTypeId === type.id);
                            // Consider it "complete" only if it's PENDING or APPROVED.
                            // If REJECTED, we want to show the form again.
                            const isComplete = uploadedDoc?.status === 'PENDING' || uploadedDoc?.status === 'APPROVED';

                            return (
                                <div key={type.id} className="p-4 rounded-lg border border-neutral-800 bg-neutral-950/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-neutral-200 flex items-center gap-2">
                                                {type.title}
                                                {type.isRequired && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">Required</span>}
                                            </h3>
                                            {type.description && <p className="text-sm text-neutral-500 mt-1">{type.description}</p>}
                                        </div>
                                        {uploadedDoc ? (
                                            <>
                                                {uploadedDoc.status === 'APPROVED' && (
                                                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-sm font-medium">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Received</span>
                                                    </div>
                                                )}
                                                {uploadedDoc.status === 'PENDING' && (
                                                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm font-medium">
                                                        <UploadCloud className="w-4 h-4" />
                                                        <span>In Review</span>
                                                    </div>
                                                )}
                                                {uploadedDoc.status === 'REJECTED' && (
                                                    <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-sm font-medium">
                                                        <XCircle className="w-4 h-4" />
                                                        <span>Rejected</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-neutral-500 bg-neutral-800 px-3 py-1 rounded-full text-sm font-medium">
                                                <div className="w-2 h-2 rounded-full bg-neutral-500" />
                                                Missing
                                            </div>
                                        )}
                                    </div>

                                    {/* Show form if no doc uploaded OR if it was rejected */}
                                    {!isComplete && (
                                        <div className={uploadedDoc?.status === 'REJECTED' ? "pt-2 border-t border-neutral-800 mt-2" : ""}>
                                            {uploadedDoc?.status === 'REJECTED' && (
                                                <p className="text-sm text-red-400 mb-4 flex items-center gap-2">
                                                    <XCircle className="w-4 h-4" />
                                                    Please upload a new version of this document.
                                                </p>
                                            )}
                                            <UploadForm
                                                token={token}
                                                documentTypeId={type.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
