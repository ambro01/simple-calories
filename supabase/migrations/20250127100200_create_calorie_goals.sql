-- migration: create_calorie_goals
-- description: creates the calorie_goals table for tracking historical calorie goals
-- tables affected: calorie_goals (new)
-- notes: maintains history of calorie goals so changing goal doesn't affect past days
--        effective_from is always set to current_date + 1 by application logic
--        exception: default goal on registration has effective_from = current_date

-- create calorie_goals table
-- stores historical calorie goals with effective dates
-- allows proper calculation of goal achievement for past days
create table calorie_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  daily_goal integer not null check (daily_goal > 0 and daily_goal <= 10000),
  effective_from date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- ensure one goal per user per effective date
  constraint unique_user_effective_date unique(user_id, effective_from)
);

comment on table calorie_goals is 'historical calorie goals with effective dates';
comment on column calorie_goals.id is 'primary key';
comment on column calorie_goals.user_id is 'foreign key to profiles';
comment on column calorie_goals.daily_goal is 'daily calorie goal in kcal (1-10000)';
comment on column calorie_goals.effective_from is 'date when this goal becomes effective (usually current_date + 1)';
comment on column calorie_goals.created_at is 'timestamp when goal was created';
comment on column calorie_goals.updated_at is 'timestamp when goal was last updated';

-- create index for efficient goal lookups
-- compound index supports queries filtering by user and sorting by date
create index idx_calorie_goals_user_id on calorie_goals(user_id);
create index idx_calorie_goals_user_date on calorie_goals(user_id, effective_from desc);

comment on index idx_calorie_goals_user_date is
  'optimizes queries for finding current goal (most recent effective_from <= target_date)';

-- enable row level security
alter table calorie_goals enable row level security;

-- rls policy: allow users to view their own goals
create policy "users can view own goals"
  on calorie_goals
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can view own goals" on calorie_goals is
  'allows authenticated users to view only their own calorie goals';

-- rls policy: allow users to insert their own goals
create policy "users can insert own goals"
  on calorie_goals
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "users can insert own goals" on calorie_goals is
  'allows authenticated users to create calorie goals only for themselves';

-- rls policy: allow users to update their own goals
create policy "users can update own goals"
  on calorie_goals
  for update
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can update own goals" on calorie_goals is
  'allows authenticated users to update only their own calorie goals';

-- rls policy: allow users to delete their own goals
create policy "users can delete own goals"
  on calorie_goals
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "users can delete own goals" on calorie_goals is
  'allows authenticated users to delete only their own calorie goals';
