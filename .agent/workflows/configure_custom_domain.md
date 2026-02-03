---
description: How to configure a custom domain (e.g., yourcompany.com) for your Vercel deployment
---

# Configuring a Custom Domain on Vercel

If you already own a domain name (e.g., provided by your company), you can easily connect it to your Vercel project.

## Prerequisite
- You must have administrative access to your domain's DNS settings (e.g., GoDaddy, Namecheap, Cloudflare, or your company's IT department).
- Your project must overlap be deployed to Vercel.

## Steps

### 1. Add Domain to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project.
3. Go to **Settings** -> **Domains**.
4. Enter your custom domain name (e.g., `portal.mycompany.com` or `mycompany.com`) in the input field.
5. Click **Add**.

### 2. Configure DNS Records
Vercel will provide you with the necessary DNS records. You (or your IT department) need to add these to your domain provider's DNS management page.

#### Option A: Subdomain (recommended for portals)
If you are using a subdomain like `student.mycompany.com`:
- **Type:** `CNAME`
- **Name:** `student` (or whatever your subdomain is)
- **Value:** `cname.vercel-dns.com`

#### Option B: Root Domain
If you are using the main domain `mycompany.com`:
- **Type:** `A`
- **Name:** `@` (or leave empty)
- **Value:** `76.76.21.21` (Vercel's IP)

*Note: Vercel may also ask for a `TXT` record verification if the domain is in use elsewhere.*

### 3. Verification
1. After adding the DNS records, return to the Vercel Domains settings.
2. Vercel will automatically check the records. This may take from a few minutes to 24 hours (usually fast).
3. Once the status turns **green (Valid)**, your site is live at your custom domain!

### 4. Update Environment Variables (Important)
If your application uses the domain in emails or links (like `NEXT_PUBLIC_APP_URL`), remember to:
1. Go to **Settings** -> **Environment Variables**.
2. Update any URL-related variables to your new domain.
3. **Redeploy** the application for changes to take effect.
