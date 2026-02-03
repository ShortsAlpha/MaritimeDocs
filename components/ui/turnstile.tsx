"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"

interface TurnstileProps {
    siteKey: string
    onVerify: (token: string) => void
    onError?: () => void
    onExpire?: () => void
    theme?: "light" | "dark" | "auto"
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string
                    theme?: string
                    callback?: (token: string) => void
                    "error-callback"?: () => void
                    "expired-callback"?: () => void
                }
            ) => string
            reset: (widgetId: string) => void
        }
        onloadTurnstileCallback?: () => void
    }
}

export function Turnstile({ siteKey, onVerify, onError, onExpire, theme = "auto" }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [widgetId, setWidgetId] = useState<string | null>(null)

    useEffect(() => {
        if (!containerRef.current || !siteKey) return

        // Function to render the widget
        const renderWidget = () => {
            if (window.turnstile && containerRef.current) {
                // Clear container just in case
                containerRef.current.innerHTML = ""
                const id = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme,
                    callback: (token) => onVerify(token),
                    "error-callback": onError,
                    "expired-callback": onExpire,
                })
                setWidgetId(id)
            }
        }

        // Check if script is already waiting
        if (window.turnstile) {
            renderWidget()
        } else {
            // Define global callback for script load
            window.onloadTurnstileCallback = renderWidget
        }

        return () => {
            // Cleanup if needed (Turnstile doesn't have a clear 'destroy' but we can reset)
            if (widgetId && window.turnstile) {
                window.turnstile.reset(widgetId)
            }
            // Remove global callback to avoid leaks
            window.onloadTurnstileCallback = undefined
        }
    }, [siteKey, theme]) // Re-run if siteKey changes

    return (
        <div ref={containerRef} className="min-h-[65px]" />
    )
}
