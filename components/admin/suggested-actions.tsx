"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { sendDocumentRequest, sendLectureNotes, checkDocumentCompleteness } from "@/app/actions/student-automation"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Student {
    id: string
    fullName: string
    email: string | null
    status: string
}

interface SuggestedActionsProps {
    student: Student
    hasDocuments?: boolean
}

export function SuggestedActions({ student, hasDocuments = false }: SuggestedActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [docsComplete, setDocsComplete] = useState<boolean | null>(null)

    // Check if we should show document request suggestion
    const showDocumentRequest = student.status === "REGISTERED"

    // Check if we should show lecture notes suggestion (async check)
    const showLectureNotes = student.status === "DOCS_REQ_SENT" || student.status === "PAYMENT_COMPLETED"

    // On mount, check if documents are complete
    useEffect(() => {
        if (showLectureNotes) {
            checkDocumentCompleteness(student.id).then(result => {
                if (result.success) {
                    setDocsComplete(result.allComplete || false)
                }
            })
        }
    }, [student.id, showLectureNotes])

    async function handleSendDocumentRequest() {
        setLoading("docs")
        const result = await sendDocumentRequest(student.id)

        if (result.success) {
            toast.success("Document request sent successfully!")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to send document request")
        }

        setLoading(null)
    }

    async function handleSendLectureNotes() {
        setLoading("notes")
        const result = await sendLectureNotes(student.id)

        if (result.success) {
            toast.success("Lecture notes sent successfully!")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to send lecture notes")
        }

        setLoading(null)
    }

    // Don't show card if there are no suggestions
    if (!showDocumentRequest && !(showLectureNotes && docsComplete)) {
        return null
    }

    return (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Suggested Actions</CardTitle>
                        <CardDescription className="text-sm">
                            Recommended next steps for this student
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {showDocumentRequest && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">Request Documents</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                Student is newly registered. Send an email requesting required documents.
                            </p>
                            <Button
                                size="sm"
                                onClick={handleSendDocumentRequest}
                                disabled={loading !== null || !student.email}
                                className="h-8"
                            >
                                {loading === "docs" ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-3 w-3 mr-2" />
                                        Send Document Request
                                    </>
                                )}
                            </Button>
                            {!student.email && (
                                <p className="text-xs text-destructive mt-2">No email address available</p>
                            )}
                        </div>
                    </div>
                )}

                {showLectureNotes && docsComplete && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">Send Lecture Notes</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                All required documents have been uploaded and approved. Ready to send course materials.
                            </p>
                            <Button
                                size="sm"
                                onClick={handleSendLectureNotes}
                                disabled={loading !== null || !student.email}
                                className="h-8"
                                variant="default"
                            >
                                {loading === "notes" ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-3 w-3 mr-2" />
                                        Send Lecture Notes
                                    </>
                                )}
                            </Button>
                            {!student.email && (
                                <p className="text-xs text-destructive mt-2">No email address available</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
