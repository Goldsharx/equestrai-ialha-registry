
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS fee_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fee_total numeric,
  ADD COLUMN IF NOT EXISTS ai_screening_score numeric,
  ADD COLUMN IF NOT EXISTS ai_screening_notes text,
  ADD COLUMN IF NOT EXISTS reviewer_notes text;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS fee_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  signer_user_id uuid,
  signer_name text NOT NULL,
  signer_email text,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant or signer can view signatures"
  ON public.signatures FOR SELECT TO authenticated
  USING (
    auth.uid() = signer_user_id
    OR EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = signatures.registration_id AND r.applicant_id = auth.uid())
  );

CREATE POLICY "Applicant can create signatures"
  ON public.signatures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = signatures.registration_id AND r.applicant_id = auth.uid()));

CREATE POLICY "Signer or applicant can update signatures"
  ON public.signatures FOR UPDATE TO authenticated
  USING (
    auth.uid() = signer_user_id
    OR EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = signatures.registration_id AND r.applicant_id = auth.uid())
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signatures;
