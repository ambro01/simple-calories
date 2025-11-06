/// <reference types="astro/client" />

import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Type alias for Supabase client with Database schema
type SupabaseClient = SupabaseClientBase<Database>;

declare global {
  namespace App {
    type Locals = {
      supabase: SupabaseClient;
      user?: {
        id: string;
        email: string | undefined;
      };
    };
  }
}

type ImportMetaEnv = {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly SKIP_EMAIL_CONFIRMATION?: string;
  // more env variables...
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
