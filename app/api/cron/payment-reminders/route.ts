import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPaymentReminderEmail } from "@/app/actions/email";
import { logActivity } from "@/lib/logger";

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
    try {
        // Optional: Check authorization header if you want to secure it, 
        // Vercel Cron sends a Bearer token we could verify.
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        // Find students whose deadline is in exactly or less than 7 days
        // and who haven't been sent a reminder yet.
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);

        const students = await db.student.findMany({
            where: {
                paymentDeadline: {
                    lte: targetDate, // Deadline is within 7 days (or past)
                },
                paymentReminderSent: false,
            },
            include: {
                payments: true
            }
        });

        const emailsSent = [];

        for (const student of students) {
            const totalFee = Number(student.totalFee);
            const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const balance = totalFee - totalPaid;

            if (balance > 0 && student.email) {
                // Send reminder using the professional template
                const res = await sendPaymentReminderEmail(student.id);

                if (res.success) {
                    // Update database so we don't send again
                    await db.student.update({
                        where: { id: student.id },
                        data: { paymentReminderSent: true }
                    });

                    emailsSent.push(student.id);
                } else {
                    console.error(`Failed to send reminder for ${student.id}: ${res.message}`);
                }

            } else if (balance <= 0) {
                // Payment is complete, just mark the reminder as sent to avoid checking again
                await db.student.update({
                    where: { id: student.id },
                    data: { paymentReminderSent: true }
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${students.length} students, sent ${emailsSent.length} reminders.` 
        });
        
    } catch (error: any) {
        console.error("Cron Error (payment-reminders):", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
