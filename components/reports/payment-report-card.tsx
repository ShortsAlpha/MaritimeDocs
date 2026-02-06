"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Download, Loader2, X } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { exportPaymentReportExcel } from "@/app/actions/reports"

export function PaymentReportCard() {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    const handleDownload = async () => {
        try {
            setLoading(true)

            const base64 = await exportPaymentReportExcel({
                from: date.from,
                to: date.to
            })

            // Download Trigger
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
            const dateStr = date.from ? `${format(date.from, 'yyyyMMdd')}` : 'All';
            link.download = `Payment_Ledger_${dateStr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Payment report exported successfully!")

        } catch (error) {
            console.error(error)
            toast.error("Failed to export payment report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Payment Ledger</CardTitle>
                <CardDescription>
                    Export specific payment transactions within a date range.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 flex flex-col">
                    <div className="flex justify-between items-center">
                        <Label>Transaction Period</Label>
                        {date.from && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-muted-foreground hover:text-foreground text-xs"
                                onClick={() => setDate({ from: undefined, to: undefined })}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal relative pr-10",
                                    !date.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>All Time (No Filter)</span>
                                )}

                                {date.from && (
                                    <div
                                        className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center hover:bg-muted rounded-r-md transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDate({ from: undefined, to: undefined });
                                        }}
                                        title="Clear Date Filter"
                                    >
                                        <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                                    </div>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-2 grid grid-cols-2 gap-2 border-b bg-muted/30">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => setDate({ from: startOfMonth(new Date()), to: new Date() })}
                                >
                                    This Month
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => setDate({ from: subMonths(startOfMonth(new Date()), 1), to: subMonths(endOfMonth(new Date()), 1) })}
                                >
                                    Last Month
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => setDate({ from: startOfYear(new Date()), to: new Date() })}
                                >
                                    This Year
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => setDate({ from: undefined, to: undefined })}
                                >
                                    All Time
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date.from}
                                selected={date as any}
                                onSelect={setDate as any}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download Payment Ledger
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
