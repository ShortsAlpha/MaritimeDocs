"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, FileText, Loader2, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { generateDocumentPreview, saveGeneratedDocument } from "@/app/actions/document-generation";

// We need a lightweight version of getTemplateForCourse just for validation on the client
// Or we just validate on the server. Mmm, better validate on client first.
import { getTemplateForCourse, PdfTemplateDef } from "@/lib/pdf-templates";

export function DocumentGeneratorDialog({ student, courses }: { student: any; courses: any[] }) {
    const [open, setOpen] = useState(false);
    
    // State
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [template, setTemplate] = useState<PdfTemplateDef | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    
    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [rawBase64, setRawBase64] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setPdfBlobUrl(null);
            setRawBase64(null);
            setTemplate(null);
            setValidationErrors([]);
            if (courses.length === 1) {
                handleCourseSelect(courses[0].id);
            } else {
                setSelectedCourseId("");
            }
        }
    }, [open, courses]);

    const handleCourseSelect = (courseId: string) => {
        setSelectedCourseId(courseId);
        setPdfBlobUrl(null);
        setRawBase64(null);

        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        const foundTemplate = getTemplateForCourse(course.title);
        
        if (!foundTemplate) {
            setTemplate(null);
            setValidationErrors(["No certificate template is defined for this course in the system."]);
            return;
        }

        setTemplate(foundTemplate);
        
        // Validate
        const errors = foundTemplate.validate(student);
        setValidationErrors(errors);
    };

    const handleGenerate = async () => {
        if (validationErrors.length > 0 || !template || !selectedCourseId) return;
        
        setIsGenerating(true);
        try {
            const res = await generateDocumentPreview(student.id, selectedCourseId);
            if (res.success && res.base64) {
                // Large base64 strings can break Chromium iframes. Convert to Blob URL directly.
                const byteCharacters = atob(res.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);

                setPdfBlobUrl(blobUrl);
                setRawBase64(res.base64);
            } else {
                toast.error(res.message || "Failed to generate document");
            }
        } catch (error) {
            console.error("PDF Generation error:", error);
            toast.error("An error occurred while generating the document.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!pdfBlobUrl || !template) return;
        
        const a = document.createElement("a");
        a.href = pdfBlobUrl;
        const fileName = `${student.fullName.replace(/\s+/g, '_')}_${template.title.replace(/\s+/g, '_')}.pdf`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleSaveToProfile = async () => {
        if (!selectedCourseId) return;
        
        setIsSaving(true);
        try {
            const res = await saveGeneratedDocument(student.id, selectedCourseId);
            if (res.success) {
                toast.success("Document successfully saved to student profile.");
                setOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (err: any) {
            toast.error(err.message || "An unknown error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="shrink-0 gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Document
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Document Generator</DialogTitle>
                    <DialogDescription>
                        Generate automatic PDF certificates and documents based on student data.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-6 w-full h-full">
                    {/* Step 1: Course Selection */}
                    {courses.length > 1 && !pdfBlobUrl && (
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/40 max-w-2xl mx-auto w-full">
                            <label className="text-sm font-semibold">1. Select the course for this document:</label>
                            <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Step 2: Validation & Generation Screen */}
                    {selectedCourseId && !pdfBlobUrl && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 max-w-2xl mx-auto w-full">
                            {template ? (
                                <div className="border rounded-xl p-6 bg-card">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                {template.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                        </div>
                                    </div>

                                    {validationErrors.length > 0 ? (
                                        <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 mb-3">
                                                <AlertCircle className="h-4 w-4" />
                                                Cannot generate document due to missing fields:
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                                                {validationErrors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                            <p className="mt-4 text-xs text-muted-foreground">Please update the student's profile to complete these requirements and try again.</p>
                                        </div>
                                    ) : (
                                        <div className="mt-6">
                                            <Button 
                                                onClick={handleGenerate} 
                                                disabled={isGenerating} 
                                                className="w-full sm:w-auto"
                                            >
                                                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                                                Generate PDF
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-3">
                                                This will fetch your blank {template.title} template and place user details on it securely.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center border rounded-xl bg-orange-500/10 border-orange-500/20">
                                    <AlertCircle className="h-8 w-8 mx-auto text-orange-500 mb-3" />
                                    <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-1">Template Not Found</h3>
                                    <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
                                        No coded PDF template was found matching "{selectedCourse?.title}".
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: PDF Preview */}
                    {pdfBlobUrl && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 flex flex-col h-[75vh]">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <Save className="h-5 w-5" />
                                        Document Generated Successfully!
                                    </h3>
                                    <p className="text-sm text-muted-foreground">You can preview the PDF below, download it, or save it directly to the student's documents.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleDownload}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                    <Button onClick={handleSaveToProfile} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save to Student Profile
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 bg-muted rounded-xl border overflow-hidden relative shadow-inner">
                                <iframe 
                                    src={pdfBlobUrl} 
                                    className="w-full h-full border-0 absolute inset-0" 
                                    title="PDF Preview"
                                    style={{ backgroundColor: 'transparent' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
