"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { createFeedback } from "@/app/actions/feedback";
import { toast } from "sonner";
import { Turnstile } from "@/components/ui/turnstile";
import Script from "next/script";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
    token: string;
    initialSubmitted?: boolean;
}

const RATING_QUESTIONS = [
    { key: "registrationProcess", label: "The registration process was" },
    { key: "practicalStandards", label: "The standard of practical / simulator exercises was" },
    { key: "courseMaterials", label: "The course materials were" },
    { key: "courseContent", label: "The course content was" },
    { key: "instructorEffectiveness", label: "Your instructors responded to questions effectively?" },
    { key: "overallImpression", label: "My overall impression of the course was" },
    { key: "staffFriendliness", label: "Overall, how friendly were the staff members?" },
    { key: "learningEffectiveness", label: "How effective have you learned from training?" },
];

const SOURCES = [
    { value: "LINKEDIN", label: "Linkedin" },
    { value: "WORD_OF_MOUTH", label: "Word of mouth" },
    { value: "ADVERTISEMENT", label: "Advertisement" },
    { value: "SOCIAL_MEDIA", label: "Social Media (Facebook, Instagram, Twitter)" },
    { value: "RECOMMENDATION", label: "Recommendation" },
    { value: "OTHER", label: "Other" },
];

function RatingField({ name, label }: { name: string, label: string }) {
    return (
        <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
            <Label className="text-base font-medium">{label} <span className="text-red-500">*</span></Label>
            <RadioGroup
                name={name}
                className="flex flex-wrap gap-2 sm:gap-4"
                required
                onInvalid={(e: any) => e.target.setCustomValidity("Please select a rating.")}
                onInput={(e: any) => e.target.setCustomValidity("")}
            >
                {[1, 2, 3, 4, 5].map((val) => (
                    <div key={val} className="flex items-center">
                        <RadioGroupItem value={val.toString()} id={`${name}-${val}`} className="peer sr-only" />
                        <Label
                            htmlFor={`${name}-${val}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full min-w-[60px] cursor-pointer p-2 rounded-md border-2 border-muted transition-all hover:border-primary",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary"
                            )}
                        >
                            <span className="text-xl font-bold">{val}</span>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                                {val === 5 ? "Excellent" : val === 1 ? "Poor" : val === 3 ? "Good" : ""}
                            </span>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}

export function FeedbackForm({ token: authToken, initialSubmitted = false }: FeedbackFormProps) {
    const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");

    async function handleSubmit(formData: FormData) {
        if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
            toast.error("Please complete the security check.");
            return;
        }

        setIsSubmitting(true);
        formData.set("cf-turnstile-response", turnstileToken);

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
        <form action={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <input type="hidden" name="token" value={authToken} />

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">1. General Information</h3>

                <div className="space-y-3">
                    <Label className="text-base">How did you hear of Xone Superyacht?</Label>
                    <RadioGroup name="source" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SOURCES.map((source) => (
                            <div key={source.value} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value={source.value} id={`src-${source.value}`} />
                                <Label htmlFor={`src-${source.value}`} className="flex-1 cursor-pointer font-normal">{source.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">2. Course Ratings</h3>
                <p className="text-sm text-muted-foreground">Please rate the following aspects from 1 (Poor) to 5 (Excellent).</p>

                <div className="grid gap-6">
                    {RATING_QUESTIONS.map((q) => (
                        <RatingField key={q.key} name={q.key} label={q.label} />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">3. Conclusion</h3>

                <div className="space-y-3 bg-neutral-100/50 dark:bg-neutral-900/20 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <Label className="text-base font-medium">Will you recommend us to your friends? <span className="text-red-500">*</span></Label>
                    <RadioGroup
                        name="recommend"
                        className="flex flex-col sm:flex-row gap-4 pt-2"
                        required
                        onInvalid={(e: any) => e.target.setCustomValidity("Please select an option.")}
                        onInput={(e: any) => e.target.setCustomValidity("")}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="YES" id="rec-yes" />
                            <Label htmlFor="rec-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO" id="rec-no" />
                            <Label htmlFor="rec-no">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MAYBE" id="rec-maybe" />
                            <Label htmlFor="rec-maybe">Maybe</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="comment" className="text-base font-medium">Any other comments?</Label>
                    <Textarea
                        name="comment"
                        id="comment"
                        placeholder="Tell us what you liked or how we can improve..."
                        className="min-h-[100px]"
                    />
                </div>
            </div>

            {/* Turnstile Widget */}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <div className="flex justify-center py-2 h-[80px]">
                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onVerify={(t) => setTurnstileToken(t)}
                        onExpire={() => setTurnstileToken("")}
                    />
                    <Script
                        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
                        async
                        defer
                    />
                </div>
            )}

            <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                {isSubmitting ? <span className="flex items-center gap-2">Submitting...</span> : "Submit Feedback"}
            </Button>
        </form>
    );
}
