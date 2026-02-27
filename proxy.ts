import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/ask(.*)',
  '/inbox(.*)',
  '/notes(.*)',
  '/search(.*)',
  '/conversations(.*)',
  '/api/ask(.*)',
  '/api/conversations(.*)',
  '/api/files(.*)',
  '/api/inbox(.*)',
  '/api/search(.*)',
  '/api/stats(.*)',
  '/api/config(.*)',
  '/api/sync(.*)',
  '/api/index(.*)',
  '/api/reindex(.*)',
  '/api/graph(.*)',
  '/api/embeddings(.*)',
  '/api/tags(.*)',
  '/api/backlinks(.*)',
  '/api/security(.*)',
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (
    process.env.DISABLE_AUTH_FOR_E2E === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_E2E === 'true'
  ) {
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
