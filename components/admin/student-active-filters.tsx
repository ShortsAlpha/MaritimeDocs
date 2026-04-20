"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function StudentActiveFilters() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const course = searchParams.get("course")
    const nationality = searchParams.get("nationality")
    const status = searchParams.get("status")
    const intake = searchParams.get("intake") // Ideally map ID to Name, maybe too hard without props

    // Let's create an array of active filters
    const activeFilters: { key: string; label: string; value: string }[] = []

    if (course && course !== "all") activeFilters.push({ key: "course", label: "Course", value: course })
    if (nationality && nationality !== "all") activeFilters.push({ key: "nationality", label: "Country", value: nationality })
    if (status && status !== "all") activeFilters.push({ key: "status", label: "Status", value: status.replace(/_/g, " ") })
    if (intake && intake !== "all") activeFilters.push({ key: "intake", label: "Intake", value: "Selected Intake" })

    if (activeFilters.length === 0) return null

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete(key)
        params.set("page", "1") // Reset page
        router.push(`${pathname}?${params.toString()}`)
    }

    const clearAll = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("course")
        params.delete("nationality")
        params.delete("status")
        params.delete("intake")
        params.delete("query")
        params.set("page", "1")
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-2 w-full p-3 bg-muted/40 border border-border/50 rounded-lg shadow-xs mt-2 transition-all">
            <span className="text-sm font-medium text-muted-foreground mr-2 flex items-center gap-1.5">
                <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block"></span>
                Active Filters:
            </span>
            <div className="flex flex-wrap items-center gap-2 flex-grow">
                {activeFilters.map((filter) => (
                    <Badge 
                        key={filter.key} 
                        variant="secondary" 
                        className="flex items-center gap-1.5 px-3 py-1 text-[13px] bg-background border shadow-xs hover:bg-muted/80 capitalize"
                    >
                        <span className="font-medium text-muted-foreground">{filter.label}:</span> 
                        <span className="font-semibold text-foreground">{filter.value.toLowerCase()}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => removeFilter(filter.key)}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {filter.label} filter</span>
                        </Button>
                    </Badge>
                ))}
            </div>
            
            <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 px-3 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={clearAll}
            >
                Clear All
            </Button>
        </div>
    )
}
