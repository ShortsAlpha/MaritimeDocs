
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const docTypes = await prisma.documentType.findMany()
    console.log("Current Document Types:")
    docTypes.forEach(dt => {
        console.log(`- [${dt.category}] ${dt.title} (Required: ${dt.isRequired})`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
