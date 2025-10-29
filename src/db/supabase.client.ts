import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
