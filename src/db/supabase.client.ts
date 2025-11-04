import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

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
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
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
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabase;
};
