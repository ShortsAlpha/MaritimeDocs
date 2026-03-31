/**
 * Quick script to backup all tables from Prisma to a local JSON file.
 * Run this with: npx tsx scripts/backup_db.ts
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching database records for backup...')
  
  const backupData = {
    timestamp: new Date().toISOString(),
    branches: await prisma.branch.findMany(),
    users: await prisma.user.findMany(),
    students: await prisma.student.findMany(),
    studentDocuments: await prisma.studentDocument.findMany(),
    studentDocumentNotes: await prisma.studentDocumentNote.findMany(),
    studentRemarks: await prisma.studentRemark.findMany(),
    feedbacks: await prisma.feedback.findMany(),
    instructors: await prisma.instructor.findMany(),
    instructorDocuments: await prisma.instructorDocument.findMany(),
    courses: await prisma.course.findMany(),
    courseEvents: await prisma.courseEvent.findMany(),
    eventChecklistItems: await prisma.eventChecklistItem.findMany(),
    courseDocuments: await prisma.courseDocument.findMany(),
    intakes: await prisma.intake.findMany(),
    payments: await prisma.payment.findMany(),
    documentTypes: await prisma.documentType.findMany(),
    tickets: await prisma.ticket.findMany(),
    ticketMessages: await prisma.ticketMessage.findMany(),
    attendances: await prisma.attendance.findMany()
  }

  const backupFilePath = path.join(process.cwd(), `database_backup_${new Date().getTime()}.json`)
  
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2))
  
  console.log(`\n✅ Database successfully backed up to:\n${backupFilePath}`)
}

main()
  .catch((e) => {
    console.error('Backup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
