-- migration: create_error_logs
-- description: creates the error_logs table for application and ai error tracking
-- tables affected: error_logs (new)
-- notes: no rls policies for regular users - admin access only via dashboard
--        automatic cleanup of logs older than 90 days (separate cron job)
--        user_id is nullable and set to null on user deletion for gdpr compliance

-- create error_logs table
-- stores application and ai errors for debugging and monitoring
-- accessible only to administrators, not end users
create table error_logs (
  id uuid primary key default gen_random_uuid(),

  -- nullable user_id: errors can be system-wide or user-specific
  -- set to null on user deletion (gdpr: anonymize logs)
  user_id uuid references profiles(id) on delete set null,

  -- error classification and details
  error_type varchar(100) not null,  -- e.g., 'ai_analysis_failed', 'validation_error'
  error_message text not null,

  -- structured error details (stack traces, request payloads, etc.)
  error_details jsonb,

  -- additional context (user agent, endpoint, etc.)
  context jsonb,

  created_at timestamptz default now() not null
);

comment on table error_logs is 'application and ai error logs (admin access only)';
comment on column error_logs.id is 'primary key';
comment on column error_logs.user_id is 'foreign key to profiles (nullable, set null on user deletion)';
comment on column error_logs.error_type is 'error classification (e.g., ai_analysis_failed, validation_error)';
comment on column error_logs.error_message is 'human-readable error message';
comment on column error_logs.error_details is 'structured error data (stack traces, payloads, etc.)';
comment on column error_logs.context is 'additional context (user agent, endpoint, request id, etc.)';
comment on column error_logs.created_at is 'timestamp when error occurred';

-- create indexes for efficient log browsing and cleanup
create index idx_error_logs_user_id on error_logs(user_id);
create index idx_error_logs_created on error_logs(created_at desc);
create index idx_error_logs_user_created on error_logs(user_id, created_at desc);

comment on index idx_error_logs_created is
  'optimizes browsing recent errors and cleanup of old logs';
comment on index idx_error_logs_user_created is
  'optimizes filtering errors by user and time';
