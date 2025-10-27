-- migration: create_functions
-- description: creates postgresql functions for business logic
-- functions: get_current_calorie_goal, update_updated_at_column, handle_new_user
-- notes: functions use security definer to bypass rls for internal logic

-- function: get_current_calorie_goal
-- description: retrieves the current calorie goal for a user on a specific date
-- parameters:
--   user_uuid: uuid of the user
--   target_date: date to find goal for (defaults to current_date)
-- returns: integer (daily calorie goal in kcal)
-- notes:
--   - returns most recent goal where effective_from <= target_date
--   - fallback to 2000 kcal if no goal found (defensive programming)
--   - stable: function doesn't modify data (optimizer can cache)
--   - security definer: runs with creator privileges (bypasses rls)
create or replace function get_current_calorie_goal(
  user_uuid uuid,
  target_date date default current_date
) returns integer as $$
declare
  goal integer;
begin
  -- find the most recent goal effective on or before target_date
  select daily_goal into goal
  from calorie_goals
  where user_id = user_uuid
    and effective_from <= target_date
  order by effective_from desc
  limit 1;

  -- return found goal or default to 2000 kcal
  -- default prevents null values in calculations (e.g., percentage in views)
  return coalesce(goal, 2000);
end;
$$ language plpgsql stable security definer;

comment on function get_current_calorie_goal(uuid, date) is
  'returns current calorie goal for user on target date, defaults to 2000 kcal if not found';

-- function: update_updated_at_column
-- description: trigger function to automatically update updated_at timestamp
-- usage: attached as before update trigger to tables with updated_at column
-- notes: reusable for all tables (profiles, calorie_goals, meals)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column() is
  'trigger function to automatically update updated_at timestamp on row updates';

-- function: handle_new_user
-- description: trigger function to setup new user on registration
-- creates:
--   1. profile record (1:1 with auth.users)
--   2. default calorie goal (2000 kcal, effective from current_date)
-- notes:
--   - executes in single transaction (atomic)
--   - security definer: runs with creator privileges (bypasses rls)
--   - exception: default goal has effective_from = current_date (not +1 day)
create or replace function handle_new_user()
returns trigger as $$
begin
  -- create profile for new user
  -- maintains 1:1 relationship with auth.users
  insert into profiles (id, created_at, updated_at)
  values (new.id, now(), now());

  -- create default calorie goal (2000 kcal from today)
  -- note: this is the only goal with effective_from = current_date
  -- all subsequent goals will have effective_from = current_date + 1
  insert into calorie_goals (user_id, daily_goal, effective_from, created_at, updated_at)
  values (new.id, 2000, current_date, now(), now());

  return new;
end;
$$ language plpgsql security definer;

comment on function handle_new_user() is
  'trigger function to create profile and default calorie goal (2000 kcal) for new users';
