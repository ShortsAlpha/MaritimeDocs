
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const docs = [
        { title: "Candidate Registration", category: "OFFICE" },
        { title: "Training Agreement", category: "OFFICE" },
        { title: "Seaservice Record", category: "STUDENT" },
        { title: "Signature", category: "STUDENT" }, // Probably "Signature Sample"? User said "Signature"
        { title: "Steering Certificate", category: "CERTIFICATE" }
    ]

    console.log("Seeding OOW 3000GT Document Types...")

    for (const doc of docs) {
        const existing = await db.documentType.findFirst({
            where: { title: { equals: doc.title, mode: 'insensitive' } }
        })

        if (!existing) {
            await db.documentType.create({
                data: {
                    title: doc.title,
                    category: doc.category as any,
                    isRequired: false
                }
            })
            console.log(`Created: ${doc.title}`)
        } else {
            console.log(`Already Exists: ${doc.title}`)
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
