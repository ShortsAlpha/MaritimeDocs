/**
 * Seed script to create the 3 initial branches.
 * Run with: npx tsx prisma/seed-branches.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const BRANCHES = [
  {
    code: "HQ",
    name: "Malta (Headquarters)",
    timezone: "Europe/Malta",
    currency: "EUR",
  },
  {
    code: "BG",
    name: "Bulgaria",
    timezone: "Europe/Sofia",
    currency: "BGN",
  },
  {
    code: "GR",
    name: "Greece",
    timezone: "Europe/Athens",
    currency: "EUR",
  },
]

async function main() {
  console.log("🌍 Seeding branches...")

  for (const branch of BRANCHES) {
    const existing = await prisma.branch.findUnique({
      where: { code: branch.code },
    })

    if (existing) {
      console.log(`  ✓ Branch "${branch.code}" already exists, skipping.`)
      continue
    }

    const created = await prisma.branch.create({ data: branch })
    console.log(`  ✅ Created branch: ${created.name} (${created.code})`)
  }

  // Assign all existing records to HQ branch
  const hqBranch = await prisma.branch.findUnique({ where: { code: "HQ" } })
  if (!hqBranch) {
    console.error("❌ HQ branch not found!")
    return
  }

  // Migrate existing users without a branch to HQ
  const usersUpdated = await prisma.user.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${usersUpdated.count} users to HQ`)

  // Migrate existing students without a branch to HQ
  const studentsUpdated = await prisma.student.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${studentsUpdated.count} students to HQ`)

  // Migrate existing instructors without a branch to HQ
  const instructorsUpdated = await prisma.instructor.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${instructorsUpdated.count} instructors to HQ`)

  // Migrate existing events without a branch to HQ
  const eventsUpdated = await prisma.courseEvent.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${eventsUpdated.count} events to HQ`)

  // Migrate existing payments without a branch to HQ
  const paymentsUpdated = await prisma.payment.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${paymentsUpdated.count} payments to HQ`)

  // Migrate existing intakes without a branch to HQ
  const intakesUpdated = await prisma.intake.updateMany({
    where: { branchId: null },
    data: { branchId: hqBranch.id },
  })
  console.log(`  📌 Assigned ${intakesUpdated.count} intakes to HQ`)

  console.log("\n✅ Branch seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
