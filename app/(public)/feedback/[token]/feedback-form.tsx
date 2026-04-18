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
        <div className="space-y-4 bg-card border border-border/50 shadow-sm p-5 sm:p-6 rounded-2xl hover:shadow-md hover:border-primary/20 transition-all">
            <Label className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                {label} <span className="text-destructive">*</span>
            </Label>
            <div className="pt-2">
                <RadioGroup
                    name={name}
                    className="flex justify-between items-center gap-2 sm:gap-3"
                    required
                    onInvalid={(e: any) => e.target.setCustomValidity("Please select a rating.")}
                    onInput={(e: any) => e.target.setCustomValidity("")}
                >
                    {[1, 2, 3, 4, 5].map((val) => (
                        <div key={val} className="flex-1">
                            <RadioGroupItem value={val.toString()} id={`${name}-${val}`} className="peer sr-only" />
                            <Label
                                htmlFor={`${name}-${val}`}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-12 sm:h-14 cursor-pointer rounded-xl border-2 border-transparent bg-muted/40 transition-all hover:bg-muted/80 hover:border-primary/40",
                                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:scale-[1.02]"
                                )}
                            >
                                <span className="text-lg sm:text-xl font-bold">{val}</span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                <div className="flex justify-between mt-3 px-1 text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase opacity-80">
                    <span className="text-left w-20">1 - Poor</span>
                    <span className="text-center w-20">3 - Good</span>
                    <span className="text-right w-20">5 - Excellent</span>
                </div>
            </div>
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

            <div className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">1. General Information</h3>
                    <p className="text-sm text-muted-foreground">Help us understand where our students come from.</p>
                </div>

                <div className="space-y-4 bg-card border border-border/50 shadow-sm p-5 sm:p-6 rounded-2xl">
                    <Label className="text-base font-medium">How did you hear of Xone Maritime? <span className="text-destructive">*</span></Label>
                    <RadioGroup name="source" className="grid grid-cols-1 sm:grid-cols-2 gap-3" required>
                        {SOURCES.map((source) => (
                            <div key={source.value}>
                                <RadioGroupItem value={source.value} id={`src-${source.value}`} className="peer sr-only" />
                                <Label 
                                    htmlFor={`src-${source.value}`} 
                                    className="flex h-full items-center pl-4 pr-4 py-4 border-2 rounded-xl cursor-pointer bg-muted/20 text-muted-foreground font-medium transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary peer-data-[state=checked]:[&_.radio-circle]:border-primary peer-data-[state=checked]:[&_.radio-dot]:scale-100"
                                >
                                    <div className="radio-circle flex w-5 h-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 mr-3 transition-colors">
                                        <div className="radio-dot w-3 h-3 rounded-full bg-primary scale-0 transition-transform translate-x-0 translate-y-0" />
                                    </div>
                                    <span className="flex-1">{source.label}</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">2. Course Ratings</h3>
                    <p className="text-sm text-muted-foreground">Please rate the following aspects from 1 (Poor) to 5 (Excellent).</p>
                </div>

                <div className="grid gap-6 sm:gap-8">
                    {RATING_QUESTIONS.map((q) => (
                        <RatingField key={q.key} name={q.key} label={q.label} />
                    ))}
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">3. Conclusion</h3>
                    <p className="text-sm text-muted-foreground">Final thoughts on your experience.</p>
                </div>

                <div className="space-y-4 bg-card border border-border/50 shadow-sm p-5 sm:p-6 rounded-2xl">
                    <Label className="text-base font-medium">Will you recommend us to your friends? <span className="text-destructive">*</span></Label>
                    <RadioGroup
                        name="recommend"
                        className="grid grid-cols-3 gap-3 pt-2"
                        required
                        onInvalid={(e: any) => e.target.setCustomValidity("Please select an option.")}
                        onInput={(e: any) => e.target.setCustomValidity("")}
                    >
                        {["YES", "NO", "MAYBE"].map((opt) => (
                            <div key={opt} className="relative">
                                <RadioGroupItem value={opt} id={`rec-${opt}`} className="peer sr-only" />
                                <Label
                                    htmlFor={`rec-${opt}`}
                                    className="flex flex-col items-center justify-center p-3 h-14 border-2 rounded-xl cursor-pointer bg-muted/20 text-muted-foreground font-medium transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary"
                                >
                                    {opt === "YES" ? "Yes" : opt === "NO" ? "No" : "Maybe"}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-3 bg-card border border-border/50 shadow-sm p-5 sm:p-6 rounded-2xl">
                    <Label htmlFor="comment" className="text-base font-medium">Any other comments?</Label>
                    <Textarea
                        name="comment"
                        id="comment"
                        placeholder="Tell us what you liked or how we can improve..."
                        className="min-h-[120px] resize-y bg-muted/20 focus:bg-background transition-colors text-base p-4 rounded-xl"
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
