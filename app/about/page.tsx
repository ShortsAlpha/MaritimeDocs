"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { Separator } from "@/components/ui/separator";

// Team Inteface
interface TeamMember {
    name: string;
    title: string;
}

const team: TeamMember[] = [
    { name: "Dr. Emin Cihan Duyan", title: "Managing Director / Partner" },
    { name: "Umit Yasar Surucu", title: "Chief Instructor" },
    { name: "Marcello Lavorato", title: "Chief Instructor" },
    { name: "Olcay Dogru", title: "Instructor" },
    { name: "Dr. Rudy Colson", title: "Instructor" },
    { name: "Ugur Pehlivanoglu", title: "Instructor" },
    { name: "Dilara Topal", title: "Finance & Training Coordinator" },
    { name: "Ender Sahin", title: "Training Coordinator" },
    { name: "Aliye Delibas Sengul", title: "Assistant Training Coordinator" },
    { name: "Martin Momchilov", title: "Instructor" },
];

export default function AboutPage() {
    return (
        <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden">
            {/* Background Particles */}
            <div className="fixed inset-0 z-0">
                <Particles
                    className="absolute inset-0"
                    quantity={50}
                    ease={80}
                    color="#ffffff"
                    refresh
                />
            </div>

            {/* Navbar */}
            <nav className="relative z-20 w-full">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between relative">
                        {/* Brand Name Only */}
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="text-xl font-bold text-white">Xone Superyacht Academy</span>
                        </div>

                        {/* Navigation Pills - Centered */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center space-x-1 rounded-full bg-white/5 border-white/10 backdrop-blur-xl border p-1">
                            <Link
                                href="/"
                                className="rounded-full px-4 py-2 text-sm font-medium transition-all text-white/90 hover:bg-white/10 hover:text-white"
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className="rounded-full px-4 py-2 text-sm font-medium transition-all text-white bg-white/10"
                            >
                                About Us
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 space-y-24">

                {/* Introduction Section */}
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        About <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Xone Superyacht Academy</span>
                    </h1>
                    <div className="prose prose-invert max-w-none text-lg text-gray-300 leading-relaxed space-y-6">
                        <p>
                            No matter where you are in your career journey - whether just starting or seeking advancement -
                            Xone Superyacht Academy has the perfect course or program for every seafarer. Our comprehensive training
                            covers all sides of maritime operations, including navigation, safety, hospitality, and management.
                        </p>
                        <p>
                            Xone Superyacht Academy has a Quality Management System under ISO 9001:2015 and is certified by
                            Lloyds Register Quality Assurance (LRQA). We are an approved maritime training center of the
                            Malta Flag State, the Marshall Islands, and an IYT Worldwide partner school. With experienced
                            instructors, state-of-the-art facilities, and hands-on training, we ensure our students are
                            set on a path to succeed in this challenging industry.
                        </p>
                        <p>
                            Merchant seafarers can begin with STCW Basic Safety Training and progress to attain the
                            Master Mariner Unlimited STCW II / 2 Level. Seafarers aspiring to work on superyachts can
                            elevate their skills with our fully STCW-compliant and MCA-recognized courses up to the
                            Master of Yachts 3000 GT certificate.
                        </p>
                        <p className="font-medium text-white">
                            Explore all the courses available at our academy located in Malta, Turkey, and Greece.
                        </p>
                    </div>
                </section>

                <Separator className="bg-white/10" />

                {/* Founder Message Section */}
                <section className="grid md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-4">
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold">Levent Baktir</h3>
                            <p className="text-sm text-blue-400">Founder / Chairman</p>
                        </div>
                    </div>
                    <div className="md:col-span-8 flex flex-col justify-center space-y-6 text-lg text-gray-300 leading-relaxed">
                        <blockquote className="border-l-4 border-blue-500 pl-6 italic bg-white/5 py-4 pr-4 rounded-r-lg">
                            "On behalf of our unique and strong team, I welcome you to Superyacht Group. I have built and cultivated
                            a vast network, blending and growing with the strengths of the colleagues and partners who joined our
                            ship on its way."
                        </blockquote>
                        <p>
                            Founding purpose was quite simple: to share the experiences we gained on the oceans, within the
                            world's leading yacht and maritime management companies, in the largest and most luxurious marinas
                            and destinations.
                        </p>
                        <p>
                            It is both a privilege and a mission for us to share this know-how with especially young individuals
                            pursuing a career at sea. We will continue to be a gathering place for people who dream of the
                            outer Solar System, not of reaching a known planet.
                        </p>
                    </div>
                </section>

                <Separator className="bg-white/10" />

                {/* Team Section */}
                <section className="space-y-12">
                    <h2 className="text-3xl font-bold tracking-tight text-center">Our Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {team.map((member, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                                <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{member.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">{member.title}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <Separator className="bg-white/10" />

                {/* Locations / Footer */}
                <section className="grid md:grid-cols-2 gap-12">
                    {/* TR */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="bg-blue-600 w-2 h-6 rounded-full" /> XONE TURKEY
                        </h3>
                        <div className="space-y-3 text-gray-400">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                                <p>İnönü Bulvarı No:35 Göcek – Fethiye – Muğla</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                                <p>+90 252 645 22 52</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                                <p>info@xonesuperyacht.com</p>
                            </div>
                        </div>
                    </div>

                    {/* MT */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="bg-red-600 w-2 h-6 rounded-full" /> XONE MALTA
                        </h3>
                        <div className="space-y-3 text-gray-400">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                                <p>Block C Number 2, Skyway Offices, 179 Marina Street, Pieta, PTA 9042, Malta</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-red-500 shrink-0" />
                                <p>+356 9910 49 01</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-red-500 shrink-0" />
                                <p>malta@xonesuperyacht.com</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 text-center text-sm text-gray-600 border-t border-white/5 mt-12 bg-black z-20 relative">
                © 2026 Xone Superyacht Academy Student Management System. All rights reserved.
            </footer>
        </div>
    );
}
