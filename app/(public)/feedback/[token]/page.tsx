import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeedbackForm } from "./feedback-form";

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const student = await db.student.findUnique({
        where: { feedbackToken: token },
        include: { feedbacks: true }
    });

    if (!student) {
        return notFound();
    }

    const hasSubmitted = student.feedbacks.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <Card className="max-w-xl w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Course Feedback</CardTitle>
                    <CardDescription>
                        Hi {student.fullName}, please take a moment to rate your experience with us.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FeedbackForm token={token} initialSubmitted={hasSubmitted} />
                </CardContent>
            </Card>
        </div>
    );
}
