import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const events = await prisma.courseEvent.findMany({
        where: { title: 'test' },
        include: { checklist: true }
    });
    console.log(JSON.stringify(events, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
