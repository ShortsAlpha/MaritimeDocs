import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const course = await prisma.course.findFirst({
        where: { title: { contains: 'OOW' } },
        select: { title: true, checklistTemplate: true }
    });
    console.log(JSON.stringify(course, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
