"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListFilter } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Course } from "@prisma/client"

type Props = {
    courses: Course[]
}

export function StudentFilter({ courses = [] }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentCourse = searchParams.get("course") || "all"

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all") {
            params.set("course", value)
        } else {
            params.delete("course")
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-[300px] max-w-[90vw]" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none">Filters</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-muted-foreground hover:text-foreground"
                                onClick={() => handleValueChange("all")}
                            >
                                Clear
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Filter students by course or status.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="course">Course</Label>
                            <Select value={currentCourse} onValueChange={handleValueChange}>
                                <SelectTrigger id="course" className="w-full">
                                    <span className="truncate">
                                        <SelectValue placeholder="Select course" />
                                    </span>
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
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
