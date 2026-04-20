import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.studentDocument.findMany({
        where: { title: { contains: "Marshall Island" } },
        select: { id: true, title: true, fileUrl: true, studentId: true }
    });

    console.log("Documents matching Marshall Island:");
    docs.forEach(d => console.log(JSON.stringify(d, null, 2)));

    if (docs.length > 0) {
        const studentId = docs[0].studentId;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { fullName: true }
        });
        console.log("Student Name:", student?.fullName);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
