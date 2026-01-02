import { PrismaClient, DocCategory, PaymentMethod } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config() // Load env vars

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Starting seed...')

    // Cleanup
    await prisma.payment.deleteMany()
    await prisma.studentDocument.deleteMany()
    await prisma.documentType.deleteMany()
    await prisma.student.deleteMany()

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
        }
    })

    const student2 = await prisma.student.create({
        data: {
            fullName: 'Ayse Demir',
            email: 'ayse@example.com',
            phone: '+90 555 987 6543',
            totalFee: 4500, // 4500 EUR
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
