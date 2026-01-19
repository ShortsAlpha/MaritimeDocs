'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateStudent } from "@/app/actions/students"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type Props = {
    studentId: string
    currentStatus: string
}

export function StudentStatusSelect({ studentId, currentStatus }: Props) {
    const handleStatusChange = async (value: string) => {
        const formData = new FormData()
        formData.append("status", value)

        const result = await updateStudent(studentId, null, formData)

        if (result.success) {
            toast.success("Status updated")
        } else {
            toast.error(result.message)
        }
    }

    const statusMap: Record<string, { label: string, color: string }> = {
        REGISTERED: { label: "Registered", color: "bg-blue-500" },
        ONGOING: { label: "Ongoing", color: "bg-green-500" },
        EXAM_PHASE: { label: "In Exam", color: "bg-amber-500" },
        DOCS_PENDING: { label: "Docs Pending", color: "bg-red-500" },
        GRADUATED: { label: "Graduated", color: "bg-purple-500" },
        CANCELLED: { label: "Cancelled", color: "bg-gray-500" }
    };

    return (
        <Select defaultValue={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
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
