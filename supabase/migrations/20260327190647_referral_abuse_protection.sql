-- Migration to add unique constraint to referrals table to prevent abuse
-- (user_id, referral_code) uniqueness is already mostly handled by CONSTRAINT unique_referred_user (referred_user_id)
-- But we want to ensure (referred_user_id, referral_code_id) is also protected.
-- Actually, the request specifically asked for unique constraint: (user_id, referral_code) on referral uses.
-- In our schema: user_id is referred_user_id, referral_code is referral_code_id.

ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS unique_referred_user;
ALTER TABLE public.referrals ADD CONSTRAINT unique_referral_use UNIQUE (referred_user_id, referral_code_id);
