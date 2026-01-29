"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText, CheckCircle2, ArrowRight, Send } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sendDocumentRequest, sendLectureNotes } from "@/app/actions/student-automation"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Student {
    id: string
    fullName: string
    email: string | null
    status: string
}

interface ActionsSummaryWidgetProps {
    documentsNeeded: Student[]
    notesReady: Student[]
}

export function ActionsSummaryWidget({ documentsNeeded, notesReady }: ActionsSummaryWidgetProps) {
    const router = useRouter()
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        student: Student | null
        action: 'document' | 'notes' | null
    }>({ open: false, student: null, action: null })
    const [loading, setLoading] = useState(false)

    const totalActions = documentsNeeded.length + notesReady.length

    const handleSendEmail = async () => {
        if (!confirmDialog.student || !confirmDialog.action) return

        setLoading(true)
        try {
            let result
            if (confirmDialog.action === 'document') {
                result = await sendDocumentRequest(confirmDialog.student.id)
            } else {
                result = await sendLectureNotes(confirmDialog.student.id)
            }

            if (result.success) {
                toast.success(
                    confirmDialog.action === 'document'
                        ? "Document request sent successfully!"
                        : "Lecture notes sent successfully!"
                )
                router.refresh()
            } else {
                toast.error(result.error || "Failed to send email")
            }
        } catch (error) {
            toast.error("An error occurred while sending email")
        } finally {
            setLoading(false)
            setConfirmDialog({ open: false, student: null, action: null })
        }
    }

    if (totalActions === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending actions</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {documentsNeeded.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Document Requests</span>
                                <Badge variant="outline" className="ml-auto h-5 text-xs">
                                    {documentsNeeded.length}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                {documentsNeeded.slice(0, 3).map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors text-sm group"
                                    >
                                        <Link
                                            href={`/admin/students/${student.id}`}
                                            className="truncate flex-1 hover:underline"
                                        >
                                            {student.fullName}
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2"
                                            onClick={() => setConfirmDialog({
                                                open: true,
                                                student,
                                                action: 'document'
                                            })}
                                            disabled={!student.email}
                                        >
                                            <Send className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {documentsNeeded.length > 3 && (
                                    <p className="text-xs text-muted-foreground px-2 pt-1">
                                        +{documentsNeeded.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {notesReady.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Lecture Notes</span>
                                <Badge variant="outline" className="ml-auto h-5 text-xs">
                                    {notesReady.length}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                {notesReady.slice(0, 3).map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors text-sm group"
                                    >
                                        <Link
                                            href={`/admin/students/${student.id}`}
                                            className="truncate flex-1 hover:underline"
                                        >
                                            {student.fullName}
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2"
                                            onClick={() => setConfirmDialog({
                                                open: true,
                                                student,
                                                action: 'notes'
                                            })}
                                            disabled={!student.email}
                                        >
                                            <Send className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {notesReady.length > 3 && (
                                    <p className="text-xs text-muted-foreground px-2 pt-1">
                                        +{notesReady.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={confirmDialog.open} onOpenChange={(open) =>
                !loading && setConfirmDialog({ open, student: null, action: null })
            }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Email?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.action === 'document'
                                ? `Send document request email to ${confirmDialog.student?.fullName}?`
                                : `Send lecture notes email to ${confirmDialog.student?.fullName}?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendEmail} disabled={loading}>
                            {loading ? "Sending..." : "Send Email"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
