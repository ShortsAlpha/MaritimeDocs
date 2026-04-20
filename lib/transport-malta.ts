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
const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'Y', 'U', 'L', 'G', 'S', 'O', 'N', 'D']; // Fallback letters

export async function applyTMMetadataToStudent(student: any, course: any, templateId: string) {
    if (templateId !== "stcw-basic-safety") return student; // Specific logic branch for STCW

    // 1. Find the Course Event (Optional now)
    const courseEvent = await db.courseEvent.findFirst({
        where: {
            courseId: course.id,
            students: { some: { id: student.id } }
        },
        orderBy: { startDate: 'desc' }
    });

    // Determine base date. We pull it from the Event if they are in one, 
    // otherwise we use the student's typed issue date. If both are missing, we throw an error.
    let baseDate: Date;
    if (student.certificateIssueDate) {
        baseDate = new Date(student.certificateIssueDate);
    } else if (courseEvent) {
        baseDate = getNextWorkingDay(courseEvent.endDate);
    } else {
        throw new Error("Cannot calculate certificate limits: Student must either have a 'Certificate Issue Date' saved in their profile or be enrolled in a Calendar Event.");
    }

    const issueDate = baseDate;

    // Check if we already have a generated sequence for this student + event
    let suffix = "";
    const certificateType = "stcw-basic-safety-group"; // Logical grouping type

    // The grouping event ID. If no event exists, we use a generic placeholder like "no-event"
    // so the database unique constraints don't crash when passing null.
    const effectiveEventId = courseEvent ? courseEvent.id : "no-event";

    const existing = await db.studentCertificate.findUnique({
        where: {
            studentId_courseEventId_certificateType: {
                studentId: student.id,
                courseEventId: effectiveEventId,
                certificateType
            }
        }
    });

    if (existing && existing.certificateNo) {
        suffix = existing.certificateNo;
    } else {
        const year = baseDate.getFullYear().toString().slice(-2);
        const monthLetter = "M"; // Hardcoded for now based on user request
        const prefixMatch = `${monthLetter}${year}`;

        // Find total STCW certificates generated so far for this month/year combo
        const currentCount = await db.studentCertificate.count({
            where: {
                certificateType,
                certificateNo: {
                    startsWith: prefixMatch
                }
            }
        });

        const sequence = (currentCount + 1).toString().padStart(4, '0');
        suffix = `${prefixMatch}${sequence}`; // E.g. "M260001"
    }

    const expiryDate = student.certificateExpiryDate ? new Date(student.certificateExpiryDate) : addYears(issueDate, 5); // 5 year validity

    // 3. Mutate the memory object
    student.certificateIssueDate = issueDate;
    student.certificateExpiryDate = expiryDate;

    // Pass just the suffix (e.g. M260001). The pdf-filler will prepend PST-, FF- per page.
    student.studentNumber = suffix;

    // We also attach courseEventId invisibly so saveGeneratedDocument can pick it up
    student.__courseEventId = effectiveEventId;
    // Inject custom cert type so the upsert logic uses our grouping
    student.__certificateType = certificateType;

    return student;
}

