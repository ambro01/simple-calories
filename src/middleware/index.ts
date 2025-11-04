import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Public paths that don't require authentication
 * Includes both server-rendered Astro pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Server-Rendered Astro Auth Pages
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  // Auth API endpoints
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/logout",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Create Supabase server instance for all requests
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Make supabase client available on locals for API routes
    locals.supabase = supabase;

    // Skip auth check for public paths
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is authenticated - set user info on locals
      locals.user = {
        email: user.email,
        id: user.id,
      };
    } else if (!PUBLIC_PATHS.includes(url.pathname)) {
      // User is not authenticated and trying to access protected route
      // Redirect to login page
      return redirect("/auth/login");
    }

    return next();
  },
);
