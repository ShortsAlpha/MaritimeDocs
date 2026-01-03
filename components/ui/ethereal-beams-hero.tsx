'use client'

import React from "react"
import { ArrowRight, Github, Star } from "lucide-react"
import Link from "next/link"

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost"
    size?: "sm" | "lg"
    children: React.ReactNode
}

const Button = ({ variant = "default", size = "sm", className = "", children, ...props }: ButtonProps) => {
    const baseClasses =
        "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
        default: "bg-white text-black hover:bg-gray-100",
        outline: "border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30",
        ghost: "text-white/90 hover:text-white hover:bg-white/10",
    }

    const sizes = {
        sm: "h-9 px-4 py-2 text-sm",
        lg: "px-8 py-6 text-lg",
    }

    return (
        <button
            className={`group relative overflow-hidden rounded-full ${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="relative z-10 flex items-center">{children}</span>
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </button>
    )
}

// ============================================================================
// MAIN HERO COMPONENT
// ============================================================================

// ============================================================================
// MAIN HERO COMPONENT
// ============================================================================

// ============================================================================
// MAIN HERO COMPONENT
// ============================================================================

export default function EtherealBeamsHero({ liteMode, setLiteMode }: { liteMode?: boolean, setLiteMode?: (val: boolean) => void }) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-transparent">

            {/* Glassmorphic Navbar */}
            <nav className="relative z-20 w-full">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Brand Name Only */}
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="text-xl font-bold text-white">Maritime Academy Docs</span>
                        </div>

                        {/* Glassmorphic Navigation Pills */}
                        <div className="hidden md:flex items-center space-x-1 rounded-full bg-white/5 border-white/10 backdrop-blur-xl border p-1 -mr-6">
                            <Link
                                href="#"
                                className="rounded-full px-4 py-2 text-sm font-medium transition-all text-white/90 hover:bg-white/10 hover:text-white"
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className="rounded-full px-4 py-2 text-sm font-medium transition-all text-white/90 hover:bg-white/10 hover:text-white"
                            >
                                About Us
                            </Link>

                        </div>

                        {/* CTA Button */}
                        <div className="flex items-center space-x-4">
                            <Link href="/sign-in">
                                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button size="sm">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        {/* Badge */}
                        <div className="mb-8 inline-flex items-center rounded-full px-4 py-2 text-sm backdrop-blur-xl border bg-white/5 border-white/10 text-white/90">
                            <Star className="mr-2 h-4 w-4 text-white" />
                            {"Official Document Management"}
                        </div>

                        {/* Main Heading */}
                        {/* Main Heading */}
                        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-white">
                            Maritime Academy{" "}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                Docs
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="mb-10 text-lg leading-8 sm:text-xl lg:text-2xl max-w-3xl mx-auto text-white/80">
                            Maritime Academy Docs System
                        </p>


                    </div>
                </div>
            </div>
        </div>
    )
}
