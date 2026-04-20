"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { useState, useEffect } from "react"

export function StudentSearch() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    
    const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "")

    useEffect(() => {
        setSearchTerm(searchParams.get("query") || "")
    }, [searchParams])

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set("query", term)
        } else {
            params.delete("query")
        }
        params.set("page", "1") // Reset to page 1
        replace(`${pathname}?${params.toString()}`)
    }, 300)

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        handleSearch(e.target.value)
    }

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search name, ID, email..."
                className="h-10 w-full sm:w-[300px] md:w-[200px] lg:w-[300px] pl-9 bg-background"
                onChange={onChange}
                value={searchTerm}
            />
        </div>
    )
}
