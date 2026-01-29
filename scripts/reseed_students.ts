import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting reseed...')

    // Delete ALL students
    await prisma.feedback.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.studentDocument.deleteMany({});
    await prisma.student.deleteMany({});
    console.log('Deleted all students');

    // Create exactly 10 students with random data
    const names = [
        "Mehmet Yılmaz", "John Doe", "Hans Müller", "Pierre Dupont", "Marco Rossi",
        "Sofia Garcia", "Ivan Petrov", "Lotte Visser", "Jane Smith", "Michael Connor"
    ];

    const countries = ["Turkey", "United Kingdom", "Germany", "France", "Italy", "Spain", "Russia", "Netherlands", "United States", "Canada"];

    const statuses = [
        "REGISTERED", "DOCS_REQ_SENT", "LECTURE_NOTES_SENT", "PAYMENT_COMPLETED",
        "COURSE_ONGOING", "COURSE_COMPLETED", "CERTIFICATE_APPLIED", "CERTIFICATE_SHIPPED"
    ];

    const courses = ["General Maritime", "STCW Basic Training", "Advanced Navigation", "Ship Management", "Port Operations"];

    for (let i = 0; i < 10; i++) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as any;
        const randomCourse = courses[Math.floor(Math.random() * courses.length)];
        const totalFee = Math.floor(Math.random() * 3000) + 2000;

        // Random date of birth (18-50 years old)
        const age = Math.floor(Math.random() * 32) + 18;
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - age);
        dob.setMonth(Math.floor(Math.random() * 12));
        dob.setDate(Math.floor(Math.random() * 28) + 1);

        const student = await prisma.student.create({
            data: {
                fullName: names[i],
                email: `student${i + 1}.${Date.now()}@example.com`,
                phone: `+90 555 ${100 + i}00 0000`,
                nationality: countries[i],
                status: randomStatus,
                course: randomCourse,
                totalFee: totalFee,
                dateOfBirth: dob,
                address: `Address ${i + 1}`
            }
        });
        console.log(`Created: ${student.fullName} - ${randomStatus} - ${randomCourse}`);

        // Random payment (for balance calculation)
        if (Math.random() > 0.3) {
            const paymentAmount = Math.floor(Math.random() * totalFee * 0.7);
            await prisma.payment.create({
                data: {
                    studentId: student.id,
                    amount: paymentAmount,
                    method: "BANK_TRANSFER",
                    note: "Partial payment"
                }
            });
        }

        // Random feedback (for some students)
        if (Math.random() > 0.5) {
            await prisma.feedback.create({
                data: {
                    studentId: student.id,
                    courseRating: Math.floor(Math.random() * 2) + 4,
                    instructorRating: Math.floor(Math.random() * 2) + 4,
                    recommend: Math.random() > 0.2,
                    comment: "Great course experience!"
                }
            });
        }
    }

    console.log('✅ Created 10 students with random data!');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
