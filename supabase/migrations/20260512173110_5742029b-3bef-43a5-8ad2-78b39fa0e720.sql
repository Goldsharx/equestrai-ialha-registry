
-- Expand transfers table for transfer wizard
ALTER TABLE public.transfers
  ALTER COLUMN to_owner_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sale_date date,
  ADD COLUMN IF NOT EXISTS is_gelded_at_transfer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS buyer_email text,
  ADD COLUMN IF NOT EXISTS buyer_phone text,
  ADD COLUMN IF NOT EXISTS buyer_address text,
  ADD COLUMN IF NOT EXISTS fee_amount numeric;

-- Seed fee schedule for transfers if not present
INSERT INTO public.fee_schedule (code, description, amount, currency, active)
SELECT 'TRANSFER', 'Ownership transfer fee', 75, 'USD', true
WHERE NOT EXISTS (SELECT 1 FROM public.fee_schedule WHERE code = 'TRANSFER');
