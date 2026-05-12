-- Extend horses table with additional fields
ALTER TABLE public.horses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS birth_country text,
  ADD COLUMN IF NOT EXISTS dna_status text,
  ADD COLUMN IF NOT EXISTS microchip_number text,
  ADD COLUMN IF NOT EXISTS markings_image_url text,
  ADD COLUMN IF NOT EXISTS markings_description text,
  ADD COLUMN IF NOT EXISTS certificate_url text,
  ADD COLUMN IF NOT EXISTS sire_id uuid,
  ADD COLUMN IF NOT EXISTS dam_id uuid,
  ADD COLUMN IF NOT EXISTS sire_name text,
  ADD COLUMN IF NOT EXISTS dam_name text;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_horse_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('approved','pending','suspended','deceased') THEN
    RAISE EXCEPTION 'Invalid horse status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_horse_status_trigger ON public.horses;
CREATE TRIGGER validate_horse_status_trigger
  BEFORE INSERT OR UPDATE ON public.horses
  FOR EACH ROW EXECUTE FUNCTION public.validate_horse_status();

-- Horse photos table
CREATE TABLE IF NOT EXISTS public.horse_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id uuid NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.horse_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view horse photos"
  ON public.horse_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can insert horse photos"
  ON public.horse_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()));
CREATE POLICY "Owners can delete horse photos"
  ON public.horse_photos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()));

-- Transfers (ownership history)
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id uuid NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  from_owner_id uuid,
  to_owner_id uuid NOT NULL,
  from_owner_name text,
  to_owner_name text,
  transfer_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view transfers"
  ON public.transfers FOR SELECT TO authenticated
  USING (auth.uid() = from_owner_id OR auth.uid() = to_owner_id
    OR EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()));
CREATE POLICY "Owners can create transfers"
  ON public.transfers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_owner_id);

-- Foreign documents
CREATE TABLE IF NOT EXISTS public.foreign_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id uuid NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  document_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.foreign_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view foreign documents"
  ON public.foreign_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage foreign documents"
  ON public.foreign_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()));
CREATE POLICY "Owners can delete foreign documents"
  ON public.foreign_documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.horses h WHERE h.id = horse_id AND h.current_owner_id = auth.uid()));

-- updated_at trigger on horses
DROP TRIGGER IF EXISTS update_horses_updated_at ON public.horses;
CREATE TRIGGER update_horses_updated_at
  BEFORE UPDATE ON public.horses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();