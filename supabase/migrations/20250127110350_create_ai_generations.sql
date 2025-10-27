-- migration: create_ai_generations
-- description: creates the ai_generations table for tracking full history of ai meal generations
-- tables affected: ai_generations (new)
-- notes: stores complete history of all ai invocations for analytics and debugging
--        meal_id is nullable - null before user accepts, updated after acceptance
--        enables tracking: regenerations, model performance, user edits

-- create ai_generations table
-- stores full history of ai generation requests and responses
-- allows analysis of ai performance, user behavior, and model comparison
create table ai_generations (
  id uuid primary key default gen_random_uuid(),

  -- nullable meal_id: null before user accepts, updated after acceptance
  meal_id uuid references meals(id) on delete cascade,

  -- always has user_id for ownership and cleanup
  user_id uuid not null references profiles(id) on delete cascade,

  -- input data from user
  prompt text not null,

  -- ai-generated nutritional values
  -- nullable because generation may fail
  generated_calories integer check (generated_calories > 0 and generated_calories <= 10000),
  generated_protein decimal(6,2) check (generated_protein >= 0 and generated_protein <= 1000),
  generated_carbs decimal(6,2) check (generated_carbs >= 0 and generated_carbs <= 1000),
  generated_fats decimal(6,2) check (generated_fats >= 0 and generated_fats <= 1000),

  -- ai assumptions displayed to user (e.g., "large bowl = 450ml")
  assumptions text,

  -- generation metadata for monitoring and debugging
  model_used varchar(100),                         -- e.g., 'gpt-4', 'claude-3-sonnet'
  generation_duration integer,                     -- time in milliseconds
  status ai_generation_status not null default 'pending',
  error_message text,                              -- populated if status = 'failed'

  created_at timestamptz default now() not null
);

comment on table ai_generations is 'full history of ai meal generation requests and responses';
comment on column ai_generations.id is 'primary key';
comment on column ai_generations.meal_id is 'foreign key to meals (nullable until user accepts)';
comment on column ai_generations.user_id is 'foreign key to profiles';
comment on column ai_generations.prompt is 'original user description for ai analysis';
comment on column ai_generations.generated_calories is 'ai-generated calories (nullable if generation failed)';
comment on column ai_generations.generated_protein is 'ai-generated protein in grams (optional)';
comment on column ai_generations.generated_carbs is 'ai-generated carbs in grams (optional)';
comment on column ai_generations.generated_fats is 'ai-generated fats in grams (optional)';
comment on column ai_generations.assumptions is 'ai assumptions about portions/sizes';
comment on column ai_generations.model_used is 'ai model identifier (gpt-4, claude-3-sonnet, etc)';
comment on column ai_generations.generation_duration is 'time taken for ai to generate response in milliseconds';
comment on column ai_generations.status is 'generation status: pending, completed, failed';
comment on column ai_generations.error_message is 'error details if status = failed';
comment on column ai_generations.created_at is 'timestamp when generation was initiated';

-- create indexes for efficient queries
create index idx_ai_generations_meal_id on ai_generations(meal_id);
create index idx_ai_generations_user_id on ai_generations(user_id);

-- compound index for fetching latest generation for a meal
create index idx_ai_generations_meal_created on ai_generations(meal_id, created_at desc);

-- compound index for user's generation history
create index idx_ai_generations_user_created on ai_generations(user_id, created_at desc);

comment on index idx_ai_generations_meal_created is
  'optimizes queries for fetching latest ai generation for a meal';
comment on index idx_ai_generations_user_created is
  'optimizes queries for user ai generation history and analytics';
