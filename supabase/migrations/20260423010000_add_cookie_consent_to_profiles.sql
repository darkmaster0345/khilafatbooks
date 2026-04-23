-- Add cookie_consent column to profiles table
alter table profiles
add column if not exists cookie_consent jsonb;

-- Add comment explaining the column
comment on column profiles.cookie_consent is 'Stores user cookie consent preferences as JSON';
