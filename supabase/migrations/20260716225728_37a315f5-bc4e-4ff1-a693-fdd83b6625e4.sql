CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add unique constraint for milestone_state upserts used by detector
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_state_user_account_metric_key'
  ) THEN
    ALTER TABLE public.milestone_state
      ADD CONSTRAINT milestone_state_user_account_metric_key
      UNIQUE (user_id, account_id, metric);
  END IF;
END $$;