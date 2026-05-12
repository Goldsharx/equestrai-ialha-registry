ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_type text,
  ADD COLUMN IF NOT EXISTS membership_expires date,
  ADD COLUMN IF NOT EXISTS ialha_member_id text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE POLICY "Staff can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update horses" ON public.horses
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update transfers" ON public.transfers
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view all transfers" ON public.transfers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert fees" ON public.fee_schedule
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update fees" ON public.fee_schedule
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));