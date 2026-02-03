import { PrismaClient, StudentStatus, FeedbackSource, RecommendStatus } from '@prisma/client'
import { config } from 'dotenv'

config()
const prisma = new PrismaClient()

// --- Data Arrays ---

const NAMES = [
    "Mehmet Yılmaz", "John Doe", "Hans Müller", "Pierre Dupont", "Marco Rossi",
    "Sofia Garcia", "Ivan Petrov", "Lotte Visser", "Jane Smith", "Michael Connor",
    "Ahmet Demir", "Ayşe Kaya", "Fatma Çelik", "Mustafa Şahin", "Zeynep Yıldız"
];

const COUNTRIES = ["Turkey", "United Kingdom", "Germany", "France", "Italy", "Spain", "Russia", "Netherlands", "United States", "Canada"];

const COURSE_NAMES = [
    "STCW BASIC SAFETY TRAINING CERTIFICATE",
    "SUPERYACHT DECK CREW",
    "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED",
    "PROFESSIONAL SUPERYACHT HOSPITALITY",
    "MARINE COMMUNICATIONS (VHF-SRC)",
    "ACCREDITED ENGINE-RATING COURSE (AEC)",
    "PROFESSIONAL SUPERYACHT CHEF",
    "MASTER OF YACHTS 200 GT COASTAL / MATE",
    "MASTER OF YACHTS 200 GT LIMITED",
    "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)"
];

const INTAKE_NAMES = [
    "January 2026", "February 2026", "March 2026", "April 2026"
];

const FEEDBACK_COMMENTS = [
    "Excellent course, highly recommended!",
    "Instructors were very professional.",
    "Facilities were great but food could be better.",
    "I learned a lot, thank you Xone.",
    "The simulator training was realistic.",
    "A bit intense schedule but worth it.",
    "The admin team was very helpful during registration.",
    "Bes maritime academy in the region.",
];

const DOC_TYPES = [
    "Passport",
    "Seaman's Book",
    "Medical Fitness Certificate (Eng1)",
    "STCW Basic Safety Training",
    "Yellow Fever Vaccination",
    "Discharge Book",
    "Visa"
];

// --- Helpers ---

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

function randomEnum<T>(obj: T): T[keyof T] {
    const values = Object.values(obj as any);
    return values[Math.floor(Math.random() * values.length)] as T[keyof T];
}

// --- Main ---

async function main() {
    console.log('🌱 Starting reseed (v2 - New Schema Compatible)...')

    // 1. Clean Database
    console.log('Cleaning up...');
    await prisma.feedback.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.studentDocument.deleteMany();
    await prisma.student.deleteMany();
    await prisma.intake.deleteMany();
    await prisma.course.deleteMany();
    await prisma.documentType.deleteMany();

    // 2. Create Courses
    console.log('Creating Courses...');
    const courseObjs = [];
    for (const title of COURSE_NAMES) {
        courseObjs.push(await prisma.course.create({ data: { title } }));
    }

    // 3. Create Intakes
    console.log('Creating Intakes...');
    const intakeObjs = [];
    for (const name of INTAKE_NAMES) {
        intakeObjs.push(await prisma.intake.create({
            data: {
                name,
                startDate: new Date(), // Just placeholder
                status: 'ACTIVE'
            }
        }));
    }

    // 4. Create Document Types
    console.log('Creating Document Types...');
    for (const type of DOC_TYPES) {
        await prisma.documentType.create({ data: { title: type } });
    }

    // 5. Create Students
    console.log(`Creating ${NAMES.length} Students...`);

    for (let i = 0; i < NAMES.length; i++) {
        const course = randomElement(courseObjs);
        const intake = randomElement(intakeObjs);
        const status = randomEnum(StudentStatus);
        const totalFee = randomInt(15, 40) * 100;

        const student = await prisma.student.create({
            data: {
                fullName: NAMES[i],
                email: `student${i + 1}.${Date.now()}@example.com`,
                phone: `+90 555 ${100 + i} 00 00`,
                studentNumber: `26${randomInt(1000, 9999)}`, // 26XXXX format
                nationality: randomElement(COUNTRIES),
                status: status,
                course: course.title, // Store snapshot
                intakeId: intake.id,
                totalFee: totalFee,
                address: "Sample Address No: " + (i + 1),
                dateOfBirth: new Date(1990 + randomInt(0, 15), randomInt(0, 11), randomInt(1, 28))
            }
        });

        // 5. Add Feedbacks (if status is advanced)
        if (['COURSE_COMPLETED', 'CERTIFICATE_APPLIED', 'CERTIFICATE_SHIPPED'].includes(status) || Math.random() > 0.7) {
            await prisma.feedback.create({
                data: {
                    studentId: student.id,
                    source: randomEnum(FeedbackSource),

                    // Detailed Ratings (1-5)
                    registrationProcess: randomInt(3, 5),
                    practicalStandards: randomInt(4, 5),
                    courseMaterials: randomInt(3, 5),
                    courseContent: randomInt(4, 5),
                    instructorEffectiveness: randomInt(4, 5),
                    overallImpression: randomInt(3, 5),
                    staffFriendliness: randomInt(4, 5),
                    learningEffectiveness: randomInt(4, 5),

                    recommend: randomEnum(RecommendStatus),
                    comment: randomElement(FEEDBACK_COMMENTS),
                    courseAttended: course.title
                }
            });
        }
    }

    console.log('✅ Reseeding complete with new Schema!');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
