import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type alias for SupabaseClient with our Database schema
 * Use this type instead of importing from @supabase/supabase-js directly
 */
export type SupabaseClient = SupabaseClientBase<Database>;

/**
 * Default User ID for MVP development
 *
 * Used when authentication is not yet implemented.
 * This should be replaced with proper JWT authentication in production.
 *
 * To get a valid user ID:
 * 1. Check your Supabase dashboard → Authentication → Users
 * 2. Or run: SELECT id FROM profiles LIMIT 1;
 */
export const DEFAULT_USER_ID = import.meta.env.DEFAULT_USER_ID || "00000000-0000-0000-0000-000000000000";

/**
 * Cookie options for Supabase Auth
 * Used by createSupabaseServerInstance for proper session management
 *
 * Note: secure is set to false to allow cookies on localhost (HTTP)
 * In production with HTTPS, this should be set to true via environment variable
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  // Allow non-secure cookies for localhost development and testing
  // TODO: Set to true in production environment
  secure: false,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse Cookie header string into array of {name, value} objects
 * Required for Supabase SSR cookie handling
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase Server Instance for SSR
 *
 * Use this instead of supabaseClient in server-side contexts (middleware, API routes, Astro pages).
 * Properly handles cookies for session management using @supabase/ssr.
 *
 * @param context - Object containing headers and cookies from Astro context
 * @returns Supabase client with server-side cookie handling
 *
 * @example
 * // In middleware
 * const supabase = createSupabaseServerInstance({
 *   headers: request.headers,
 *   cookies: cookies,
 * });
 *
 * @example
 * // In API route
 * export const POST: APIRoute = async ({ request, cookies }) => {
 *   const supabase = createSupabaseServerInstance({
 *     headers: request.headers,
 *     cookies,
 *   });
 * };
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  // Determine if we're on localhost by checking the host header
  const host = context.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  // Create dynamic cookie options based on environment
  const dynamicCookieOptions: CookieOptionsWithName = {
    ...cookieOptions,
    // Only require secure on non-localhost (production)
    secure: !isLocalhost,
  };

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: dynamicCookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
