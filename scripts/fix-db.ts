
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('Fixing student statuses...')
    // Update all students to REGISTERED to avoid enum conflict
    // We use updateMany. 
    // Note: If 'REGISTERED' was removed, we'd have a problem. But it was kept.
    try {
        await db.student.updateMany({
            data: {
                status: 'REGISTERED'
            }
        })
        console.log('All students set to REGISTERED.')
    } catch (e) {
        console.error(e)
    }
}

main()
    .then(async () => {
        await db.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await db.$disconnect()
        process.exit(1)
    })
