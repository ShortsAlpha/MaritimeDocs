import { db } from "@/lib/db";
import { getSignedDownloadUrls } from "@/app/actions/lecture-notes";
import { FileText, Download, ShieldCheck, Mail, Phone, Presentation, File } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

function getFileIcon(filename: string) {
    if (filename.toLowerCase().endsWith('.pdf')) {
        return <FileText className="w-10 h-10 text-red-500" />;
    } else if (filename.toLowerCase().endsWith('.pptx') || filename.toLowerCase().endsWith('.ppt')) {
        return <Presentation className="w-10 h-10 text-orange-500" />;
    }
    return <File className="w-10 h-10 text-blue-500" />;
}

function formatFilename(filename: string) {
    // Remove extension
    let name = filename.replace(/\.[^/.]+$/, "");
    // Replace underscores and dashes with spaces
    name = name.replace(/[_-]/g, " ");
    // Remove things like (1) (1) (1)
    name = name.replace(/\(\d+\)/g, "");
    return name.trim();
}

export default async function NotesPortalPage(props: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    
    const { token } = params;
    const courseId = searchParams.courseId as string | undefined;
    const courseTitle = searchParams.title as string | undefined;

    if (!token || !courseId || !courseTitle) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <main className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-500 mb-6">The magic link you clicked is incomplete or invalid.</p>
                </main>
            </div>
        );
    }

    const student = await db.student.findUnique({
        where: { uploadToken: token },
        include: { courses: true }
    });

    if (!student) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <main className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-500 mb-6">This access token has expired or is invalid.</p>
                </main>
            </div>
        );
    }

    // Verify course enrollment (Optional strictness)
    const isEnrolled = student.courses.some(c => c.id === courseId);
    if (!isEnrolled) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <main className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
                    <p className="text-gray-500 mb-6">You are not enrolled in this course.</p>
                </main>
            </div>
        );
    }

    const result = await getSignedDownloadUrls(courseTitle);
    const files = result.success && result.files ? result.files : [];

    return (
        <div className="min-h-screen bg-neutral-100/50 flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-5xl space-y-6">
                
                {/* Header Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="h-32 bg-[#0a192f] p-6 relative">
                        <div className="absolute top-6 left-6 text-white tracking-tight font-semibold text-xl flex items-center gap-2">
                            Xone Maritime Academy
                        </div>
                    </div>
                    <div className="px-6 pb-6 pt-4 relative">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 min-w-0 truncate">{student.fullName}</h1>
                                <p className="text-sm font-medium text-emerald-600 uppercase mt-1 min-w-0">
                                    {courseTitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Notes Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Lecture Notes</h2>
                        <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                            {files.length} Documents
                        </span>
                    </div>

                    {files.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No documents available</h3>
                            <p className="text-gray-500">Your instructor has not uploaded notes for this course yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {files.map((file: any, index: number) => (
                                <div key={index} className="bg-white group rounded-xl shadow-sm hover:shadow-md transition-all border border-neutral-200 p-5 flex flex-col h-full relative overflow-hidden">
                                    <div className="flex-1">
                                        <div className="mb-4">
                                            {getFileIcon(file.name)}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1" title={file.name}>
                                            {formatFilename(file.name)}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="pt-5 mt-auto border-t border-gray-100">
                                        <a 
                                            href={file.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download File
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <footer className="text-center pt-8 pb-4 text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Xone Maritime Academy. Strictly for student use only.
                </footer>
            </div>
        </div>
    );
}
