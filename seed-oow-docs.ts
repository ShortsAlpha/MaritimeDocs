import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const courseTitle = "OOW on Yachts less than 3000gt";
  
  // Find course
  let course = await prisma.course.findFirst({
    where: { 
        title: {
            contains: "OOW",
            mode: "insensitive"
        }
    }
  });
  
  if (!course) {
    console.log("Course not found. Creating it...");
    course = await prisma.course.create({
      data: {
        title: "OOW ON YACHTS LESS THAN 3000GT",
        titleTr: "3000 GT ALTINDA YATLARDA VARDIYA ZABİTİ"
      }
    });
  } else {
    console.log(`Found course: ${course.title}`);
  }

  const docs = [
    { title: "Passport", description: null },
    { title: "Candidate Registration Form", description: null },
    { title: "Training Agreement", description: null },
    { title: "Medical", description: null },
    { title: "Seaservice", description: null },
    { title: "Color photograph of seafarer", description: "The image must show a full face, without dark eyewear and with a white background." },
    { title: "Signature of seafarer", description: "The signature must be written with black ink and on a white background." },
    { title: "Steering Certificate", description: null },
    { title: "ECDIS", description: "Ancillary course" },
    { title: "RADAR/ARPA OPERATIONAL MODEL", description: "Ancillary course" },
    { title: "Efficient Deck Hand", description: "Ancillary course" },
    { title: "Leadership and Teamwork", description: "Ancillary course" },
    { title: "GMDSS GoC", description: "Ancillary course" },
    { title: "MEDICAL FIRST AID", description: "Ancillary course" },
    { title: "Advanced Fire Fighting", description: "Ancillary course" },
    { title: "PSCRB", description: "Ancillary course" }
  ];

  const allDocTypes = await prisma.documentType.findMany();

  for (const item of docs) {
    let docType = allDocTypes.find(d => d.title.toLowerCase() === item.title.toLowerCase());
    
    if (!docType) {
      docType = await prisma.documentType.create({
        data: {
          title: item.title,
          description: item.description,
          category: "STUDENT"
        }
      });
      allDocTypes.push(docType);
      console.log(`Created Document Type: ${item.title}`);
    } else {
        if (!docType.description && item.description) {
            await prisma.documentType.update({
                where: { id: docType.id },
                data: { description: item.description }
            });
            console.log(`Updated Document Type Description: ${item.title}`);
        }
    }
    
    // Link to course
    const existingLink = await prisma.courseDocument.findUnique({
      where: {
        courseId_documentTypeId: {
          courseId: course.id,
          documentTypeId: docType.id
        }
      }
    });

    if (!existingLink) {
      await prisma.courseDocument.create({
        data: {
          courseId: course.id,
          documentTypeId: docType.id,
          isRequired: true
        }
      });
      console.log(`Linked ${item.title} to ${course.title}`);
    } else {
      console.log(`${item.title} is already linked to ${course.title}`);
    }
  }

  console.log("Finished seeding OOW documents.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
