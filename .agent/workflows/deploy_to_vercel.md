---
description: How to deploy the Maritime Academy Docs application to Vercel
---

# Deploying to Vercel

This workflow describes the steps to deploy the application to Vercel using GitHub.

## Prerequisites

1.  A GitHub account.
2.  A Vercel account.
3.  The project pushed to a GitHub repository.

## Steps

1.  **Push to GitHub**
    - Create a new **public** or **private** repository on GitHub.
    - Run the following commands in your terminal (replace `<your-repo-url>` with your actual repository URL):
      ```bash
      git add .
      git commit -m "Ready for deployment"
      git remote add origin <your-repo-url>
      git branch -M main
      git push -u origin main
      ```

2.  **Deploy on Vercel**
    - Go to [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **"Add New..."** -> **"Project"**.
    - Select your GitHub repository (`MaritimeDocs` or whatever you named it).
    - Click **"Import"**.

3.  **Configure Environment Variables**
    - In the **"Environment Variables"** section of the deployment screen, add the following keys from your `.env` file:
      - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
      - `CLERK_SECRET_KEY`
      - `CLERK_WEBHOOK_SECRET`
      - `DATABASE_URL`
      - `R2_ACCESS_KEY_ID`
      - `R2_SECRET_ACCESS_KEY`
      - `R2_BUCKET_NAME`
      - `R2_ACCOUNT_ID`
      - `R2_PUBLIC_URL`
      - `RESEND_API_KEY`
    - **Important:** Do *not* paste the comments or quotes, just the values.

4.  **Deploy**
    - Click **"Deploy"**.
    - Wait for the build to finish.
    - Once complete, your site will be live!

5.  **Post-Deployment**
    - Go to your Clerk Dashboard.
    - Update the **Webhook URL** to point to your new Vercel domain: `https://<your-vercel-domain>/api/webhooks/clerk`.
