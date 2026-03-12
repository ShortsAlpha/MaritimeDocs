import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
    return (
        <div className="p-6 space-y-6 w-full animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
                {/* Stats / Cards area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>

                {/* Table / Main area */}
                <Skeleton className="h-[400px] w-full rounded-xl mt-8" />
            </div>
        </div>
    )
}
