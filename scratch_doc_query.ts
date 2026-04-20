import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const doc = await prisma.studentDocument.findFirst({
        where: {
            title: {
                contains: "Marshall Island"
            }
        }
    });
    console.log(JSON.stringify(doc, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
