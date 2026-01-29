"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListFilter } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Course } from "@prisma/client"
import { Input } from "@/components/ui/input"

type Props = {
    courses: Course[]
    nationalities?: string[]
}

export function StudentFilter({ courses = [], nationalities = [] }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current values
    const currentCourse = searchParams.get("course") || "all"
    const currentNationality = searchParams.get("nationality") || ""

    // Update params helper
    const updateParams = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all" && value !== "") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleCourseChange = (value: string) => {
        updateParams("course", value)
    }

    const handleNationalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Debounce could be good here, but for now direct update on blur or use keypress? 
        // Typically inputs in popovers are tricky without explicit "Apply" or debounce.
        // Let's rely on [Enter] or Blur, or just OnChange?
        // Let's use OnChange with a small delay or just OnChange for simplicity first. 
        // Actually, for filters, usually "on change" is okay if list is not massive.
        updateParams("nationality", e.target.value)
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                    </span>
                    {(currentCourse !== "all" || currentNationality) && (
                        <div className="h-2 w-2 rounded-full bg-primary absolute top-1 right-1" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none">Filters</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Filter students by course or country.
                        </p>
                    </div>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Select value={currentCourse} onValueChange={handleCourseChange}>
                                <SelectTrigger id="course" className="w-full">
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.title}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationality">Country</Label>
                            <Select value={currentNationality} onValueChange={(val) => updateParams("nationality", val)}>
                                <SelectTrigger id="nationality" className="w-full">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {nationalities.map((nat) => (
                                        <SelectItem key={nat} value={nat}>
                                            {nat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
