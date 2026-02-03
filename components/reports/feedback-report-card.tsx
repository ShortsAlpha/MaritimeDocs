'use client';

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { exportFeedbackReport } from "@/app/actions/reports";

export function FeedbackReportCard() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleExport() {
        setIsLoading(true);
        try {
            const data = await exportFeedbackReport();

            if (!data || data.length === 0) {
                toast.warning("No feedback data found to export.");
                setIsLoading(false);
                return;
            }

            // Create Worksheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Adjust column widths roughly
            const wscols = [
                { wch: 25 }, // Name
                { wch: 20 }, // Course
                { wch: 15 }, // Course Rating
                { wch: 15 }, // Instructor Rating
                { wch: 12 }, // Recommend
                { wch: 50 }, // Comment
                { wch: 15 }, // Date
            ];
            ws['!cols'] = wscols;

            // Create Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Feedbacks");

            // Download
            XLSX.writeFile(wb, `Feedback_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Feedback report downloaded!");

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    Feedback Reports
                </CardTitle>
                <CardDescription>
                    Export all student course feedbacks to Excel. Includes ratings, comments, and recommendations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-1">
                        <p className="font-medium text-sm">Consolidated Feedback Data</p>
                        <p className="text-xs text-muted-foreground">Detailed export of all submissions</p>
                    </div>
                    <Button onClick={handleExport} disabled={isLoading} variant="outline" className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export to Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
