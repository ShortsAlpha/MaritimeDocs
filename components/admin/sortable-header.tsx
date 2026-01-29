"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

interface Props {
    column: string
    currentSort: string | undefined
    currentOrder: string | undefined
    label: string
    searchParams: any
}

export function SortableHeader({ column, currentSort, currentOrder, label, searchParams }: Props) {
    const isSorted = currentSort === column
    const newOrder = isSorted && currentOrder === "asc" ? "desc" : "asc"

    // Construct new URL parameters
    const params = new URLSearchParams(searchParams)
    params.set("sort", column)
    params.set("order", newOrder)

    return (
        <Link href={`?${params.toString()}`}>
            <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent">
                {label}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </Link>
    )
}
