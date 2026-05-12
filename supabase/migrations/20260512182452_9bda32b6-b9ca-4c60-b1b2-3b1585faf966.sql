-- Generated tsvector column for full-text search
ALTER TABLE public.horses
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(name, '') || ' ' ||
      coalesce(registration_number, '') || ' ' ||
      coalesce(sire_name, '') || ' ' ||
      coalesce(dam_name, '') || ' ' ||
      coalesce(breed, '') || ' ' ||
      coalesce(color, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS horses_fts_idx ON public.horses USING GIN (fts);

-- Allow anonymous (public) users to read approved horses
DROP POLICY IF EXISTS "Anyone can view approved horses" ON public.horses;
CREATE POLICY "Anyone can view approved horses"
ON public.horses
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Allow anonymous read of photos for approved horses (used in studbook profile)
DROP POLICY IF EXISTS "Anyone can view photos of approved horses" ON public.horse_photos;
CREATE POLICY "Anyone can view photos of approved horses"
ON public.horse_photos
FOR SELECT
TO anon, authenticated
USING (
  horse_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.horses h
    WHERE h.id = horse_photos.horse_id AND h.status = 'approved'
  )
);