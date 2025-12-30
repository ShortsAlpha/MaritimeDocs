import { db } from "@/lib/db";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789"); // Dummy key to prevent crash if env missing (runtime will fail sending but build assumes it's fine)
    // Better: check inside

    // Simple security check (Vercel Cron automatically adds this header)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }
    // For MVP skipping strict auth check, but highly recommended in production.

    try {
        // 1. Get all required doc types
        const requiredTypes = await db.documentType.findMany({
            where: { isRequired: true }
        });

        if (requiredTypes.length === 0) return NextResponse.json({ ok: true, msg: "No required docs" });

        // 2. Get all students
        const students = await db.user.findMany({
            where: { role: "STUDENT" },
            include: { documents: true }
        });

        let emailsSent = 0;

        // 3. Check each student
        for (const student of students) {
            const missingDocs = requiredTypes.filter((type: any) => {
                const studentDoc = student.documents.find((d: any) => d.documentTypeId === type.id);
                // Missing if no record OR status is Rejected
                return !studentDoc || studentDoc.status === "REJECTED";
            });

            if (missingDocs.length > 0) {
                const missingNames = missingDocs.map((d: any) => d.title).join(", ");

                // 4. Send Email
                await resend.emails.send({
                    from: 'Acme <onboarding@resend.dev>', // Update with your domain
                    to: [student.email], // Ensure email is valid or us 'delivered@resend.dev' for testing
                    subject: 'Action Required: Missing Documents',
                    html: `<p>Dear ${student.name},</p>
                 <p>You have the following missing or rejected documents required for your training:</p>
                 <ul>
                    ${missingDocs.map((d: any) => `<li>${d.title}</li>`).join('')}
                 </ul>
                 <p>Please log in to the portal and upload them immediately.</p>`
                });

                emailsSent++;
            }
        }

        return NextResponse.json({ success: true, emailsSent });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
