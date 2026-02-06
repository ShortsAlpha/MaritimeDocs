"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, User } from "lucide-react"
import { uploadProfilePhoto } from "@/app/actions/students"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StudentPhotoUploadProps {
    studentId: string
    photoUrl?: string | null
    fullName: string
    className?: string
}

export function StudentPhotoUpload({ studentId, photoUrl, fullName, className }: StudentPhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [currentPhoto, setCurrentPhoto] = useState(photoUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("Image size must be less than 5MB")
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("studentId", studentId)
            formData.append("file", file)

            const result = await uploadProfilePhoto(formData)

            if (result.success && result.url) {
                setCurrentPhoto(result.url)
                toast.success("Profile photo updated")
            } else {
                toast.error(result.message || "Failed to upload photo")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className={cn("relative group flex-shrink-0", className)}>
            <Avatar className="h-full w-full border-4 border-background shadow-sm bg-muted">
                <AvatarImage src={currentPhoto || ""} className="object-cover h-full w-full" />
                <AvatarFallback className="flex items-center justify-center w-full h-full text-xl font-bold bg-primary/10 text-primary">
                    {getInitials(fullName)}
                </AvatarFallback>
            </Avatar>

            <div
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white z-10"
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <Camera className="h-6 w-6" />
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    )
}
