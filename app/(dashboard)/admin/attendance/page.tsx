import { AttendanceMatrix } from "@/components/admin/attendance/attendance-matrix"

export const dynamic = "force-dynamic"

export default function AttendancePage() {
    return (
        <div className="flex-1 space-y-4">
            {/* The main matrix handles its own title / dropdown filtering inside for cleaner prop drilling */}
            <AttendanceMatrix />
        </div>
    )
}
