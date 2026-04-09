import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
    console.log(await prisma.studentCertificate.findMany({
        where: { certificateType: "stcw-basic-safety-group" }
    }));
} 
main().finally(() => prisma.$disconnect());
