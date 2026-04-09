import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/admin(.*)'])
const isPublicAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Initialize rate limiter logic only if env vars are present
const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "10 s"), // 20 requests per 10 seconds
        analytics: true,
    })
    : null;

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    // Rate Limiting Logic for API routes (or all routes if preferred)
    if (ratelimit && !req.nextUrl.pathname.startsWith("/_next")) {
        try {
            const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
            const result = await ratelimit.limit(ip)

            if (!result.success) {
                return new NextResponse("Too Many Requests", { status: 429 })
            }
        } catch (error) {
            console.error("Rate limit error:", error);
            // If rate limiting fails, let the request pass instead of throwing 500
        }
    }

    // If user is hit the landing page but already logged in, redirect to admin automatically
    if (userId && req.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/admin', req.url))
    }

    // If user is logged in and trying to access sign-in/sign-up, redirect to admin
    if (userId && isPublicAuthRoute(req)) {
        return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (isProtectedRoute(req)) {
        if (!userId) {
            const { redirectToSignIn } = await auth()
            return redirectToSignIn()
        }
    }
    
    return NextResponse.next();
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
