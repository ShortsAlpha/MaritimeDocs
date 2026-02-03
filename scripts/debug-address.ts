
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const students = await prisma.student.findMany({
        take: 5,
        select: { fullName: true, address: true }
    });
    console.log('--- Student Addresses ---');
    students.forEach(s => {
        console.log(`Name: ${s.fullName}, Address: "${s.address}"`);
    });
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
