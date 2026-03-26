'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getCurrentUserBranch } from "@/lib/branch";
import { currentUser } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getTickets() {
    try {
        const branch = await getCurrentUserBranch();
        const branchFilter = branch && branch.branchId !== "HQ" ? { branchId: branch.branchId } : {};

        const tickets = await db.ticket.findMany({
            where: branchFilter,
            include: {
                student: {
                    select: {
                        fullName: true,
                        photoUrl: true,
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return { success: true, tickets };
    } catch (error: any) {
        console.error("Error fetching tickets:", error);
        return { success: false, message: error.message };
    }
}

export async function getTicketMessages(ticketId: string) {
    try {
        const branch = await getCurrentUserBranch(); // Auth check
        if (!branch) return { success: false, message: "Unauthorized" };

        const ticket = await db.ticket.findUnique({
            where: { id: ticketId },
            include: {
                student: {
                    select: {
                        fullName: true,
                        email: true,
                        photoUrl: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'asc' } // chronological for reading thread
                }
            }
        });

        if (!ticket) return { success: false, message: "Ticket not found" };

        return { success: true, ticket };
    } catch (error: any) {
        console.error("Error fetching internal ticket messages:", error);
        return { success: false, message: error.message };
    }
}

export async function resolveTicket(ticketId: string) {
    try {
        await db.ticket.update({
            where: { id: ticketId },
            data: { status: 'CLOSED' }
        });
        revalidatePath("/admin/tickets");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function sendTicketReply(ticketId: string, replyBody: string, fromAccount: string = 'support@student.xoneacademy.com') {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        const ticket = await db.ticket.findUnique({
            where: { id: ticketId },
            include: { student: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!ticket) throw new Error("Ticket not found");

        const toEmail = ticket.student?.email || ticket.contactEmail;
        if (!toEmail) throw new Error("No contact email found to reply to");

        // Format body for email (basic HTML wrapper)
        const htmlBody = `
            <div style="font-family: inherit;">
                ${replyBody.replace(/\n/g, '<br/>')}
            </div>
            <br/>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <div style="color: #666; font-size: 12px;">
                Xone Maritime Academy Support
            </div>
        `;

        // Send Email via Resend
        // Reply-To is incredibly important here so the user can reply back to the unified thread
        const { data, error } = await resend.emails.send({
            from: `Xone Academy <${fromAccount}>`,
            to: toEmail,
            subject: ticket.subject.startsWith('Re:') ? ticket.subject : `Re: ${ticket.subject}`,
            replyTo: fromAccount,
            html: htmlBody
        });

        if (error) {
            console.error("Failed to send reply via Resend:", error);
            return { success: false, message: error.message };
        }

        // Save internal system message
        await db.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                body: replyBody,
                fromEmail: fromAccount,
                toEmail: toEmail,
                isFromStudent: false,
                messageId: data?.id || undefined
            }
        });

        // Bump updated at
        await db.ticket.update({
            where: { id: ticket.id },
            data: { updatedAt: new Date(), status: 'OPEN' }
        });

        revalidatePath("/admin/tickets");
        return { success: true };
    } catch (error: any) {
        console.error("Send Ticket Reply Error:", error);
        return { success: false, message: error.message };
    }
}
