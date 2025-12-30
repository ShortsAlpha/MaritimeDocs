import { db } from "@/lib/db";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reviewDocument } from "@/app/actions/document-review";
import { Input } from "@/components/ui/input";
import { ReviewCard } from "./review-card";

export default async function AdminReviewPage() {
    const pendingDocs = await db.studentDocument.findMany({
        where: { status: "PENDING" },
        include: {
            user: true,
            documentType: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Pending Reviews</h1>

            {pendingDocs.length === 0 && (
                <p className="text-muted-foreground">No pending documents to review.</p>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingDocs.map((doc: any) => (
                    <ReviewCard key={doc.id} doc={doc} />
                ))}
            </div>
        </div>
    );
}

// Client component for the card so we can have state for rejection reason
// End of file
