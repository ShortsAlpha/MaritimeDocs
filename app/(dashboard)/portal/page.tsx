import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UploadCard } from "@/components/student/upload-card";
// import render_diffs from artifacts; // No I should not import that.

export default async function StudentPortalPage() {
    const { userId } = await auth();
    if (!userId) return <div>Please sign in.</div>;

    // Fetch all required document types
    const docTypes = await db.documentType.findMany({
        orderBy: { isRequired: 'desc' }
    });

    // Fetch student's uploaded documents
    const studentDocs = await db.studentDocument.findMany({
        where: { userId }
    });

    // Helper to find doc for a type
    const getDoc = (typeId: string) => studentDocs.find((d: any) => d.documentTypeId === typeId);

    // Calculate progress
    const requiredCount = docTypes.filter((d: any) => d.isRequired).length;
    const approvedCount = studentDocs.filter((d: any) =>
        d.status === "APPROVED" && docTypes.find((t: any) => t.id === d.documentTypeId)?.isRequired
    ).length;

    const progress = requiredCount > 0 ? (approvedCount / requiredCount) * 100 : 100;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">My Documents</h1>
                <div className="text-sm text-muted-foreground">
                    Completion: {Math.round(progress)}%
                </div>
            </div>

            {/* Progress Bar could go here */}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {docTypes.map((type: any) => (
                    <UploadCard
                        key={type.id}
                        docType={type}
                        currentDoc={getDoc(type.id) || null}
                    />
                ))}
                {docTypes.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground">
                        No documents are required at this time.
                    </div>
                )}
            </div>
        </div>
    );
}
