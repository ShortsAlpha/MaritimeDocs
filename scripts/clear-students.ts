import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Deleting all students...")
    try {
        const result = await prisma.student.deleteMany({})
        console.log(`Deleted ${result.count} students.`)
    } catch (error) {
        console.error("Error deleting students:", error)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
