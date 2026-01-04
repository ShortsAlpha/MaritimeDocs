'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteFileFromR2, renameFolderInR2 } from "@/lib/r2"
import { slugify } from "@/lib/utils"

const StudentSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    course: z.string().optional(),
    totalFee: z.coerce.number().min(0, "Fee must be positive"),
})

export async function createStudent(prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            course: formData.get("course"),
            totalFee: formData.get("totalFee"),
        }

        const data = StudentSchema.parse(rowData)

        await db.student.create({
            data: {
                fullName: data.fullName,
                email: data.email || null,
                phone: data.phone || null,
                course: data.course || null,
                totalFee: data.totalFee,
            }
        })

        revalidatePath("/admin/students")
        return { success: true, message: "Student created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create student" }
    }
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
    try {
        const rowData = {
            fullName: formData.get("fullName") === null ? undefined : formData.get("fullName"),
            email: formData.get("email") === null ? undefined : formData.get("email"),
            phone: formData.get("phone") === null ? undefined : formData.get("phone"),
            address: formData.get("address") === null ? undefined : formData.get("address"),
        }

        // Partial schema for updates
        const UpdateSchema = StudentSchema.extend({
            address: z.string().optional(),
            // Remove totalFee/course from here if not updating them
        }).partial()

        const data = UpdateSchema.parse(rowData)

        // Check if name changed to trigger R2 folder rename
        const currentStudent = await db.student.findUnique({
            where: { id },
            include: { documents: true } // Fetch docs to find old folder path
        });

        if (currentStudent && data.fullName && currentStudent.fullName !== data.fullName) {
            const newSafeName = slugify(data.fullName);
            const newFolder = `students/${newSafeName}`;

            // Try to determine old folder from existing documents
            let oldFolder = `students/${slugify(currentStudent.fullName)}`; // Default fall back
            if (currentStudent.documents.length > 0) {
                // Extract folder from first document URL
                // Example: https://.../students/ya__z_ada_umur/file.pdf
                // We want: students/ya__z_ada_umur
                const firstDoc = currentStudent.documents[0];
                const parts = firstDoc.fileUrl.split('/');
                const studentIndex = parts.indexOf('students');
                if (studentIndex !== -1 && parts[studentIndex + 1]) {
                    oldFolder = `students/${parts[studentIndex + 1]}`;
                }
            }

            if (oldFolder !== newFolder) {
                await renameFolderInR2(oldFolder, newFolder);

                // Update DB document URLs
                // Refetch to be safe or use included docs
                const docs = currentStudent.documents;
                for (const doc of docs) {
                    if (doc.fileUrl.includes(oldFolder)) {
                        const newUrl = doc.fileUrl.replace(oldFolder, newFolder);
                        await db.studentDocument.update({
                            where: { id: doc.id },
                            data: { fileUrl: newUrl }
                        });
                    }
                }
            }
        }

        await db.student.update({
            where: { id },
            data: {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.email !== undefined && { email: data.email || null }),
                ...(data.phone !== undefined && { phone: data.phone || null }),
                ...(data.address !== undefined && { address: data.address || null }),
            }
        })

        revalidatePath(`/admin/students/${id}`)
        return { success: true, message: "Profile updated successfully" }
    } catch (error: any) {
        console.error("Update match error", error)
        return { success: false, message: "Failed to update profile: " + (error.message || String(error)) }
    }
}

export async function deleteStudent(id: string) {
    try {
        // 1. Fetch all documents for this student to clean up R2
        const docs = await db.studentDocument.findMany({
            where: { studentId: id }
        });

        // 2. Parallel delete from R2
        await Promise.all(
            docs.map(doc => deleteFileFromR2(doc.fileUrl))
        );

        // 3. Delete student (Cascade deletes document records in DB)
        await db.student.delete({ where: { id } })

        revalidatePath("/admin/students")
        return { success: true }
    } catch (error) {
        console.error("Delete Student Error:", error)
        return { success: false, message: "Failed to delete student" }
    }
}
