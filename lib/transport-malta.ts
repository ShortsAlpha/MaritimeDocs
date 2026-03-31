import { db } from "@/lib/db";
import { addDays, getDay, addYears } from "date-fns";

/**
 * Calculates the next valid working day (Monday - Friday) after a given date.
 */
export function getNextWorkingDay(date: Date): Date {
    let nextDate = addDays(date, 1);
    let dayOfWeek = getDay(nextDate); // 0 = Sunday, 6 = Saturday

    // Keep adding days until we hit a weekday (not Sunday and not Saturday)
    while (dayOfWeek === 0 || dayOfWeek === 6) {
        nextDate = addDays(nextDate, 1);
        dayOfWeek = getDay(nextDate);
    }
    
    return nextDate;
}

/**
 * Generates the TM Certificate Number e.g. "2604-01" based on the Event's start date
 * and the next available sequence number for that event.
 */
export async function getOrGenerateTMCertificateNumber(studentId: string, courseEventId: string, certificateType: string, eventStartDate: Date): Promise<string> {
    
    const existing = await db.studentCertificate.findUnique({
        where: {
            studentId_courseEventId_certificateType: {
                studentId,
                courseEventId,
                certificateType
            }
        }
    });

    if (existing && existing.certificateNo) {
        return existing.certificateNo; 
    }

    const year = eventStartDate.getFullYear().toString().slice(-2);
    const month = (eventStartDate.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${year}${month}`;

    const currentCount = await db.studentCertificate.count({
        where: {
            courseEventId,
            certificateType
        }
    });

    const sequence = (currentCount + 1).toString().padStart(2, '0');
    return `${prefix}-${sequence}`;
}

/**
 * Mutates the `student` object with TM Logic attributes so that the PDF generated
 * automatically picks up TM specific number, issue date and expiry date.
 */
export async function applyTMMetadataToStudent(student: any, course: any, templateId: string) {
    if (templateId !== "stcw-basic-safety") return student; // Only apply TM Logic to STCW

    // 1. Find the Course Event the student is associated with for this Course
    const courseEvent = await db.courseEvent.findFirst({
        where: {
            courseId: course.id,
            students: { some: { id: student.id } }
        },
        orderBy: { startDate: 'desc' }
    });

    if (!courseEvent) {
        // If not assigned to an event, we cannot apply TM rules reliably
        throw new Error(`Transport Malta Error: The student is not enrolled in any Calendar Event for "${course.title}". Start and end dates are required to calculate the TM certificate number (YYMM-XX) and validity dates. Please assign the student to an event schedule first.`);
    }

    // 2. Fetch or Calculate Data
    const issueDate = getNextWorkingDay(courseEvent.endDate);
    const certificateNo = await getOrGenerateTMCertificateNumber(student.id, courseEvent.id, templateId, courseEvent.startDate);
    const expiryDate = addYears(issueDate, 5); // TM rules dictate 5 year validity for STCW pages 1, 2

    // 3. Mutate the memory object (These override the flat fields just for the PDF rendering session)
    student.certificateIssueDate = issueDate;
    student.certificateExpiryDate = expiryDate;
    student.studentNumber = `STCW-${certificateNo}`; // Inject the STCW prefix natively here for the certificate

    // We also attach `courseEventId` invisibly so saveGeneratedDocument can pick it up and save the DB record
    student.__courseEventId = courseEvent.id;

    return student;
}

