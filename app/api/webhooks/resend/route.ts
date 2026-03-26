import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// This webhook handles inbound emails sent to configured domains via Resend
export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Basic verification of payload structure
        if (!payload || payload.type !== 'email.received' || !payload.data) {
            return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
        }

        const data = payload.data;
        
        // Extract email details
        const toArray = Array.isArray(data.to) ? data.to : [data.to];
        const toEmail = toArray[0] || 'support@student.xoneacademy.com';
        const fromEmail = data.from.toLowerCase().trim();
        let subject = data.subject || 'No Subject';
        const textBody = data.text || data.html?.replace(/<[^>]*>?/gm, '') || '(No content)';
        const messageId = data.headers?.['Message-Id'] || undefined;

        console.log(`[Webhooks] Received inbound email from ${fromEmail} to ${toEmail}`);

        // Extract raw attachments if any
        let uploadedAttachments: any[] = [];
        // Note: For full attachment handling (uploading byte strings to R2),
        // we would process data.attachments base64 here. 
        // For MVP, we just note them.

        // 1. Try to match to an existing student
        const student = await db.student.findFirst({
            where: {
                email: { equals: fromEmail, mode: 'insensitive' }
            }
        });

        // 2. Identify if this is a reply to an existing ticket based on Subject "Re: [Subject]"
        // A robust system uses In-Reply-To headers, but subjects are a safe fallback
        const cleanSubject = subject.replace(/^(Re:\s*)+/i, '').trim();

        let ticketInfo = await db.ticket.findFirst({
            where: {
                contactEmail: fromEmail,
                subject: { contains: cleanSubject }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // 3. Create a new Ticket if no thread exists
        if (!ticketInfo) {
            ticketInfo = await db.ticket.create({
                data: {
                    subject: cleanSubject,
                    contactEmail: fromEmail,
                    studentId: student?.id || undefined,
                    branchId: student?.branchId || undefined,
                    status: 'OPEN'
                }
            });
            console.log(`[Webhooks] Created new ticket ${ticketInfo.id}`);
        } else {
            console.log(`[Webhooks] Appended to existing ticket ${ticketInfo.id}`);
        }

        // 4. Create the nested message
        await db.ticketMessage.create({
            data: {
                ticketId: ticketInfo.id,
                body: textBody,
                fromEmail: fromEmail,
                toEmail: toEmail,
                isFromStudent: true,
                messageId: messageId,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
            }
        });

        // 5. Bump ticket status/updatedAt to bubble it up in the Inbox UI
        await db.ticket.update({
            where: { id: ticketInfo.id },
            data: { 
                updatedAt: new Date(), 
                status: 'OPEN',
                contactEmail: fromEmail // ensuring it's caught
            }
        });

        revalidatePath("/admin/tickets");

        return NextResponse.json({ success: true, ticketId: ticketInfo.id });

    } catch (error: any) {
        console.error('[Webhooks] Error processing inbound email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
