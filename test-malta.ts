import { db } from "./lib/db";
import { applyTMMetadataToStudent } from "./lib/transport-malta";

async function main() {
    const student = await db.student.findFirst();
    const course = await db.course.findFirst({ where: { title: { contains: "master" } } });
    
    if (!student || !course) {
        console.log("Missing student or course");
        return;
    }

    console.log("Before:", student.studentNumber);
    const result = await applyTMMetadataToStudent(student, course, "master-of-yacht-200gt");
    console.log("After:", result.studentNumber);
}
main().catch(console.error).finally(() => process.exit(0));
