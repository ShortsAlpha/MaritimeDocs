'use server';

import { db } from "@/lib/db";
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logger";
import { getFileBufferFromR2 } from "@/lib/r2";

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
            .header { background: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e4e4e7; }
            .header h1 { color: #18181b; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
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
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td style="padding-right: 12px;">
                            <img src="${baseUrl}/logo.png" alt="Xone" height="40" style="display: block; max-height: 40px; width: auto;" />
                        </td>
                        <td>
                            <span style="color: #18181b; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Xone Maritime Academy</span>
                        </td>
                    </tr>
                </table>
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
                <p>© ${new Date().getFullYear()} Xone Maritime Academy. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export async function sendStudentWelcomeEmail(studentId: string, courseId?: string) {
    try {
        const student = await db.student.findUnique({ 
            where: { id: studentId },
            include: {
                courses: {
                    include: {
                        requiredDocuments: {
                            include: { documentType: true }
                        }
                    }
                }
            }
        });
        
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Fetch required documents dynamically based on enrolled courses
        const requiredDocsMap = new Map<string, { title: string, exampleUrl: string | null }>();
        
        if (student.courses) {
            student.courses.forEach((course: any) => {
                if (!courseId || course.id === courseId) {
                    if (course.requiredDocuments) {
                        course.requiredDocuments.forEach((reqDoc: any) => {
                            const dt = reqDoc.documentType;
                            if (!requiredDocsMap.has(dt.id)) {
                                requiredDocsMap.set(dt.id, { title: dt.title, exampleUrl: dt.exampleUrl });
                            }
                        });
                    }
                }
            });
        }
        
        const requiredDocs = Array.from(requiredDocsMap.values());

        const docListHtml = requiredDocs.length > 0
            ? `<ul>${requiredDocs.map(doc => `<li><strong>${doc.title}</strong>${doc.exampleUrl ? ` <em>(<a href="${doc.exampleUrl}" style="color: #2563eb; text-decoration: underline;">Download Example Template</a>)</em>` : ''}</li>`).join('')}</ul>`
            : '<p><em>No specific documents required at this time.</em></p>';

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


        // Resolve Base URL dynamically using env instead of headers() which throws in Server Actions
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://student.xoneacademy.com';
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        const uploadLink = `${baseUrl}/upload/${token}`;
        console.log(`Attempting to send welcome email to: ${student.email}`);

        // If localhost, Gmail will block images. Warn in console.
        if (baseUrl.includes('localhost')) {
            console.warn("WARNING: Emails sent from localhost will have broken images in Gmail. Please use a public URL or Ngrok.");
        }

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'Xone Academy <onboarding@student.xoneacademy.com>',
            to: student.email,
            subject: 'Welcome to Xone Maritime Academy - Required Documents',
            html: getEmailTemplate(
                'Completing your Registration',
                `<p>Dear ${student.fullName},</p>
                <p>Welcome aboard! We are excited to have you join us at Xone Maritime Academy.</p>
                <p>To finalize your enrollment and ensure a smooth start, we require you to upload the following essential documents:</p>
                ${docListHtml}
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

        await logActivity({
            action: 'EMAIL',
            title: `Sent Welcome Email`,
            description: `Sent to ${student.email}`,
            userId: student.id,
            userEmail: student.email,
            metadata: { type: 'WELCOME', token }
        });

        return { success: true };
    } catch (error) {
        console.error("Send Welcome Email Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}

export async function sendExamNotesEmail(studentId: string, courseName: string, notesUrl: string) {
    console.log(`Sending exam notes email to student ${studentId} for course ${courseName}`);
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) {
            console.error("Student not found or no email for ID:", studentId);
            throw new Error("Student not found or no email");
        }

        // Resolve Base URL dynamically using env instead of headers() which throws in Server Actions
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://student.xoneacademy.com';
        console.log("Base URL resolved:", baseUrl);

        await resend.emails.send({
            from: 'Xone Academy <academics@student.xoneacademy.com>',
            to: student.email,
            subject: `Lecture Notes: ${courseName}`,
            html: getEmailTemplate(
                `Lecture Notes: ${courseName}`,
                `<p>Dear ${student.fullName},</p>
                <p>I hope everything is going well with you.</p>
                <p>Greetings from Xone Maritime Academy. We are pleased to welcome you to the <strong>${courseName}</strong> program.</p>
                <p>We have prepared the lecture notes for your review. You can download them directly using the link below.</p>
                <p>Feel free to review the materials to get a better idea of what to expect during the course. All topics will be covered during the lessons, and we will support you throughout your learning from start to finish.</p>
                <p>We look forward to have you as our student.</p>
                <p>Please feel free to reach out if you have any questions.</p>`,
                baseUrl,
                { text: 'Download Lecture Notes', url: notesUrl }
            ),
        });
        console.log("Email sent successfully via Resend");

        await logActivity({
            action: 'EMAIL',
            title: `Sent Exam Notes: ${courseName}`,
            description: `Sent to ${student.email}`,
            userId: student.id,
            userEmail: student.email,
            metadata: { type: 'EXAM_NOTES', course: courseName }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Send Exam Notes Email Error:", error);
        return { success: false, message: error.message || "Failed to send email" };
    }
}

export async function sendDocumentRejectionEmail(studentId: string, documentTitle: string) {
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Ensure valid upload token exists
        let token = student.uploadToken;
        // Simple expiry check: if no token or expired (we'll just issue a new one if it's been a long time or doesn't exist)
        // For robustness, let's just ensure we have a token. If it's expired, the upload page logic should handle it or we should refresh it here.
        // Let's refresh it to be safe for re-uploads.
        if (!token) {
            token = uuidv4();
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 7);

            await db.student.update({
                where: { id: studentId },
                data: {
                    uploadToken: token,
                    uploadTokenExpiry: expiry
                }
            });
        }

        // Resolve Base URL dynamically using env instead of headers() which throws in Server Actions
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://student.xoneacademy.com';

        const uploadLink = `${baseUrl}/upload/${token}`;

        await resend.emails.send({
            from: 'Xone Academy <support@student.xoneacademy.com>',
            to: student.email,
            subject: `Action Required: Document Rejected - ${documentTitle}`,
            html: getEmailTemplate(
                'Document Action Required',
                `<p>Dear ${student.fullName},</p>
                <p>We have reviewed your document "<strong>${documentTitle}</strong>" and unfortunately, it does not meet our validation criteria.</p>
                <p style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 6px; font-weight: 500;">Status: Rejected</p>
                <p>Please review our document guidelines and upload a corrected version using the link below.</p>
                <ul>
                    <li>Ensure the document is clear and readable</li>
                    <li>Check that all corners are visible</li>
                    <li>Verify the document is valid and not expired</li>
                </ul>`,
                baseUrl,
                { text: 'Upload Revised Document', url: uploadLink }
            )
        });

        return { success: true };
    } catch (error) {
        console.error("Send Rejection Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}

export async function sendFeedbackEmail(studentId: string) {
    try {
        const student = await db.student.findUnique({ where: { id: studentId } });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Ensure token exists
        let token = student.feedbackToken;
        if (!token) {
            token = uuidv4();
            await db.student.update({
                where: { id: studentId },
                data: { feedbackToken: token }
            });
        }

        // Resolve Base URL dynamically using env instead of headers() which throws in Server Actions
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://student.xoneacademy.com';

        const feedbackLink = `${baseUrl}/feedback/${token}`;

        await resend.emails.send({
            from: 'Xone Academy <feedback@student.xoneacademy.com>',
            to: student.email,
            subject: 'We Value Your Feedback - Xone Maritime Academy',
            html: getEmailTemplate(
                'Course Completion Feedback',
                `<p>Dear ${student.fullName},</p>
                <p>Congratulations on completing your course at Xone Maritime Academy!</p>
                <p>We constantly strive to improve our training and facilities. We would greatly appreciate it if you could take a moment to share your experience with us.</p>
                <p>Please click the link below to answer a few brief questions.</p>`,
                baseUrl,
                { text: 'Provide Feedback', url: feedbackLink }
            )
        });

        return { success: true };
    } catch (error) {
        console.error("Send Feedback Email Error:", error);
        return { success: false, message: "Failed to send email" };
    }
}

export async function sendPaymentReminderEmail(studentId: string) {
    try {
        const student = await db.student.findUnique({ 
            where: { id: studentId },
            include: { payments: { orderBy: { date: 'asc' } } }
        });
        if (!student || !student.email) throw new Error("Student not found or no email");

        // Calculate financials
        const totalFee = Number(student.totalFee);
        const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = totalFee - totalPaid;

        if (balance <= 0) {
            return { success: false, message: "Student has no pending balance." };
        }

        // Build HTML table for payments
        let paymentsHtml = "";
        if (student.payments.length > 0) {
            paymentsHtml = `
                <div style="margin-top: 24px; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                        <thead style="background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
                            <tr>
                                <th style="padding: 12px 16px; color: #52525b; font-weight: 600;">Date</th>
                                <th style="padding: 12px 16px; color: #52525b; font-weight: 600;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${student.payments.map(p => `
                                <tr style="border-bottom: 1px solid #e4e4e7;">
                                    <td style="padding: 12px 16px; color: #3f3f46;">${p.date.toLocaleDateString()}</td>
                                    <td style="padding: 12px 16px; color: #3f3f46;">€${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot style="background-color: #fafafa;">
                            <tr>
                                <td style="padding: 12px 16px; color: #18181b; font-weight: 600; text-align: right;">Total Paid:</td>
                                <td style="padding: 12px 16px; color: #18181b; font-weight: 600;">€${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        // Fetch PDF attachment from R2
        const R2_FILE_KEY = "payment_info/Account Details - Foxtrium Limited.pdf";
        const fileBuffer = await getFileBufferFromR2(R2_FILE_KEY);
        
        const attachments = [];
        if (fileBuffer) {
            attachments.push({
                filename: 'Account Details - Foxtrium Limited.pdf',
                content: fileBuffer
            });
        } else {
            console.warn("Could not download payment details PDF from R2, sending without attachment.");
        }

        // Resolve Base URL
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        // Send Email
        const { error } = await resend.emails.send({
            from: 'Xone Academy <noreply@student.xoneacademy.com>',
            to: student.email,
            subject: 'Payment Reminder - Xone Superyacht Academy',
            attachments,
            html: getEmailTemplate(
                'Outstanding Balance Reminder',
                `<p>Dear ${student.fullName},</p>
                <p>This is a friendly reminder that you have an outstanding balance on your account.</p>
                
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #991b1b; font-size: 16px;">
                        <strong>Remaining Balance:</strong> €${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #b45309; font-size: 16px; font-weight: bold;">
                        Action Required: Please ensure your payment is completed within this week.
                    </p>
                </div>
                
                <p>We have attached the account details (PDF) to this email for your convenience.</p>

                ${student.payments.length > 0 ? `
                    <h3 style="margin-top: 32px; color: #18181b; font-size: 16px;">Payment History</h3>
                    ${paymentsHtml}
                ` : ''}
                
                <p style="margin-top: 24px;">If you have already made this payment, please disregard this email or send us the receipt.</p>`,
                baseUrl
            )
        });

        if (error) {
            throw new Error(error.message);
        }

        await db.student.update({
            where: { id: studentId },
            data: { status: "PAYMENT_REMINDER_SENT" }
        });

        await logActivity({
            action: 'EMAIL',
            title: `Sent Payment Reminder Email`,
            description: `Sent to ${student.email}`,
            userId: student.id,
            userEmail: student.email,
            metadata: { type: 'PAYMENT_REMINDER', balance }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Send Payment Reminder Email Error:", error);
        return { success: false, message: error.message || "Failed to send email" };
    }
}
