-- migration: setup_rls_policies
-- description: enables row level security and creates policies for all user tables
-- tables affected: profiles, calorie_goals, meals, ai_generations, error_logs
-- notes: restrictive by default - users can only access their own data
--        error_logs has no policies (admin access only)

-- ============================================
-- profiles rls policies
-- ============================================

-- enable row level security
alter table profiles enable row level security;

-- policy: users can view their own profile
create policy "users can view own profile"
  on profiles
  for select
  to authenticated
  using (id = auth.uid());

comment on policy "users can view own profile" on profiles is
  'allows authenticated users to view only their own profile data';

-- policy: users can update their own profile
create policy "users can update own profile"
  on profiles
  for update
  to authenticated
  using (id = auth.uid());

comment on policy "users can update own profile" on profiles is
  'allows authenticated users to update only their own profile data';

-- note: insert and delete managed by triggers, not directly by users

-- ============================================
-- calorie_goals rls policies
-- ============================================

-- enable row level security
alter table calorie_goals enable row level security;

-- policy: users can view their own goals
create policy "users can view own goals"
  on calorie_goals
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own goals" on calorie_goals is
  'allows authenticated users to view only their own calorie goals';

-- policy: users can insert their own goals
create policy "users can insert own goals"
  on calorie_goals
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own goals" on calorie_goals is
  'allows authenticated users to create calorie goals only for themselves';

-- policy: users can update their own goals
create policy "users can update own goals"
  on calorie_goals
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own goals" on calorie_goals is
  'allows authenticated users to update only their own calorie goals';

-- policy: users can delete their own goals
create policy "users can delete own goals"
  on calorie_goals
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own goals" on calorie_goals is
  'allows authenticated users to delete only their own calorie goals';

-- ============================================
-- meals rls policies
-- ============================================

-- enable row level security
alter table meals enable row level security;

-- policy: users can view their own meals
create policy "users can view own meals"
  on meals
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own meals" on meals is
  'allows authenticated users to view only their own meal entries';

-- policy: users can insert their own meals
create policy "users can insert own meals"
  on meals
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own meals" on meals is
  'allows authenticated users to create meal entries only for themselves';

-- policy: users can update their own meals
create policy "users can update own meals"
  on meals
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own meals" on meals is
  'allows authenticated users to update only their own meal entries';

-- policy: users can delete their own meals
create policy "users can delete own meals"
  on meals
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own meals" on meals is
  'allows authenticated users to delete only their own meal entries';

-- ============================================
-- ai_generations rls policies
-- ============================================

-- enable row level security
alter table ai_generations enable row level security;

-- policy: users can view their own ai generations
create policy "users can view own ai generations"
  on ai_generations
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own ai generations" on ai_generations is
  'allows authenticated users to view only their own ai generation history';

-- policy: users can insert their own ai generations
create policy "users can insert own ai generations"
  on ai_generations
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own ai generations" on ai_generations is
  'allows authenticated users to create ai generation records only for themselves';

-- policy: users can update their own ai generations
-- note: needed for updating meal_id after user accepts ai suggestion
create policy "users can update own ai generations"
  on ai_generations
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own ai generations" on ai_generations is
  'allows authenticated users to update only their own ai generation records (e.g., link meal_id)';

-- policy: users can delete their own ai generations
create policy "users can delete own ai generations"
  on ai_generations
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own ai generations" on ai_generations is
  'allows authenticated users to delete only their own ai generation records';

-- ============================================
-- error_logs rls setup
-- ============================================

-- enable row level security
-- critical: even admin tables must have rls enabled
alter table error_logs enable row level security;

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
