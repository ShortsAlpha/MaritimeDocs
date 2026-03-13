import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed script for course document requirements...')

  const commonDocs = [
    { title: 'Passport', category: 'STUDENT' },
    { title: 'Candidate Registration Form', category: 'OFFICE' },
    { title: 'Training Agreement', category: 'OFFICE' },
    { title: 'Medical', category: 'MEDICAL' },
    { title: 'Seaservice', category: 'STUDENT' },
    { title: 'Color photograph of seafarer', category: 'STUDENT' },
    { title: 'Signature of seafarer', category: 'STUDENT' },
    { title: 'Steering Certificate', category: 'CERTIFICATE' },
    { title: 'ECDIS', category: 'CERTIFICATE' },
    { title: 'RADAR/ARPA OPERATIONAL MODEL', category: 'CERTIFICATE' },
    { title: 'Efficient Deck Hand', category: 'CERTIFICATE' },
    { title: 'Leadership and Teamwork', category: 'CERTIFICATE' },
    { title: 'GMDSS GoC', category: 'CERTIFICATE' },
    { title: 'MEDICAL FIRST AID', category: 'CERTIFICATE' },
    { title: 'Advanced Fire Fighting', category: 'CERTIFICATE' },
    { title: 'PSCRB', category: 'CERTIFICATE' },
  ]

  const moyOnlyDocs = [
    { title: 'Radar/ARPA Management Level', category: 'CERTIFICATE' },
    { title: 'Use of Leadership and Management Skills', category: 'CERTIFICATE' },
    { title: 'Medical Care', category: 'CERTIFICATE' },
  ]

  // Upsert all documents to ensure they exist
  const allDocConfigs = [...commonDocs, ...moyOnlyDocs]
  const docTypeMap = new Map<string, string>()

  for (const doc of allDocConfigs) {
    // Attempt to find existing by title, else create
    let dbDoc = await prisma.documentType.findFirst({
      where: { title: { equals: doc.title, mode: 'insensitive' } }
    })
    
    if (!dbDoc) {
      dbDoc = await prisma.documentType.create({
        data: {
          title: doc.title,
          // @ts-ignore - bypassing enum typing strictly for seed script
          category: doc.category,
          isRequired: true
        }
      })
      console.log(`Created new DocumentType: ${doc.title}`)
    }
    docTypeMap.set(doc.title, dbDoc.id)
  }

  // Define courses
  const courseConfigs = [
    {
      title: 'OOW 3000GT',
      requiredDocs: commonDocs.map(d => d.title)
    },
    {
      title: 'TM MOY 500GT',
      requiredDocs: [...commonDocs.map(d => d.title), ...moyOnlyDocs.map(d => d.title)]
    }
  ]

  for (const cConf of courseConfigs) {
    let dbCourse = await prisma.course.findFirst({
      where: { title: { equals: cConf.title, mode: 'insensitive' } }
    })

    if (!dbCourse) {
      dbCourse = await prisma.course.create({
        data: { title: cConf.title }
      })
      console.log(`Created new Course: ${cConf.title}`)
    }

    // Connect documents to course
    for (const reqDocTitle of cConf.requiredDocs) {
      const docTypeId = docTypeMap.get(reqDocTitle)
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
        console.log(`Linked ${reqDocTitle} to ${cConf.title}`)
      }
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
