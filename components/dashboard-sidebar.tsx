'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, BookOpen, Upload, Users, FileText, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

const adminRoutes = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students", icon: Users },
];

import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const routes = adminRoutes;

    return (
        <div className="w-64 border-r bg-muted/40 hidden lg:flex lg:flex-col h-full relative">
            <div className="flex h-14 items-center justify-between border-b px-6 font-semibold">
                <span>{role === "ADMIN" ? "Admin Panel" : "Student Portal"}</span>
                <ThemeToggle />
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

            <div className="p-4 border-t mt-auto">
                <Link href="/admin/settings">
                    <span className={cn(
                        "group flex items-center rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors",
                        pathname === "/admin/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </span>
                </Link>
            </div>
        </div>
    );
}
