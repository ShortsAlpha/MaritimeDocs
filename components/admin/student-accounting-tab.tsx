'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { addPayment, updateStudentFee, updatePaymentAmount, updatePaymentDate, deletePayment } from "@/app/actions/accounting";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X, Edit2, CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function EditablePaymentDate({ paymentId, initialDate, forceEdit }: { paymentId: string, initialDate: string | Date, forceEdit: boolean }) {
    const router = useRouter();
    const [date, setDate] = useState<Date>(new Date(initialDate));
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        setDate(new Date(initialDate));
        setHasChanged(false);
    }, [initialDate]);

    useEffect(() => {
        if (!forceEdit && hasChanged) {
            handleSave();
        }
    }, [forceEdit]);

    const isEffectiveEditing = isEditing || forceEdit;

    async function handleSave() {
        if (!hasChanged) return;

        setLoading(true);
        const res = await updatePaymentDate(paymentId, date);
        if (res.success) {
            toast.success("Date saved");
            setIsEditing(false);
            setHasChanged(false);
        } else {
            toast.error("Failed to update date");
            setDate(new Date(initialDate));
        }
        setLoading(false);
    }

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate);
            setHasChanged(true);
        }
    }

    if (isEffectiveEditing) {
        return (
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "h-8 w-36 justify-start text-left font-normal px-2 text-xs",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {date ? format(date, "MMM d, yyyy") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    return (
        <span className="font-medium">{format(new Date(date), "MMM d, yyyy")}</span>
    )
}

function EditablePaymentAmount({ paymentId, initialAmount, forceEdit }: { paymentId: string, initialAmount: number, forceEdit: boolean }) {
    const router = useRouter();
    const [amount, setAmount] = useState(initialAmount.toString());
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);

    // Sync state with prop when it changes
    useEffect(() => {
        // If we are getting new data from server, sync it
        setAmount(initialAmount.toString());
        setHasChanged(false);
    }, [initialAmount]);

    // Save on Done (forceEdit toggles from true to false)
    useEffect(() => {
        if (!forceEdit && hasChanged) {
            handleSave();
        }
    }, [forceEdit]);

    // Sync with forceEdit
    const isEffectiveEditing = isEditing || forceEdit;

    async function handleSave() {
        // Prevent double save or save if no change
        if (!hasChanged && amount === initialAmount.toString()) return;

        setLoading(true);
        const numericAmount = parseFloat(amount.replace(/,/, '.')); // Handle comma decimals if any

        if (isNaN(numericAmount)) {
            toast.error("Invalid amount");
            setLoading(false);
            return;
        }

        const res = await updatePaymentAmount(paymentId, numericAmount);
        if (res.success) {
            toast.success("Payment saved automatically");
            setIsEditing(false);
            setHasChanged(false);
        } else {
            toast.error("Failed to update");
            setAmount(initialAmount.toString());
        }
        setLoading(false);
    }

    const handleChange = (val: string) => {
        setAmount(val);
        setHasChanged(true);
    };

    if (isEffectiveEditing) {
        return (
            <div className="flex items-center justify-end gap-2">
                <Input
                    type="number"
                    step="0.01"
                    className="h-8 w-24 text-right"
                    value={amount}
                    onChange={(e) => handleChange(e.target.value)}
                />
                {!forceEdit && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                )}
                {!forceEdit && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => { setIsEditing(false); setAmount(initialAmount.toString()); }}>
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        )
    }

    // Displays the optimistically updated local value so the UI feels instant
    return (
        <div className="flex items-center justify-end gap-2 group">
            <span className="font-medium">€{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
    )
}


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function AddPaymentDialog({ studentId }: { studentId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>(new Date());

    useEffect(() => {
        if (open) setDate(new Date());
    }, [open]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        await addPayment(
            studentId,
            Number(formData.get("amount")),
            formData.get("method") as any,
            formData.get("note") as string,
            date
        );

        setLoading(false);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Amount (€)</Label>
                        <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                    </div>
                    <div className="space-y-2 flex flex-col">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select name="method" required defaultValue="CASH">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Note / Installment</Label>
                        <Input name="note" placeholder="e.g. Installment 1" />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Payment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function TotalFeeEditor({ studentId, initialFee }: { studentId: string, initialFee: number }) {
    const [fee, setFee] = useState(initialFee);
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        await updateStudentFee(studentId, fee);
        setLoading(false);
    }

    return (
        <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-2 flex-1">
                <Label>Total Course Fee (€)</Label>
                <Input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                />
            </div>
            <Button onClick={handleSave} disabled={loading || fee === initialFee}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
        </div>
    )
}

export function StudentAccountingTab({ student }: { student: any }) {
    const router = useRouter();
    const totalFee = Number(student.totalFee);
    const totalPaid = student.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const balance = totalFee - totalPaid;

    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleDeletePayment(paymentId: string) {
        if (!confirm("Are you sure you want to delete this payment?")) return;
        setDeletingId(paymentId);
        const res = await deletePayment(paymentId);
        if (res.success) {
            toast.success("Payment deleted successfully");
            router.refresh();
        } else {
            toast.error(res.message);
        }
        setDeletingId(null);
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Transaction History</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isGlobalEditing ? "secondary" : "outline"}
                                onClick={() => setIsGlobalEditing(!isGlobalEditing)}
                            >
                                {isGlobalEditing ? (
                                    <>
                                        <X className="mr-2 h-4 w-4" />
                                        Done
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Edit
                                    </>
                                )}
                            </Button>
                            <AddPaymentDialog studentId={student.id} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Note</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    {isGlobalEditing && <TableHead className="w-[50px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {student.payments.map((payment: any) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <EditablePaymentDate
                                                paymentId={payment.id}
                                                initialDate={payment.date}
                                                forceEdit={isGlobalEditing}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{payment.method.replace("_", " ")}</Badge>
                                        </TableCell>
                                        <TableCell>{payment.note}</TableCell>
                                        <TableCell className="text-right">
                                            <EditablePaymentAmount
                                                paymentId={payment.id}
                                                initialAmount={Number(payment.amount)}
                                                forceEdit={isGlobalEditing}
                                            />
                                        </TableCell>
                                        {isGlobalEditing && (
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeletePayment(payment.id)}
                                                    disabled={deletingId === payment.id}
                                                >
                                                    {deletingId === payment.id ?  <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {student.payments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No payments recorded.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TotalFeeEditor studentId={student.id} initialFee={totalFee} />

                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Fee</span>
                                <span>€{totalFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Paid</span>
                                <span className="text-green-600 font-medium">- €{totalPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                                <span>Balance Due</span>
                                <span className={balance > 0 ? "text-red-500" : "text-green-500"}>
                                    €{balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


