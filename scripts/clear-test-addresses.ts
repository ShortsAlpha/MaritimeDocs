
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Clearing test addresses...');

    const result = await prisma.student.updateMany({
        where: {
            address: {
                contains: 'Some Street'
            }
        },
        data: {
            address: null
        }
    });

    console.log(`✅ Cleared addresses for ${result.count} students.`);
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
