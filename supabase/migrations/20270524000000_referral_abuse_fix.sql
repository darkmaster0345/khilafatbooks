-- Add unique constraint to prevent multiple referrals for the same user-code combination
-- The table already has a unique constraint on referred_user_id, but the task specifies (user_id, referral_code)
-- Since referred_user_id is already unique, the (referred_user_id, referral_code_id) is also implicitly unique,
-- but we'll add it explicitly as requested by the task requirements for absolute clarity.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_referral_user_code'
    ) THEN
        ALTER TABLE public.referrals ADD CONSTRAINT unique_referral_user_code UNIQUE (referred_user_id, referral_code_id);
    END IF;
END $$;
