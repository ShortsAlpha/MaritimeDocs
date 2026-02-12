"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Settings, Calendar, FileBarChart, BookOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"


const adminRoutes = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/instructors", label: "Instructors", icon: Users },
    { href: "/admin/calendar", label: "Calendar", icon: Calendar },
    { href: "/admin/workbook", label: "Workbook", icon: BookOpen },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart },
]

export function AppSidebar({ role }: { role: string }) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!gap-0 group-data-[collapsible=icon]:justify-center">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 shrink-0 object-contain group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:translate-x-1 transition-all duration-300" />
                    <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">
                        Xone Superyacht Academy
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminRoutes.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.label}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === "/admin/settings"}
                            tooltip="Settings"
                        >
                            <Link href="/admin/settings">
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
