-- migration: create_views
-- description: creates database views for simplified data access
-- views: daily_progress
-- notes: regular view (not materialized) for mvp simplicity

-- view: daily_progress
-- description: aggregates daily meal data with calorie goal comparison
-- columns:
--   - date: day of meals (utc date grouping)
--   - user_id: user identifier
--   - total_calories: sum of calories for the day
--   - total_protein: sum of protein for the day (nullable)
--   - total_carbs: sum of carbs for the day (nullable)
--   - total_fats: sum of fats for the day (nullable)
--   - calorie_goal: user's goal for that specific day (from history)
--   - percentage: achievement percentage (0-100+, rounded to 1 decimal)
-- usage:
--   - dashboard: list of days with progress
--   - day view: summary for specific day
-- notes:
--   - utc date grouping (frontend converts to local time)
--   - rls inherited from meals table (users see only their data)
--   - uses get_current_calorie_goal() for historical goal accuracy
--   - regular view (not materialized) - sufficient for mvp
create view daily_progress as
select
  date(meal_timestamp) as date,
  user_id,
  sum(calories) as total_calories,
  sum(protein) as total_protein,
  sum(carbs) as total_carbs,
  sum(fats) as total_fats,
  get_current_calorie_goal(user_id, date(meal_timestamp)) as calorie_goal,
  round(sum(calories) * 100.0 / get_current_calorie_goal(user_id, date(meal_timestamp)), 1) as percentage
from meals
group by date(meal_timestamp), user_id;

comment on view daily_progress is
  'aggregated daily meal data with calorie goal comparison and achievement percentage';

-- note on rls inheritance
-- daily_progress view automatically inherits rls from meals table
-- users can only see their own data via where user_id = auth.uid()
-- no separate policies needed for views

-- usage examples:
--
-- dashboard (last 30 days):
-- select * from daily_progress
-- where user_id = auth.uid()
-- order by date desc
-- limit 30;
--
-- specific day:
-- select * from daily_progress
-- where user_id = auth.uid()
--   and date = '2025-01-27';
--
-- calculate color status (frontend logic):
-- - gray: total_calories < calorie_goal
-- - green: abs(total_calories - calorie_goal) <= 100
-- - orange: total_calories > calorie_goal + 100
