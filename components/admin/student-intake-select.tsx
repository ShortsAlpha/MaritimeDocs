"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateStudent } from "@/app/actions/students"
import { toast } from "sonner"
import { Intake } from "@prisma/client"

type Props = {
    studentId: string
    currentIntakeId?: string | null
    intakes: Intake[]
}

export function StudentIntakeSelect({ studentId, currentIntakeId, intakes }: Props) {
    const [intakeId, setIntakeId] = useState<string | undefined>(currentIntakeId || undefined)

    useEffect(() => {
        setIntakeId(currentIntakeId || undefined)
    }, [currentIntakeId])

    const handleChange = async (value: string) => {
        const newValue = value === "no_intake" ? "" : value;
        // Optimistic update
        setIntakeId(newValue || undefined)

        const formData = new FormData()
        if (newValue) {
            formData.append("intakeId", newValue)
        } else {
            // We need a way to clear it. updateStudent handles null/undefined if passed explicitly, 
            // but FormData only holds strings. 
            // In updateStudent: `intakeId: formData.get("intakeId") === null ? undefined : formData.get("intakeId")`
            // If we append empty string, it might try to set it to empty string which might fail foreign key IF strictly checked, 
            // but `intakeId` is nullable string. Prisma usually treats empty string as empty string.
            // However, for nullable relation, we usually want NULL. 
            // My `updateStudent` logic: `...(data.intakeId !== undefined && { intakeId: data.intakeId || null }),`
            // If I send empty string, `data.intakeId` is "", so `"" || null` becomes `null`. This logic seems fine.
            formData.append("intakeId", "")
        }

        const result = await updateStudent(studentId, null, formData)

        if (result.success) {
            toast.success("Intake updated")
        } else {
            toast.error(result.message)
            // Revert
            setIntakeId(currentIntakeId || undefined)
        }
    }

    return (
        <Select value={intakeId || "no_intake"} onValueChange={handleChange}>
            <SelectTrigger className="w-auto h-auto p-0 border-0 shadow-none bg-transparent hover:bg-transparent text-sm font-medium focus:ring-0 focus:outline-none data-[placeholder]:text-muted-foreground text-left">
                <SelectValue placeholder="Select intake" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="no_intake" className="text-muted-foreground italic">
                    No Intake Assigned
                </SelectItem>
                {intakes.map((intake) => (
                    <SelectItem key={intake.id} value={intake.id}>
                        {intake.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
