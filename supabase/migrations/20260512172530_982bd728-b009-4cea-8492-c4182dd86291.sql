-- Extend registrations with wizard fields
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS name_choice_1 text,
  ADD COLUMN IF NOT EXISTS name_choice_2 text,
  ADD COLUMN IF NOT EXISTS name_choice_3 text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS sex text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS birth_country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS microchip_number text,
  ADD COLUMN IF NOT EXISTS dna_case_number text,
  ADD COLUMN IF NOT EXISTS sire_id uuid,
  ADD COLUMN IF NOT EXISTS dam_id uuid,
  ADD COLUMN IF NOT EXISTS sire_name text,
  ADD COLUMN IF NOT EXISTS dam_name text,
  ADD COLUMN IF NOT EXISTS foreign_registry_name text,
  ADD COLUMN IF NOT EXISTS foreign_registration_number text,
  ADD COLUMN IF NOT EXISTS breeder_name text,
  ADD COLUMN IF NOT EXISTS breeder_contact text,
  ADD COLUMN IF NOT EXISTS stallion_owner_name text,
  ADD COLUMN IF NOT EXISTS stallion_owner_contact text;

-- Add breed_type to horses for parentage filtering
ALTER TABLE public.horses
  ADD COLUMN IF NOT EXISTS breed_type text;

-- updated_at trigger on registrations
DROP TRIGGER IF EXISTS update_registrations_updated_at ON public.registrations;
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);