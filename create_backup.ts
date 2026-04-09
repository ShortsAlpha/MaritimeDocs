import { PrismaClient, Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const models = Prisma.dmmf.datamodel.models.map(m => m.name)
  console.log(`Found models: ${models.join(', ')}`)

  const backupDir = path.join(process.cwd(), 'database_backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `backup_${timestamp}.json`)

  const data: any = {}

  for (const model of models) {
    const uncapitalized = model.charAt(0).toLowerCase() + model.slice(1)
    try {
      const records = await (prisma as any)[uncapitalized].findMany()
      data[model] = records
      console.log(`Backed up ${records.length} records for ${model}`)
    } catch (e) {
      console.error(`Failed to backup ${model}:`, e)
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
  console.log(`✅ Backup successfully saved to ${backupFile}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
