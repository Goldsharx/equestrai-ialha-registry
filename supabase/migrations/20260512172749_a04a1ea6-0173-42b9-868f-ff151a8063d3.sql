-- horse_photos: allow draft (no horse yet) and add type
ALTER TABLE public.horse_photos
  ALTER COLUMN horse_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS photo_type text;

-- Owners/applicants can manage draft photos via registration ownership
DROP POLICY IF EXISTS "Owners can insert horse photos" ON public.horse_photos;
CREATE POLICY "Users can insert horse photos"
  ON public.horse_photos FOR INSERT TO authenticated
  WITH CHECK (
    (horse_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()))
    OR (registration_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.applicant_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Owners can delete horse photos" ON public.horse_photos;
CREATE POLICY "Users can delete horse photos"
  ON public.horse_photos FOR DELETE TO authenticated
  USING (
    (horse_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()))
    OR (registration_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.applicant_id = auth.uid()))
  );

-- registrations: markings + terms + add-ons
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS markings_description text,
  ADD COLUMN IF NOT EXISTS no_markings boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS add_ons jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Public photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fee schedule
CREATE TABLE IF NOT EXISTS public.fee_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read fee schedule"
  ON public.fee_schedule FOR SELECT TO authenticated USING (active);

INSERT INTO public.fee_schedule (code, description, amount) VALUES
  ('reg_purebred_ialha', 'Purebred (IALHA-Bred) Registration', 150),
  ('reg_purebred_foreign', 'Purebred (Foreign-Bred) Registration', 250),
  ('reg_half_bred', 'Half-Bred Registration', 100),
  ('late_fee', 'Late Registration Fee (born >2 yrs ago)', 75),
  ('addon_dna_kit', 'DNA Kit', 50),
  ('addon_microchip', 'Microchip', 75),
  ('addon_expedited', 'Expedited Processing', 100)
ON CONFLICT (code) DO NOTHING;