import { Resend } from 'resend';

interface EmailOptions {
    to: string
    subject: string
    html: string
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: EmailOptions) {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
        console.warn("Missing RESEND_API_KEY - Email simulation mode");
        console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
        return { success: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'Maritime Academy <onboarding@resend.dev>', // Use default testing domain or your verified domain
            to: to,
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error };
    }
}
