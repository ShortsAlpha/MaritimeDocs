'use client';

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { exportFeedbackReportExcel } from "@/app/actions/reports";

export function FeedbackReportCard() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleExport() {
        setIsLoading(true);
        try {
            const base64Coords = await exportFeedbackReportExcel();

            if (!base64Coords) {
                toast.warning("No data or failed to generate report.");
                setIsLoading(false);
                return;
            }

            // Convert Base64 to Blob
            const binaryString = window.atob(base64Coords);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            // Download
            const dateStr = new Date().toISOString().split('T')[0];
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Feedback_Report_${dateStr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Feedback report downloaded successfully!");

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
