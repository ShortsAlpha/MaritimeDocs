"use client"

import { Button } from "@/components/ui/button"
import { deleteIntake } from "@/app/actions/intakes"
import { Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteIntakeButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    async function onDelete() {
        if (!confirm("Are you sure? This will fail if students are assigned to this intake.")) return;

        setLoading(true);
        try {
            const res = await deleteIntake(id);
            if (res.success) {
                toast.success("Intake deleted");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Error deleting intake");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={onDelete} disabled={loading} className="text-red-500 hover:text-red-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
