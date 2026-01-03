"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteStudent } from "@/app/actions/students"

interface Props {
    studentId: string
}

export function DeleteStudentButton({ studentId }: Props) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const res = await deleteStudent(studentId)
            if (res.success) {
                router.push("/admin/students")
                router.refresh()
            } else {
                alert("Hata: " + res.message)
                setIsDeleting(false)
            }
        } catch (error) {
            console.error(error)
            setIsDeleting(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Delete Student
            </Button>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Student
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the student profile,
                        payments, and uploaded documents.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
