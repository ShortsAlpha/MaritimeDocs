"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createIntake } from "@/app/actions/intakes"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

export function CreateIntakeForm() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await createIntake(name);
            if (res.success) {
                toast.success("Intake created!");
                setName("");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="flex items-end gap-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex-1 space-y-2">
                <Label htmlFor="intakeName">New Intake Name</Label>
                <Input
                    id="intakeName"
                    placeholder="e.g. March 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Add Intake
            </Button>
        </form>
    )
}
