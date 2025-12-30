import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

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
        <div className="flex h-screen overflow-hidden">
            <DashboardSidebar role={role} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 justify-between shrink-0">
                    <div className="lg:hidden font-semibold text-lg">Maritime LMS</div>
                    <div className="ml-auto">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    );
}
