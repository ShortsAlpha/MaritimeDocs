'use client'

import { useState, useRef, useEffect, useActionState } from "react"
import { Course } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCourse, deleteCourse, updateCourse } from "@/app/actions/courses"
import { Pencil, Trash, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChecklistTemplateDialog } from "@/components/admin/checklist-template-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFormStatus } from "react-dom"

function SubmitButton({ label = "Add Course" }: { label?: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : label}
        </Button>
    )
}

function EditCourseDialog({ course }: { course: Course }) {
    const [open, setOpen] = useState(false)

    async function handleUpdate(formData: FormData) {
        const res = await updateCourse(course.id, formData)
        if (res.success) {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Course</DialogTitle>
                </DialogHeader>
                <form action={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input id="title" name="title" defaultValue={course.title} required />
                    </div>
                    <div className="flex justify-end">
                        <SubmitButton label="Save Changes" />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const initialState = {
    message: "",
    success: false,
}

export function CourseSettings({ courses }: { courses: Course[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
    const [state, formAction] = useActionState(createCourse, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state.success && formRef.current) {
            formRef.current.reset()
        }
    }, [state.success])

    function handleDeleteClick(id: string) {
        setCourseToDelete(id)
        setDeleteDialogOpen(true)
    }

    async function confirmDelete() {
        if (!courseToDelete) return
        setIsDeleting(courseToDelete)
        await deleteCourse(courseToDelete)
        setIsDeleting(null)
        setDeleteDialogOpen(false)
        setCourseToDelete(null)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <CardTitle>Existing Courses</CardTitle>
                    <CardDescription>Manage your course list.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.title}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <ChecklistTemplateDialog course={course} />
                                        <EditCourseDialog course={course} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600"
                                            onClick={() => handleDeleteClick(course.id)}
                                            disabled={isDeleting === course.id}
                                        >
                                            {isDeleting === course.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {courses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No courses found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>Add New Course</CardTitle>
                    <CardDescription>Add a new course to the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={formRef} action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Advanced Fire Fighting" required />
                        </div>
                        <SubmitButton label="Add Course" />
                        {state.message && (
                            <p className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>
                                {state.message}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this course? This action implies data loss.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
