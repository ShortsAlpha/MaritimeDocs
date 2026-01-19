'use server';

import { db } from "@/lib/db";
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from "next/cache";
import { headers } from "next/headers"; // Dynamically get host from request

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Remove synchronous getBaseUrl
// 2. Add baseUrl argument to getEmailTemplate
// 3. Resolve baseUrl inside each server action

// Professional Email Template Helper
const getEmailTemplate = (title: string, content: string, baseUrl: string, cta?: { text: string, url: string }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: #000000; padding: 32px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
            .content { padding: 40px 32px; color: #3f3f46; line-height: 1.6; font-size: 16px; }
            .content h2 { color: #18181b; margin-top: 0; font-size: 20px; font-weight: 600; }
            .button-container { margin: 32px 0; text-align: center; }
            .button { background-color: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: opacity 0.2s; }
            .button:hover { opacity: 0.9; }
            .footer { background: #f4f4f5; padding: 24px; text-align: center; font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; }
            .link { color: #000000; text-decoration: underline; }
            
            @media only screen and (max-width: 600px) {
                .container { margin: 0; border-radius: 0; }
                .content { padding: 24px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${baseUrl}/logo.png" alt="Xone Superyacht Academy" style="max-height: 60px; width: auto; display: block; margin: 0 auto;" />
            </div>
            <div class="content">
                <h2>${title}</h2>
                ${content}
                ${cta ? `
                <div class="button-container">
                    <a href="${cta.url}" class="button" style="color: #ffffff !important; text-decoration: none;">${cta.text}</a>
                </div>
                ` : ''}
                <p style="margin-top: 32px; font-size: 15px; color: #52525b;">Best regards,<br><strong>Xone Academy Team</strong></p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Xone Superyacht Academy. All rights reserved.</p>
                <p>Add: Göcek, Fethiye / Muğla, Turkey</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export async function sendStudentWelcomeEmail(studentId: string) {
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Generate Token
        const token = uuidv4();
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7); // 7 Days expiry

        // Update Student
        await db.student.update({
            where: { id: studentId },
            data: {
                uploadToken: token,
                uploadTokenExpiry: expiry
            }
        });


        // Resolve Base URL dynamically
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        const uploadLink = `${baseUrl}/upload/${token}`;
        console.log(`Attempting to send welcome email to: ${student.email}`);

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'Xone Academy <onboarding@resend.dev>',
            to: student.email,
            subject: 'Welcome to Xone Superyacht Academy - Required Documents',
            html: getEmailTemplate(
                'Completing your Registration',
                `<p>Dear ${student.fullName},</p>
                <p>Welcome aboard! We are excited to have you join us at Xone Superyacht Academy.</p>
                <p>To finalize your enrollment and ensure a smooth start, we require you to upload some essential documents.</p>
                <p>Please click the button below to access your secure upload portal. This link is valid for <strong>7 days</strong>.</p>`,
                baseUrl,
                { text: 'Upload Documents Securely', url: uploadLink }
            )
        });

        if (error) {
            console.error("Resend API returned error:", error);
            return { success: false, message: error.message };
        }

        console.log("Welcome email sent successfully:", data);
        return { success: true };
    } catch (error) {
        console.error("Send Welcome Email Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}

export async function sendExamNotesEmail(studentId: string, courseName: string, notesUrl: string) {
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Resolve Base URL
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        await resend.emails.send({
            from: 'Xone Academy <academics@resend.dev>',
            to: student.email,
            subject: `Exam Notes: ${courseName}`,
            html: getEmailTemplate(
                `Exam Notes: ${courseName}`,
                `<p>Dear ${student.fullName},</p>
                <p>We have prepared the study notes for your upcoming exam in <strong>${courseName}</strong>.</p>
                <p>You can download them directly using the link below. We recommend reviewing them thoroughly before your assessment.</p>
                <p>Good luck with your studies!</p>`,
                baseUrl,
                { text: 'Download Exam Notes', url: notesUrl }
            ),
            // attachments: [ { filename: 'notes.pdf', path: notesUrl } ] // Optional: can attach if preferred
        });

        return { success: true };
    } catch (error) {
        console.error("Send Exam Notes Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}

export async function sendDocumentRejectionEmail(studentId: string, documentTitle: string) {
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Resolve Base URL
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        await resend.emails.send({
            from: 'Xone Academy <support@resend.dev>',
            to: student.email,
            subject: `Action Required: Document Rejected - ${documentTitle}`,
            html: getEmailTemplate(
                'Document Action Required',
                `<p>Dear ${student.fullName},</p>
                <p>We have reviewed your document "<strong>${documentTitle}</strong>" and unfortunately, it does not meet our validation criteria.</p>
                <p style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 6px; font-weight: 500;">Status: Rejected</p>
                <p>Please review our document guidelines or contact our support team immediately to resolve this issue and prevent delays in your certification.</p>
                <ul>
                    <li>Phone: +90 (555) 123 45 67</li>
                    <li>Email: <a href="mailto:support@xone.com" class="link">support@xone.com</a></li>
                </ul>`,
                baseUrl,
                { text: 'Go to Student Portal', url: `${baseUrl}/admin/students/${studentId}` } // Redirect to portal
            )
        });

        return { success: true };
    } catch (error) {
        console.error("Send Rejection Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}
