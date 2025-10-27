-- migration: disable_rls
-- description: disables row level security on all tables
-- tables affected: profiles, calorie_goals, meals, error_logs
-- notes: completely disables rls, allowing full access without policy checks
--        warning: this removes all data isolation between users
--        use only for development/testing, never in production

-- ============================================
-- disable rls on profiles table
-- ============================================

-- disable row level security
-- allows all users to access all profile records without restrictions
alter table profiles disable row level security;

-- ============================================
-- disable rls on calorie_goals table
-- ============================================

-- disable row level security
-- allows all users to access all calorie goal records without restrictions
alter table calorie_goals disable row level security;

-- ============================================
-- disable rls on meals table
-- ============================================

-- disable row level security
-- allows all users to access all meal records without restrictions
alter table meals disable row level security;

-- ============================================
-- disable rls on error_logs table
-- ============================================

-- disable row level security
-- allows all users to access all error log records without restrictions
alter table error_logs disable row level security;

-- ============================================
-- warning
-- ============================================

-- warning: rls is now completely disabled on all tables
-- any authenticated user can read, modify, and delete any data
-- there is no data isolation between users
-- this is suitable for:
--   - local development
--   - testing environments
--   - single-user applications
--
-- this is NOT suitable for:
--   - production environments with multiple users
--   - any application requiring data privacy
--   - compliance with gdpr or similar regulations
--
-- to re-enable rls and restore data isolation:
--   alter table [table_name] enable row level security;
--   then create appropriate policies
