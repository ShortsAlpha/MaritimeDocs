"use client"

import { Button } from "@/components/ui/button"
import { backfillStudentNumbers } from "@/app/actions/students"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

export function BackfillButton() {
    const [loading, setLoading] = useState(false)

    async function handleBackfill() {
        setLoading(true)
        try {
            const result = await backfillStudentNumbers()
            if (result.success) {
                toast.success(`Backfilled ${result.count} students!`)
            } else {
                toast.error("Failed to backfill numbers")
            }
        } catch (error) {
            toast.error("Error executing backfill")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleBackfill} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generate Missing Numbers
        </Button>
    )
}
