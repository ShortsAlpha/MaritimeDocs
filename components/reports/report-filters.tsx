"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateStudentReport, ReportFilters } from "@/app/actions/reports"

import { saveAs } from 'file-saver'
import { toast } from "sonner"

interface Props {
    courses: { id: string, title: string }[]
    intakes: { id: string, name: string }[]
    nationalities: string[]
}

const STUDENT_STATUSES = [
    "REGISTERED",
    "DOCS_REQ_SENT",
    "LECTURE_NOTES_SENT",
    "PAYMENT_COMPLETED",
    "COURSE_ONGOING",
    "COURSE_COMPLETED",
    "CERTIFICATE_APPLIED",
    "CERTIFICATE_SHIPPED",
    "CANCELLED"
]

export function ReportFilters({ courses, intakes, nationalities }: Props) {
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState<ReportFilters>({
        course: [],
        status: [],
        intakeId: "all",
        nationality: "all",
        paymentStatus: 'all' as any
    })

    const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    const handleDownload = async () => {
        try {
            setLoading(true)
            const finalFilters = {
                ...filters,
                dateRange: {
                    from: date.from,
                    to: date.to
                }
            }

            const data = await generateStudentReport(finalFilters)

            if (data.length === 0) {
                toast.warning("No data found with the selected filters.")
                return
            }

            // Dynamic import for ExcelJS to avoid server-side issues
            const ExcelJS = (await import('exceljs')).default
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Students')

            // 1. Define Columns
            if (data.length > 0) {
                const columns = Object.keys(data[0]).map(key => ({
                    header: key,
                    key: key,
                    width: Math.max(key.length + 5, 20) // Min width 20
                }))
                worksheet.columns = columns
            }

            // 2. Add Rows
            worksheet.addRows(data)

            // 3. Style Header Row
            const headerRow = worksheet.getRow(1)
            headerRow.height = 30
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' } // Slate-800
            }
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

            // 4. Style Data Rows (Zebra Striping + Borders)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    // Alternating Row Color
                    if (rowNumber % 2 === 0) {
                        row.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF1F5F9' } // Slate-100
                        }
                    }
                }

                // Borders for all cells
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                    }
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
                })
            })

            // 5. Write Buffer
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `Student_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`)

            toast.success(`Exported ${data.length} records successfully!`)

        } catch (error) {
            console.error(error)
            toast.error("Failed to generate report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Course Filter */}
                    <div className="space-y-2">
                        <Label>Course</Label>
                        <Select
                            value={filters.course?.[0] || "all"}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, course: val === "all" ? [] : [val] }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map(c => (
                                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status?.[0] || "all"}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, status: val === "all" ? [] : [val] }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {STUDENT_STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nationality Filter */}
                    <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Select
                            value={filters.nationality || "all"}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, nationality: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Nationalities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Nationalities</SelectItem>
                                {nationalities.map(n => (
                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Intake Filter */}
                    <div className="space-y-2">
                        <Label>Intake</Label>
                        <Select
                            value={filters.intakeId || "all"}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, intakeId: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Intakes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Intakes</SelectItem>
                                {intakes.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select
                            value={filters.paymentStatus || "all"}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, paymentStatus: val as any }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Any Payment Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Payment Status</SelectItem>
                                <SelectItem value="PAID">Fully Paid</SelectItem>
                                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                                <SelectItem value="UNPAID">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Picker */}
                    <div className="space-y-2 flex flex-col">
                        <Label>Registration Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
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
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
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

                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button
                        size="lg"
                        onClick={handleDownload}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Excel Report
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
