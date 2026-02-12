
import { PrismaClient, DocCategory } from "@prisma/client"

const prisma = new PrismaClient()

const requiredDocs = [
    { title: "Passport Copy", category: DocCategory.STUDENT, isRequired: true },
    { title: "Medical Certificate", category: DocCategory.MEDICAL, isRequired: true },
    { title: "Seaman's Book", category: DocCategory.STUDENT, isRequired: true },
    { title: "STCW Basic Safety Training", category: DocCategory.CERTIFICATE, isRequired: true },
    { title: "Passport Photo", category: DocCategory.STUDENT, isRequired: true },
]

async function main() {
    console.log("Seeding Document Types...")

    for (const doc of requiredDocs) {
        const existing = await prisma.documentType.findFirst({
            where: { title: doc.title }
        })

        if (!existing) {
            await prisma.documentType.create({
                data: {
                    title: doc.title,
                    category: doc.category,
                    isRequired: doc.isRequired,
                    description: `Standard required document: ${doc.title}`
                }
            })
            console.log(`Created: ${doc.title}`)
        } else {
            // Ensure it is marked as required if it already exists
            if (!existing.isRequired) {
                await prisma.documentType.update({
                    where: { id: existing.id },
                    data: { isRequired: true }
                })
                console.log(`Updated to Required: ${doc.title}`)
            } else {
                console.log(`Exists (Skipped): ${doc.title}`)
            }
        }
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
