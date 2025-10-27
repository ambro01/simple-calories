-- migration: create_profiles
-- description: creates the profiles table as a bridge between auth.users and app logic
-- tables affected: profiles (new)
-- notes: this table follows supabase best practice of separating auth from app data
--        profile is automatically created via trigger when user registers

-- create profiles table
-- acts as a bridge between supabase auth and application logic
-- maintains a 1:1 relationship with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table profiles is 'user profiles - bridge between supabase auth and app logic';
comment on column profiles.id is 'foreign key to auth.users, primary key';
comment on column profiles.created_at is 'timestamp when profile was created';
comment on column profiles.updated_at is 'timestamp when profile was last updated';

-- enable row level security
-- critical: all user data tables must have rls enabled for data isolation
alter table profiles enable row level security;

-- rls policy: allow users to view their own profile
create policy "users can view own profile"
  on profiles
  for select
  to authenticated
  using (id = auth.uid());

comment on policy "users can view own profile" on profiles is
  'allows authenticated users to view only their own profile data';

-- rls policy: allow users to update their own profile
create policy "users can update own profile"
  on profiles
  for update
  to authenticated
  using (id = auth.uid());

comment on policy "users can update own profile" on profiles is
  'allows authenticated users to update only their own profile data';

-- note: insert and delete are managed by triggers, not directly by users
-- profiles are created automatically via handle_new_user trigger
-- profiles are deleted automatically via cascade when auth.users record is deleted
