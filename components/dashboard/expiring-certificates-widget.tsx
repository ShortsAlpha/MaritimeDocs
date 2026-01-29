import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calendar } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
interface ExpiringStudent {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    certificateExpiryDate: Date | null | string; // Allow string in case of serialization issues, though DB returns Date
}

interface ExpiringCertificatesWidgetProps {
    students: ExpiringStudent[];
}

export function ExpiringCertificatesWidget({ students }: ExpiringCertificatesWidgetProps) {
    return (
        <Card className="col-span-1">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Expiring Certificates (30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No certificates expiring soon.</p>
                    ) : (
                        students.map((student) => {
                            const expiryDate = student.certificateExpiryDate ? new Date(student.certificateExpiryDate) : null;
                            const daysLeft = expiryDate
                                ? differenceInDays(expiryDate, new Date())
                                : 0;

                            return (
                                <Link
                                    key={student.id}
                                    href={`/admin/students/${student.id}`}
                                    className="flex flex-col gap-2 border-b last:border-0 pb-3 last:pb-0 hover:bg-muted/50 p-2 rounded transition-colors -mx-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium leading-none">{student.fullName}</p>
                                        <Badge variant={daysLeft < 7 ? "destructive" : "secondary"} className="ml-2">
                                            {daysLeft} days
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                Expires: {expiryDate ? format(expiryDate, "MMM d, yyyy") : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    {(student.email || student.phone) && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {student.email} {student.phone && `• ${student.phone}`}
                                        </div>
                                    )}
                                </Link>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
