-- migration: update_profile_trigger
-- description: Updates handle_new_user() to only create calorie_goal when profile is created
--              Removes auth.users trigger (causes permission issues)
--              Adds profiles trigger instead
-- reason: Profile creation moved to application layer to avoid cross-schema permission issues

-- Drop old trigger on auth.users (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user() function to only create calorie_goal
-- Trigger will be on profiles.INSERT instead of auth.users.INSERT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- create default calorie goal (2000 kcal from today)
  -- note: this is the only goal with effective_from = current_date
  -- all subsequent goals will have effective_from = current_date + 1
  INSERT INTO calorie_goals (user_id, daily_goal, effective_from, created_at, updated_at)
  VALUES (new.id, 2000, current_date, now(), now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS
  'trigger function to create default calorie goal (2000 kcal) when profile is created';

-- Create trigger on profiles table (AFTER INSERT)
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON TRIGGER on_profile_created ON profiles IS
  'automatically creates default calorie goal (2000 kcal) when profile is created';
