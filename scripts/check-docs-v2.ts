
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const docTypes = await db.documentType.findMany()
    console.log("Existing Document Types:", docTypes.map(d => d.title))

    const courses = await db.course.findMany()
    console.log("Existing Courses:", courses.map(c => c.title))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
