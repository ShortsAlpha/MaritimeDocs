
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const newStudent = await prisma.student.create({
            data: {
                fullName: "Unassigned Student Test",
                studentNumber: "99999",
                email: "unassigned@test.com",
                status: "REGISTERED"
            }
        })
        console.log(`Created student: ${newStudent.fullName} (${newStudent.id})`)
    } catch (e) {
        console.error("Error creating student:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
