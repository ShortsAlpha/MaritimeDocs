import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Good Document:");
    const goodDoc = await prisma.studentDocument.findFirst({
        where: { NOT: { fileUrl: { contains: "kavindu" } } }
    });
    console.log(JSON.stringify(goodDoc, null, 2));

    console.log("\nRecent Document (Uploaded by App):");
    const appDoc = await prisma.studentDocument.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(appDoc, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
