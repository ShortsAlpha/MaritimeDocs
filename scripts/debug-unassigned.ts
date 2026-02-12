
import { db } from "@/lib/db"

async function main() {
    console.log("Checking for unassigned students...")

    const whereClause: any = {
        AND: []
    }

    // Mimic the query in searchStudentsForAssignment
    whereClause.AND.push({
        events: {
            none: {}
        }
    })

    const count = await db.student.count()
    console.log(`Total students in DB: ${count}`)

    const unassigned = await db.student.findMany({
        where: whereClause,
        take: 10,
        select: { id: true, fullName: true, events: { select: { id: true } } }
    })

    console.log(`Found ${unassigned.length} unassigned students (limit 10):`)
    console.log(JSON.stringify(unassigned, null, 2))

    // Also check a student that SHOULD be unassigned if any
    const randomStudent = await db.student.findFirst({
        include: { events: true }
    })
    if (randomStudent) {
        console.log("\nRandom Student Check:")
        console.log(`Name: ${randomStudent.fullName}`)
        console.log(`Event Count: ${randomStudent.events.length}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
