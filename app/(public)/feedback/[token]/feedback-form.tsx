"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2 } from "lucide-react";
import { createFeedback } from "@/app/actions/feedback";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface FeedbackFormProps {
    token: string;
    initialSubmitted?: boolean;
}

export function FeedbackForm({ token, initialSubmitted = false }: FeedbackFormProps) {
    const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            const result = await createFeedback(formData);
            if (result.success) {
                setIsSubmitted(true);
            } else {
                toast.error(result.message || "Something went wrong. Please try again.");
                setIsSubmitting(false);
            }
        } catch (error) {
            toast.error("Failed to submit feedback.");
            setIsSubmitting(false);
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in cursor-default select-none">
                <div className="bg-green-100 p-4 rounded-full dark:bg-green-900/30">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-center">Thanks for your feedback!</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    We appreciate you taking the time to help us improve. Your response has been recorded.
                </p>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-3">
                <Label className="text-base">How would you rate the course content? (1-5)</Label>
                <RadioGroup name="courseRating" className="flex items-center gap-4 justify-center" required>
                    {[1, 2, 3, 4, 5].map((val) => (
                        <div key={val} className="flex flex-col items-center">
                            <RadioGroupItem value={val.toString()} id={`c-${val}`} className="peer sr-only" />
                            <Label
                                htmlFor={`c-${val}`}
                                className="flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg hover:bg-muted peer-data-[state=checked]:text-yellow-500 peer-data-[state=checked]:bg-yellow-50 dark:peer-data-[state=checked]:bg-yellow-950/30 transition-all"
                            >
                                <span className="text-lg font-bold">{val}</span>
                                <Star className="w-5 h-5 fill-current opacity-20 peer-data-[state=checked]:opacity-100" />
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="space-y-3">
                <Label className="text-base">How would you rate the instructor? (1-5)</Label>
                <RadioGroup name="instructorRating" className="flex items-center gap-4 justify-center" required>
                    {[1, 2, 3, 4, 5].map((val) => (
                        <div key={val} className="flex flex-col items-center">
                            <RadioGroupItem value={val.toString()} id={`i-${val}`} className="peer sr-only" />
                            <Label htmlFor={`i-${val}`} className="flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg hover:bg-muted peer-data-[state=checked]:text-indigo-500 peer-data-[state=checked]:bg-indigo-50 transition-all">
                                <span className="text-lg font-bold">{val}</span>
                                <div className="h-2 w-2 rounded-full bg-current" />
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="space-y-3">
                <Label className="text-base">Would you recommend us to a friend?</Label>
                <RadioGroup name="recommend" defaultValue="yes" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="r-yes" />
                        <Label htmlFor="r-yes">Yes, absolutely</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="r-no" />
                        <Label htmlFor="r-no">No</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-3">
                <Label htmlFor="comment" className="text-base">Any other comments?</Label>
                <Textarea
                    name="comment"
                    id="comment"
                    placeholder="Tell us what you liked or how we can improve..."
                    className="min-h-[100px]"
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
        </form>
    );
}
