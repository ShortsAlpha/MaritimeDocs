import { PrismaClient, DocCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Restoring document types...');

    const docTypes = [
        // Student Docs
        { title: 'Passport Copy', category: 'STUDENT', isRequired: true },
        { title: 'Seaman Book', category: 'STUDENT', isRequired: true },
        { title: 'Medical Certificate', category: 'STUDENT', isRequired: true },

        // Office Docs
        { title: 'Training Contract', category: 'OFFICE', isRequired: true },
        { title: 'Payment Plan Agreement', category: 'OFFICE', isRequired: true },
        { title: 'Internship Form', category: 'OFFICE', isRequired: false },

        // Instructor
        { title: 'CV / Resume', category: 'INSTRUCTOR', isRequired: true },
        { title: 'Teaching Certificate', category: 'INSTRUCTOR', isRequired: true },
    ];

    for (const dt of docTypes) {
        // Upsert based on title to avoid duplicates
        // Note: Schema doesn't enforce unique title, but usually valid for doc types
        // We'll search first to be safe or use findFirst

        const existing = await prisma.documentType.findFirst({
            where: { title: dt.title }
        });

        if (!existing) {
            await prisma.documentType.create({
                data: {
                    title: dt.title,
                    category: dt.category as DocCategory,
                    isRequired: dt.isRequired
                }
            });
            console.log(`+ Created: ${dt.title}`);
        } else {
            console.log(`= Exists: ${dt.title}`);
        }
    }

    console.log('✅ Document Types Restored.');
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
