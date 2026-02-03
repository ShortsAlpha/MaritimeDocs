import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createIntake } from "@/app/actions/intakes"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { DateTimePicker } from "@/components/ui/date-time-picker"

export function CreateIntakeForm() {
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await createIntake(name, startDate?.toISOString());
            if (res.success) {
                toast.success("Intake created!");
                setName("");
                setStartDate(undefined);
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
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold text-lg">Add New Intake</h3>

            <div className="space-y-2">
                <Label htmlFor="intakeName">Intake Name</Label>
                <Input
                    id="intakeName"
                    placeholder="e.g. March 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Start Date</Label>
                <DateTimePicker date={startDate} setDate={setStartDate} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Add Intake
            </Button>
        </form>
    )
}
