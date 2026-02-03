'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteFileFromR2, renameFolderInR2 } from "@/lib/r2"
import { slugify } from "@/lib/utils"
import { addMonths } from "date-fns"

// ... existing code ...
import { StudentStatus } from "@prisma/client"

import { currentUser } from "@clerk/nextjs/server"

// Helper to generate student number
async function generateStudentNumber(date = new Date()): Promise<string> {
    const year = date.getFullYear().toString().slice(-2);
    const prefix = year; // "25"

    // Fetch all student numbers starting with this prefix
    const students = await db.student.findMany({
        where: {
            studentNumber: {
                startsWith: prefix
            }
        },
        select: {
            studentNumber: true
        }
    });

    const numbers = students
        .map(s => s.studentNumber ? parseInt(s.studentNumber.slice(2)) : 0) // Extract sequence part
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    // Find the first gap
    let nextSequence = 1;
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] === nextSequence) {
            nextSequence++;
        } else if (numbers[i] > nextSequence) {
            // Found a gap
            break;
        }
    }

    // Format: YY + 4 digit sequence (e.g., 250001)
    return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
}

const StudentSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    course: z.string().optional(),
    totalFee: z.coerce.number().min(0, "Fee must be positive"),
    status: z.nativeEnum(StudentStatus).optional(),
    address: z.string().optional(),
    certificateIssueDate: z.string().optional().or(z.literal("")),
    certificateExpiryDate: z.string().optional().or(z.literal("")),
    nationality: z.string().optional(),
    dateOfBirth: z.string().optional().or(z.literal("")),
    intakeId: z.string().optional(),
})

export async function createStudent(prevState: any, formData: FormData) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const rowData = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            course: formData.get("course"),
            totalFee: formData.get("totalFee"),
            nationality: formData.get("nationality"),
            dateOfBirth: formData.get("dateOfBirth"),
            intakeId: formData.get("intakeId"),
        }

        const data = StudentSchema.parse(rowData)

        // Generate Student Number
        const studentNumber = await generateStudentNumber();

        await db.student.create({
            data: {
                fullName: data.fullName,
                studentNumber: studentNumber,
                email: data.email || null,
                phone: data.phone || null,
                course: data.course || null,
                totalFee: data.totalFee,
                nationality: data.nationality || null,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                intakeId: data.intakeId || null,
            }
        })

        revalidatePath("/admin/students")
        return { success: true, message: "Student created successfully" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Failed to create student" }
    }
}

// Temporary Action to Backfill Numbers
export async function backfillStudentNumbers() {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        // Fetch all students without a number, sorted by creation date
        const studentsWithoutNumber = await db.student.findMany({
            where: { studentNumber: null },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`Found ${studentsWithoutNumber.length} students to backfill.`);

        for (const student of studentsWithoutNumber) {
            const number = await generateStudentNumber(student.createdAt);
            await db.student.update({
                where: { id: student.id },
                data: { studentNumber: number }
            });
            console.log(`Assigned ${number} to ${student.fullName}`);
        }

        return { success: true, count: studentsWithoutNumber.length };
    } catch (error) {
        console.error("Backfill error:", error);
        return { success: false, error };
    }
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
    try {
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

        const rowData = {
            fullName: formData.get("fullName") === null ? undefined : formData.get("fullName"),
            email: formData.get("email") === null ? undefined : formData.get("email"),
            phone: formData.get("phone") === null ? undefined : formData.get("phone"),
            address: formData.get("address") === null ? undefined : formData.get("address"),
            status: formData.get("status") === null ? undefined : formData.get("status"),
            certificateIssueDate: formData.get("certificateIssueDate") === null ? undefined : formData.get("certificateIssueDate"),
            certificateExpiryDate: formData.get("certificateExpiryDate") === null ? undefined : formData.get("certificateExpiryDate"),
            nationality: formData.get("nationality") === null ? undefined : formData.get("nationality"),
            dateOfBirth: formData.get("dateOfBirth") === null ? undefined : formData.get("dateOfBirth"),
            intakeId: formData.get("intakeId") === null ? undefined : formData.get("intakeId"),
        }

        // Partial schema for updates
        const UpdateSchema = StudentSchema.extend({
            address: z.string().optional(),
            // Remove totalFee/course from here if not updating them
        }).partial()

        const data = UpdateSchema.parse(rowData)

        // Fetch current student to check existing data and for R2 logic later
        const currentStudent = await db.student.findUnique({
            where: { id },
            include: { documents: true }
        });

        let additionalData: any = {}
        // Handle manual date updates (string -> Date)
        if (data.certificateIssueDate) {
            additionalData.certificateIssueDate = new Date(data.certificateIssueDate)
        }
        if (data.certificateExpiryDate) {
            additionalData.certificateExpiryDate = new Date(data.certificateExpiryDate)
        }

        const COMPLETED_STATUSES = ["COURSE_COMPLETED", "CERTIFICATE_APPLIED", "CERTIFICATE_SHIPPED"];

        if (data.status && COMPLETED_STATUSES.includes(data.status)) {
            // If status is becoming 'completed' (or later stages)
            // Check if dates are provided in this update OR already exist in DB
            const hasManualDates = data.certificateIssueDate || data.certificateExpiryDate;
            const hasExistingDates = currentStudent?.certificateIssueDate || currentStudent?.certificateExpiryDate;

            if (!hasManualDates && !hasExistingDates) {
                const now = new Date()
                additionalData.certificateIssueDate = now
                additionalData.certificateExpiryDate = addMonths(now, 13) // 1 year 1 month
            }
        }

        if (currentStudent && data.fullName && currentStudent.fullName !== data.fullName) {
            // ... folder rename logic ...
        }

        // RE-IMPORT folder rename logic or keep it if I can match range
        if (currentStudent && data.fullName && currentStudent.fullName !== data.fullName) {
            const newSafeName = slugify(data.fullName);
            const newFolder = `students/${newSafeName}`;

            // Try to determine old folder from existing documents
            let oldFolder = `students/${slugify(currentStudent.fullName)}`; // Default fall back
            if (currentStudent.documents.length > 0) {
                // Extract folder from first document URL
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
                ...(data.nationality !== undefined && { nationality: data.nationality || null }),
                ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
                ...(data.intakeId !== undefined && { intakeId: data.intakeId || null }),
                ...additionalData
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
        const user = await currentUser()
        if (!user) return { success: false, message: "Unauthorized" }

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
