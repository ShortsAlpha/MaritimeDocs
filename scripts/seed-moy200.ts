import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed script for Master of Yachts 200 GT Limited document requirements...')

  const requiredDocs = [
    { title: 'Passport', category: 'STUDENT' },
    { title: 'Candidate Registration Form', category: 'OFFICE' },
    { title: 'Training Agreement', category: 'OFFICE' },
    { title: 'Medical', category: 'MEDICAL' },
    { title: 'Seaservice', category: 'STUDENT' },
    { title: 'Color photograph of seafarer', category: 'STUDENT' },
    { title: 'Signature of seafarer', category: 'STUDENT' },
    { title: 'Yacht Rating Certificate (optional)', category: 'CERTIFICATE' },
    { title: 'STCW Basic Safety', category: 'CERTIFICATE' },
    { title: 'Student Record Password', category: 'STUDENT' },
    { title: 'Certificate', category: 'CERTIFICATE' },
    { title: 'Yacht Rating', category: 'CERTIFICATE' },
    { title: 'Watch Rating', category: 'CERTIFICATE' },
    { title: 'Yacht Rating Management Level', category: 'CERTIFICATE' },
    { title: 'Use of Leadership and Management Skills', category: 'CERTIFICATE' },
    { title: 'Medical Care', category: 'CERTIFICATE' },
  ]

  const docTypeMap = new Map<string, string>()

  // 1. Ensure DocumentTypes exist
  for (const doc of requiredDocs) {
    let dbDoc = await prisma.documentType.findFirst({
      where: { title: { equals: doc.title, mode: 'insensitive' } }
    })
    
    if (!dbDoc) {
      dbDoc = await prisma.documentType.create({
        data: {
          title: doc.title,
          // @ts-ignore
          category: doc.category,
          isRequired: true
        }
      })
      console.log(`Created new DocumentType: ${doc.title}`)
    }
    docTypeMap.set(doc.title, dbDoc.id)
  }

  // 2. Ensure Course exists
  const courseTitle = 'MASTER OF YACHTS 200 GT LIMITED'
  let dbCourse = await prisma.course.findFirst({
    where: { title: { equals: courseTitle, mode: 'insensitive' } }
  })

  // Also check exactly for "Master of Yachts 200 GT Limited" to be robust against casing
  if (!dbCourse) {
      dbCourse = await prisma.course.findFirst({
          where: { title: 'Master of Yachts 200 GT Limited' }
      })
  }

  if (!dbCourse) {
    dbCourse = await prisma.course.create({
      data: { title: 'Master of Yachts 200 GT Limited' }
    })
    console.log(`Created new Course: Master of Yachts 200 GT Limited`)
  }

  // 3. Link DocumentTypes to the Course
  for (const doc of requiredDocs) {
    const docTypeId = docTypeMap.get(doc.title)
    if (!docTypeId) continue;

    const existingRelation = await prisma.courseDocument.findFirst({
      where: {
        courseId: dbCourse.id,
        documentTypeId: docTypeId
      }
    })

    if (!existingRelation) {
      await prisma.courseDocument.create({
        data: {
          courseId: dbCourse.id,
          documentTypeId: docTypeId
        }
      })
      console.log(`Linked ${doc.title} to Master of Yachts 200 GT Limited`)
    }
  }

  console.log('Seed script completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
