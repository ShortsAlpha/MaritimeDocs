import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/admin(.*)'])

const isPublicAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    // If user is logged in and trying to access sign-in/sign-up, redirect to admin
    if (userId && isPublicAuthRoute(req)) {
        return Response.redirect(new URL('/admin', req.url))
    }

    if (isProtectedRoute(req)) {
        if (!userId) {
            const { redirectToSignIn } = await auth()
            return redirectToSignIn()
        }
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
