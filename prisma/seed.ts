import { PrismaClient, StudentStatus, PaymentMethod } from '@prisma/client'

const prisma = new PrismaClient()

// --- Random Data ---

const FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
    "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Ahmet", "Mehmet", "Ayse", "Fatma", "Mustafa", "Zeynep", "Yusuf", "Elif", "Can", "Cem"
];

const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Yilmaz", "Kaya", "Demir", "Sahin", "Celik", "Yildiz", "Ozturk", "Aydin", "Ozdemir", "Arslan"
];

const COUNTRIES = [
    "United Kingdom", "United States", "Germany", "France", "Netherlands", "Spain", "Italy", "Turkey",
    "Greece", "Malta", "Russia", "Ukraine", "Poland", "Romania", "Norway", "Sweden", "South Africa",
    "Australia", "New Zealand", "Canada"
];

const FEEDBACK_COMMENTS = [
    "Excellent course, learned a lot!",
    "Instructor was very knowledgeable.",
    "Good content but pace was a bit fast.",
    "Facilities were top notch.",
    "Would recommend to a friend.",
    "The practical exercises were very helpful.",
    "Administrative support was great.",
    "Looking forward to the next level.",
    "A bit expensive but worth it.",
    "Certificate delivery was fast."
];

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
    "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025"
];

// --- Helpers ---

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// --- Main ---

async function main() {
    console.log('🌱 Starting realistic seed...')

    // 1. Clean Database
    console.log('Cleaning up...');
    await prisma.feedback.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.studentDocument.deleteMany();
    await prisma.student.deleteMany();
    await prisma.intake.deleteMany();
    await prisma.course.deleteMany();
    await prisma.documentType.deleteMany(); // Optional, if we want to reset types too

    // 2. Create Basics
    console.log('Creating Courses...');
    const courseObjs = await Promise.all(COURSE_NAMES.map(title =>
        prisma.course.create({ data: { title } })
    ));

    console.log('Creating Intakes...');
    // Create one intake per month for first half of 2025
    const intakes = [];
    for (let i = 0; i < INTAKE_NAMES.length; i++) {
        intakes.push(await prisma.intake.create({
            data: {
                name: INTAKE_NAMES[i],
                startDate: new Date(2025, i, 1), // Jan 1, Feb 1, etc.
                status: 'ACTIVE'
            }
        }));
    }

    // 3. Create Students
    console.log('Creating 40 Students...');

    for (let i = 0; i < 40; i++) {
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@example.com`;

        // Random Status
        const statuses = Object.values(StudentStatus);
        const status = randomElement(statuses);

        // Random Intake & Course
        const intake = randomElement(intakes);
        const course = randomElement(courseObjs);
        const country = randomElement(COUNTRIES);

        // Financials
        const totalFee = randomInt(15, 50) * 100; // 1500 to 5000 EUR
        let paidAmount = 0;

        // Determine paid amount based on status logic (roughly)
        if (status === 'REGISTERED') {
            paidAmount = Math.random() > 0.5 ? 0 : randomInt(0, 500); // None or deposit
        } else if (status === 'PAYMENT_COMPLETED' || status === 'CERTIFICATE_SHIPPED' || status === 'COURSE_COMPLETED') {
            paidAmount = totalFee;
        } else {
            // Random amount between 0 and totalFee
            paidAmount = randomInt(0, totalFee);
        }

        // Dates for certificate
        let certIssueDate = null;
        let certExpiryDate = null;
        if (['CERTIFICATE_SHIPPED', 'CERTIFICATE_APPLIED', 'COURSE_COMPLETED'].includes(status)) {
            certIssueDate = randomDate(new Date(2025, 0, 1), new Date()); // Issue sometime this year
            certExpiryDate = new Date(certIssueDate);
            certExpiryDate.setFullYear(certExpiryDate.getFullYear() + 5); // 5 year validity
        }

        // Create Student
        const student = await prisma.student.create({
            data: {
                studentNumber: `25${randomInt(1000, 9999)}`, // 25XXXX
                fullName,
                email,
                phone: `+${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
                nationality: country,
                address: `${randomInt(1, 999)} Some Street, Some City`,
                course: course.title,
                status: status,
                totalFee: totalFee,
                intakeId: intake.id,
                certificateIssueDate: certIssueDate,
                certificateExpiryDate: certExpiryDate
            }
        });

        // Add Payments
        if (paidAmount > 0) {
            // Split into 1 or 2 payments
            if (paidAmount === totalFee && Math.random() > 0.5) {
                // 2 payments
                const p1 = Math.floor(paidAmount / 2);
                const p2 = paidAmount - p1;
                await prisma.payment.createMany({
                    data: [
                        { studentId: student.id, amount: p1, method: 'BANK_TRANSFER', note: 'First Installment' },
                        { studentId: student.id, amount: p2, method: 'CASH', note: 'Final Payment' }
                    ]
                });
            } else {
                // 1 payment
                await prisma.payment.create({
                    data: {
                        studentId: student.id,
                        amount: paidAmount,
                        method: 'CREDIT_CARD',
                        note: paidAmount === totalFee ? 'Full Payment' : 'Partial Payment'
                    }
                });
            }
        }

        // Add Feedback (randomly for advanced statuses)
        if (['COURSE_COMPLETED', 'CERTIFICATE_APPLIED', 'CERTIFICATE_SHIPPED'].includes(status) && Math.random() > 0.3) {
            await prisma.feedback.create({
                data: {
                    studentId: student.id,
                    courseRating: randomInt(3, 5),
                    instructorRating: randomInt(3, 5),
                    recommend: Math.random() > 0.2,
                    comment: randomElement(FEEDBACK_COMMENTS)
                }
            });
        }
    }

    console.log('✅ Realistic seed complete!');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
