'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, BookOpen, Upload, Users, FileText, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

const adminRoutes = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/review", label: "Reviews", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

const studentRoutes = [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/upload", label: "Upload Documents", icon: Upload },
];

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const routes = role === "ADMIN" ? adminRoutes : studentRoutes;

    return (
        <div className="w-64 border-r bg-muted/40 hidden lg:block h-full">
            <div className="flex h-14 items-center border-b px-6 font-semibold">
                {role === "ADMIN" ? "Admin Panel" : "Student Portal"}
            </div>
            <div className="flex-1 py-4 flex flex-col gap-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <span className={cn(
                                "group flex items-center rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}>
                                <route.icon className="mr-2 h-4 w-4" />
                                {route.label}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
