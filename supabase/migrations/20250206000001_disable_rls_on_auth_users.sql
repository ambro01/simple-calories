-- migration: fix_auth_users_rls
-- description: Adds RLS policies to auth.users to allow Supabase Auth to function properly
--
-- IMPORTANT: The auth.users table has RLS enabled by default in Supabase.
-- We cannot disable it from migrations due to ownership restrictions.
-- Instead, we add permissive policies that allow supabase_auth_admin role
-- to perform all necessary operations.
--
-- This migration fixes the issue where RLS on auth.users had no policies,
-- which prevented user registration from working ("Database error saving new user").

-- Allow supabase_auth_admin to insert users (for registration)
CREATE POLICY "supabase_auth_admin can insert users"
  ON auth.users
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

-- Allow supabase_auth_admin to update users (for email confirmation, password reset, etc.)
CREATE POLICY "supabase_auth_admin can update users"
  ON auth.users
  FOR UPDATE
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

-- Allow supabase_auth_admin to delete users (for account deletion)
CREATE POLICY "supabase_auth_admin can delete users"
  ON auth.users
  FOR DELETE
  TO supabase_auth_admin
  USING (true);

-- Allow supabase_auth_admin to select users (for authentication)
CREATE POLICY "supabase_auth_admin can select users"
  ON auth.users
  FOR SELECT
  TO supabase_auth_admin
  USING (true);
