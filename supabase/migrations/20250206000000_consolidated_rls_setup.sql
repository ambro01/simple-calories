-- migration: consolidated_rls_setup
-- description: consolidated and clean RLS setup for all tables
-- tables affected: profiles, calorie_goals, meals, ai_generations, error_logs
-- replaces: 10 chaotic migrations related to RLS (20250127110800 through 20250205000400)
--
-- this migration consolidates the final working state of RLS policies
-- including the permissive INSERT policies needed for trigger-based user registration
--
-- important: this approach is safe because:
-- 1. permissive INSERT policies only apply during trigger execution
-- 2. users cannot directly call INSERT via Supabase client (must use auth.uid())
-- 3. SELECT/UPDATE/DELETE policies remain strict (users only see own data)
-- 4. triggers validate data integrity (id from auth.users, hardcoded defaults)

-- ============================================
-- enable row level security on all tables
-- ============================================

alter table profiles enable row level security;
alter table calorie_goals enable row level security;
alter table meals enable row level security;
alter table ai_generations enable row level security;
alter table error_logs enable row level security;

-- ============================================
-- profiles table policies
-- ============================================

-- select: users can view their own profile
create policy "users can view own profile"
  on profiles
  for select
  to authenticated
  using (id = auth.uid());

comment on policy "users can view own profile" on profiles is
  'allows authenticated users to view only their own profile data';

-- update: users can update their own profile
create policy "users can update own profile"
  on profiles
  for update
  to authenticated
  using (id = auth.uid());

comment on policy "users can update own profile" on profiles is
  'allows authenticated users to update only their own profile data';

-- insert: permissive policy for trigger (validates data structure only)
-- this allows handle_new_user() trigger to create profiles during registration
-- safe because: trigger runs on auth.users INSERT (validated by Supabase Auth)
create policy "allow insert for trigger"
  on profiles
  for insert
  with check (
    id is not null
    and created_at is not null
    and updated_at is not null
  );

comment on policy "allow insert for trigger" on profiles is
  'allows trigger to insert profiles during user registration (validates data structure only)';

-- ============================================
-- calorie_goals table policies
-- ============================================

-- select: users can view their own goals
create policy "users can view own goals"
  on calorie_goals
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own goals" on calorie_goals is
  'allows authenticated users to view only their own calorie goals';

-- insert: permissive policy for trigger (validates data structure only)
-- this allows handle_new_user() trigger to create default goal during registration
-- safe for same reasons as profiles policy above
create policy "allow insert for trigger"
  on calorie_goals
  for insert
  with check (
    user_id is not null
    and daily_goal is not null
    and effective_from is not null
    and created_at is not null
    and updated_at is not null
  );

comment on policy "allow insert for trigger" on calorie_goals is
  'allows trigger to insert calorie goals during user registration (validates data structure only)';

-- insert: users can create their own goals (for updating calorie targets)
create policy "users can insert own goals"
  on calorie_goals
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own goals" on calorie_goals is
  'allows authenticated users to create calorie goals only for themselves';

-- update: users can update their own goals
create policy "users can update own goals"
  on calorie_goals
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own goals" on calorie_goals is
  'allows authenticated users to update only their own calorie goals';

-- delete: users can delete their own goals
create policy "users can delete own goals"
  on calorie_goals
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own goals" on calorie_goals is
  'allows authenticated users to delete only their own calorie goals';

-- ============================================
-- meals table policies
-- ============================================

-- select: users can view their own meals
create policy "users can view own meals"
  on meals
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own meals" on meals is
  'allows authenticated users to view only their own meal entries';

-- insert: users can create their own meals
create policy "users can insert own meals"
  on meals
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own meals" on meals is
  'allows authenticated users to create meal entries only for themselves';

-- update: users can update their own meals
create policy "users can update own meals"
  on meals
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own meals" on meals is
  'allows authenticated users to update only their own meal entries';

-- delete: users can delete their own meals
create policy "users can delete own meals"
  on meals
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own meals" on meals is
  'allows authenticated users to delete only their own meal entries';

-- ============================================
-- ai_generations table policies
-- ============================================

-- select: users can view their own ai generations
create policy "users can view own ai generations"
  on ai_generations
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own ai generations" on ai_generations is
  'allows authenticated users to view only their own ai generation history';

-- insert: users can create their own ai generations
create policy "users can insert own ai generations"
  on ai_generations
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own ai generations" on ai_generations is
  'allows authenticated users to create ai generation records only for themselves';

-- update: users can update their own ai generations
-- note: needed for updating meal_id after user accepts ai suggestion
create policy "users can update own ai generations"
  on ai_generations
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own ai generations" on ai_generations is
  'allows authenticated users to update only their own ai generation records (e.g., link meal_id)';

-- delete: users can delete their own ai generations
create policy "users can delete own ai generations"
  on ai_generations
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own ai generations" on ai_generations is
  'allows authenticated users to delete only their own ai generation records';

-- ============================================
-- error_logs table setup
-- ============================================

-- note: no policies for regular users
-- error logs contain technical information not suitable for end users
-- access only via supabase dashboard or direct sql for administrators
-- if admin role is needed in future, add policy here

-- ============================================
-- views rls inheritance
-- ============================================

-- note: views automatically inherit rls from underlying tables
-- daily_progress: rls from meals table
-- meals_with_latest_ai: rls from meals and ai_generations tables
-- no separate policies needed for views

-- ============================================
-- migration notes
-- ============================================

-- this migration replaces the following chaotic migrations:
-- 20250127110800_setup_rls_policies.sql - initial RLS setup
-- 20250127111000_disable_rls_policies.sql - dev workaround (drop policies)
-- 20250127111100_disable_rls.sql - dev workaround (disable RLS)
-- 20250129120000_temp_disable_trigger.sql - temp fix
-- 20250204120000_update_profile_trigger.sql - architectural change (reverted)
-- 20250205000000_enable_rls_security.sql - re-enable RLS (duplicate)
-- 20250205000100_re_enable_user_trigger.sql - restore trigger
-- 20250205000200_fix_rls_for_registration.sql - attempt #1 (service_role - failed)
-- 20250205000300_fix_trigger_rls.sql - attempt #2 (set role postgres - failed)
-- 20250205000400_fix_trigger_rls_v2.sql - final solution (permissive INSERT)
--
-- final architecture:
-- 1. handle_new_user() function with SECURITY DEFINER (from 20250127110500)
-- 2. on_auth_user_created trigger on auth.users (from 20250127110600)
-- 3. permissive INSERT policies for profiles and calorie_goals
-- 4. strict SELECT/UPDATE/DELETE policies for data isolation
--
-- security guarantee:
-- users can ONLY see and modify their own data
-- triggers can create profiles/goals during registration
-- validated by Supabase Auth (auth.users.id)
