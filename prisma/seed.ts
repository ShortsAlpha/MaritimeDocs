import { PrismaClient, DocCategory, PaymentMethod } from '@prisma/client'
import { config } from 'dotenv'

config() // Load env vars

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Cleanup
    await prisma.payment.deleteMany()
    await prisma.studentDocument.deleteMany()
    await prisma.documentType.deleteMany()
    await prisma.student.deleteMany()
    await prisma.course.deleteMany()

    // 0. Create Courses
    console.log('Creating courses...')
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
        "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)",
        "MASTER OF YACHTS 200 GT UNLIMITED",
        "OOW ON YACHTS LESS THAN 3000GT",
        "MASTER OF YACHTS 500 GT / CHIEF MATE 3000 GT",
        "PROFICIENCY IN ADVANCED FIRE FIGHTING",
        "MEDICAL FIRST AID",
        "PROFICIENCY IN MEDICAL CARE",
        "PROFICIENCY IN SURVIVAL CRAFT AND RESCUE BOATS",
        "LEADERSHIP AND TEAMWORK (HELM Operational Level)",
        "LEADERSHIP AND MANAGERIAL SKILLS (MANAGEMENT LEVEL)",
        "ECDIS - ELECTRONIC CHART DISPLAY AND INFORMATION SYSTEM",
        "RADAR / ARPA (OPERATIONAL LEVEL)",
        "RADAR / ARPA (MANAGEMENT LEVEL)",
        "GMDSS GENERAL OPERATORS CERTIFICATE (GOC) CoC",
        "EFFICIENT DECK HAND COURSE",
        "IYT INSTRUCTOR TRAINING PROGRAMME",
        "PERSONAL WATERCRAFT OPERATOR ( PWC )",
        "INTERNATIONAL BAREBOAT SKIPPER POWER / SAIL",
        "NTERNATIONAL BAREBOAT SKIPPER SAIL / CATAMARAN",
        "INTERNATIONAL CERTIFICATE OF COMPETENCY COURSE",
        "INTERNATIONAL FLOTILLA SKIPPER",
        "INTERNATIONAL FLOTILLA SKIPPER SAIL / CATAMARAN",
        "YACHT MASTER COASTAL POWER / SAIL",
        "YACHT MASTER COASTAL SAIL / CATAMARAN",
        "YACHT MASTER OCEAN",
        "YACHT MASTER OFFSHORE POWER / SAIL",
        "YACHT MASTER OFFSHORE SAIL / CATAMARAN",
        "PROFICIENCY IN MARITIME SECURITY AWARENESS"
    ];

    await prisma.course.createMany({
        data: COURSE_NAMES.map(title => ({ title }))
    })

    // 1. Create Document Types
    console.log('Creating document types...')
    const docTypes = await Promise.all([
        // Student Docs
        prisma.documentType.create({
            data: { title: 'Passport Copy', category: 'STUDENT', isRequired: true }
        }),
        prisma.documentType.create({
            data: { title: 'Seaman Book', category: 'STUDENT', isRequired: true }
        }),
        prisma.documentType.create({
            data: { title: 'Medical Certificate', category: 'STUDENT', isRequired: true }
        }),

        // Office Docs
        prisma.documentType.create({
            data: { title: 'Training Contract', category: 'OFFICE', isRequired: true }
        }),
        prisma.documentType.create({
            data: { title: 'Payment Plan Agreement', category: 'OFFICE', isRequired: true }
        }),
        prisma.documentType.create({
            data: { title: 'Internship Form', category: 'OFFICE', isRequired: false }
        }),
    ])

    // 2. Create Students
    console.log('Creating students...')
    const student1 = await prisma.student.create({
        data: {
            fullName: 'Ahmet Yilmaz',
            email: 'ahmet@example.com',
            phone: '+90 555 123 4567',
            totalFee: 5000, // 5000 EUR
            course: 'STCW BASIC SAFETY TRAINING CERTIFICATE'
        }
    })

    const student2 = await prisma.student.create({
        data: {
            fullName: 'Ayse Demir',
            email: 'ayse@example.com',
            phone: '+90 555 987 6543',
            totalFee: 4500, // 4500 EUR
            course: 'MEDICAL FIRST AID'
        }
    })

    const student3 = await prisma.student.create({
        data: {
            fullName: 'Mehmet Ozturk',
            email: 'mehmet@example.com',
            phone: '+90 532 111 2233',
            totalFee: 3500,
            course: 'GMDSS GENERAL OPERATORS CERTIFICATE (GOC) CoC'
        }
    })

    // 3. Create Payments
    console.log('Creating payments...')
    await prisma.payment.create({
        data: {
            studentId: student1.id,
            amount: 1000,
            method: 'CASH',
            note: 'Down payment'
        }
    })

    await prisma.payment.create({
        data: {
            studentId: student1.id,
            amount: 1500,
            method: 'BANK_TRANSFER',
            note: 'Installment 1'
        }
    })

    // Ayse has no payments yet

    // 4. Create 10 Random English Students
    console.log('Creating 10 English students...')
    const englishNames = [
        "John Smith", "Emily Johnson", "Michael Brown", "Sarah Davis", "David Wilson",
        "Jessica Taylor", "James Anderson", "Jennifer Thomas", "Robert Jackson", "Lisa White"
    ];

    for (const name of englishNames) {
        const randomCourse = COURSE_NAMES[Math.floor(Math.random() * COURSE_NAMES.length)];
        const fee = Math.floor(Math.random() * 5000) + 2000; // Random fee 2000-7000

        const student = await prisma.student.create({
            data: {
                fullName: name,
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                phone: `+44 ${Math.floor(Math.random() * 7000000000) + 7000000000}`,
                totalFee: fee,
                course: randomCourse
            }
        });

        // Add random payment
        if (Math.random() > 0.3) {
            await prisma.payment.create({
                data: {
                    studentId: student.id,
                    amount: Math.floor(fee * 0.3), // 30% down payment
                    method: 'BANK_TRANSFER',
                    note: 'Down payment'
                }
            });
        }
    }

    console.log('✅ Seed complete!')
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
