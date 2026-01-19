'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteFileFromR2, renameFolderInR2 } from "@/lib/r2"
import { slugify } from "@/lib/utils"

// ... existing code ...
import { StudentStatus } from "@prisma/client"

const StudentSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    course: z.string().optional(),
    totalFee: z.coerce.number().min(0, "Fee must be positive"),
    status: z.nativeEnum(StudentStatus).optional(),
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
            status: formData.get("status") === null ? undefined : formData.get("status"),
        }

        // Partial schema for updates
        const UpdateSchema = StudentSchema.extend({
            address: z.string().optional(),
            // Remove totalFee/course from here if not updating them
        }).partial()

        const data = UpdateSchema.parse(rowData)

        // ... existing R2 rename logic ...
        // (Keeping R2 logic unchanged)

        // ... (R2 rename implementation omitted for brevity in snippet, assumes it is preserved by tool or user context)
        // RE-INSERTING R2 LOGIC TO BE SAFE IF REPLACING WHOLE BLOCK

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
                ...(data.status && { status: data.status }),
            }
        })

        revalidatePath(`/admin/students/${id}`)
        return { success: true, message: "Profile updated successfully" }
    } catch (error: any) {
        console.error("Update match error", error)
        return { success: false, message: "Failed to update profile: " + (error.message || String(error)) }
    }
}
// ... existing deleteStudent ...
// ... existing code ...

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

export async function fixStudentFolder(id: string) {
    try {
        const student = await db.student.findUnique({
            where: { id },
            include: { documents: true }
        })

        if (!student) throw new Error("Student not found")

        // 1. Calculate Expected Path (Clean Slug)
        const safeName = slugify(student.fullName)
        const targetFolder = `students/${safeName}`

        // 2. Calculate "Broken" Path (Old Regex used previously)
        // Previous bad logic: trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const brokenName = student.fullName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const brokenFolder = `students/${brokenName}`

        console.log(`Fix Attempt for ${student.fullName}: Broken=${brokenFolder} -> Target=${targetFolder}`)

        if (brokenFolder === targetFolder) {
            return { success: false, message: "Folder names match, no fix needed (or manually check R2)" }
        }

        // 3. Rename/Move files from Broken to Target
        const success = await renameFolderInR2(brokenFolder, targetFolder)

        if (success) {
            // 4. Update DB references to point to Target
            for (const doc of student.documents) {
                // If doc URL contains broken folder, update it
                if (doc.fileUrl.includes(brokenFolder)) {
                    const newUrl = doc.fileUrl.replace(brokenFolder, targetFolder)
                    await db.studentDocument.update({
                        where: { id: doc.id },
                        data: { fileUrl: newUrl }
                    })
                }
                // OR if doc URL ALREADY points to target (but files were missing),
                // we don't need to change URL, just the file move above fixed it.
            }
            revalidatePath(`/admin/students/${id}`)
            return { success: true, message: "Folders resynced successfully" }
        } else {
            return { success: false, message: "Could not move files (Folders empty or R2 error)" }
        }

    } catch (error: any) {
        console.error("Fix Folder Error:", error)
        return { success: false, message: error.message }
    }
}
