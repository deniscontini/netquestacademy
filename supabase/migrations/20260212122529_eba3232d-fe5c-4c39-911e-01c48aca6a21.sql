
-- Step 1: Add 'master' to app_role enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';
