-- migration: create_triggers
-- description: creates database triggers for automated behavior
-- triggers: handle_new_user, update_updated_at (x3 tables)
-- notes: triggers execute automatically on specified events

-- trigger: on_auth_user_created
-- table: auth.users
-- event: after insert
-- function: handle_new_user()
-- description: automatically creates profile and default calorie goal when user registers
-- notes: executes in same transaction as user creation (atomic)
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- note: cannot add comment on trigger for auth.users (no owner permissions)
-- description already provided in migration comments above

-- trigger: update_meals_updated_at
-- table: meals
-- event: before update
-- function: update_updated_at_column()
-- description: automatically updates updated_at timestamp when meal is modified
create trigger update_meals_updated_at
  before update on meals
  for each row
  execute function update_updated_at_column();

comment on trigger update_meals_updated_at on meals is
  'automatically updates updated_at timestamp when meal record is modified';

-- trigger: update_profiles_updated_at
-- table: profiles
-- event: before update
-- function: update_updated_at_column()
-- description: automatically updates updated_at timestamp when profile is modified
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

comment on trigger update_profiles_updated_at on profiles is
  'automatically updates updated_at timestamp when profile record is modified';

-- trigger: update_calorie_goals_updated_at
-- table: calorie_goals
-- event: before update
-- function: update_updated_at_column()
-- description: automatically updates updated_at timestamp when calorie goal is modified
create trigger update_calorie_goals_updated_at
  before update on calorie_goals
  for each row
  execute function update_updated_at_column();

comment on trigger update_calorie_goals_updated_at on calorie_goals is
  'automatically updates updated_at timestamp when calorie goal record is modified';
