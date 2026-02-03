
import { db } from "@/lib/db"

async function main() {
    const event = await db.courseEvent.findFirst({
        where: {
            title: "Basic Training (Test Instructor)"
        },
        include: {
            checklist: true
        }
    })

    if (event) {
        console.log("Event found:", event.title)
        console.log("Checklist items:")
        event.checklist.forEach(item => {
            console.log(`- ${item.label}: Completed=${item.isCompleted}, By=${item.completedBy}, At=${item.completedAt}`)
        })
    } else {
        console.log("Event not found")
    }
}

main()
