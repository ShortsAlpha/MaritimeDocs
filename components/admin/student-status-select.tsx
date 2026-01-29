'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateStudent } from "@/app/actions/students"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type Props = {
    studentId: string
    currentStatus: string
}

export function StudentStatusSelect({ studentId, currentStatus }: Props) {
    const [status, setStatus] = useState(currentStatus)

    // Update local state when prop changes (e.g., after external update)
    useEffect(() => {
        setStatus(currentStatus)
    }, [currentStatus])

    const handleStatusChange = async (value: string) => {
        // Optimistic update
        setStatus(value)

        const formData = new FormData()
        formData.append("status", value)

        const result = await updateStudent(studentId, null, formData)

        if (result.success) {
            toast.success("Status updated")
        } else {
            toast.error(result.message)
            // Revert on error
            setStatus(currentStatus)
        }
    }

    const statusMap: Record<string, { label: string, color: string }> = {
        REGISTERED: { label: "Registered", color: "bg-blue-500" },
        DOCS_REQ_SENT: { label: "Docs Requested", color: "bg-yellow-500" },
        LECTURE_NOTES_SENT: { label: "Notes Sent", color: "bg-indigo-500" },
        PAYMENT_COMPLETED: { label: "Payment Done", color: "bg-green-600" },
        COURSE_ONGOING: { label: "Course Ongoing", color: "bg-sky-500" },
        COURSE_COMPLETED: { label: "Course Completed", color: "bg-purple-500" },
        CERTIFICATE_APPLIED: { label: "Certificate Applied", color: "bg-orange-500" },
        CERTIFICATE_SHIPPED: { label: "Certificate Shipped", color: "bg-emerald-500" }
    };

    return (
        <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[500px]">
                {Object.entries(statusMap).map(([key, info]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${info.color}`} />
                            <span>{info.label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
