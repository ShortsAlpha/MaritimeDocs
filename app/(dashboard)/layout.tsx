import { auth } from "@clerk/nextjs/server";
import UserProfile from "@/components/ui/user-profile";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { PageViewLogger } from "@/components/admin/page-view-logger";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    const role = user?.role || "STUDENT";

    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <PageViewLogger />
            <AppSidebar role={role} />
            <SidebarInset className="flex flex-col h-svh w-full overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 md:px-3 lg:px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                        <UserProfile />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-3 lg:p-4">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
