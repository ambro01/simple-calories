-- migration: disable_rls_policies
-- description: disables all rls policies from tables (profiles, calorie_goals, meals, error_logs)
-- tables affected: profiles, calorie_goals, meals, error_logs
-- notes: rls remains enabled on tables, but all policies are dropped
--        this allows full access to authenticated users without policy restrictions
--        warning: this removes data isolation between users

-- ============================================
-- drop policies from profiles table
-- ============================================

-- drop select policy
drop policy if exists "users can view own profile" on profiles;

-- drop update policy
drop policy if exists "users can update own profile" on profiles;

-- ============================================
-- drop policies from calorie_goals table
-- ============================================

-- drop select policy
drop policy if exists "users can view own goals" on calorie_goals;

-- drop insert policy
drop policy if exists "users can insert own goals" on calorie_goals;

-- drop update policy
drop policy if exists "users can update own goals" on calorie_goals;

-- drop delete policy
drop policy if exists "users can delete own goals" on calorie_goals;

-- ============================================
-- drop policies from meals table
-- ============================================

-- drop select policy
drop policy if exists "users can view own meals" on meals;

-- drop insert policy
drop policy if exists "users can insert own meals" on meals;

-- drop update policy
drop policy if exists "users can update own meals" on meals;

-- drop delete policy
drop policy if exists "users can delete own meals" on meals;

-- ============================================
-- note on error_logs table
-- ============================================

-- error_logs has no policies to drop (admin-only access by design)
-- rls is enabled but no policies were created

-- ============================================
-- warning
-- ============================================

-- warning: with rls enabled but no policies, tables will be inaccessible
-- to make tables accessible again, either:
-- 1. disable rls: alter table [table_name] disable row level security;
-- 2. create permissive policies: create policy "allow all" on [table_name] using (true);
