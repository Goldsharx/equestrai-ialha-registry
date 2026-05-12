-- Roles
CREATE TYPE public.app_role AS ENUM ('member','staff','registrar','admin','board');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('staff','registrar','admin')
  );
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend registration_status
ALTER TYPE public.registration_status ADD VALUE IF NOT EXISTS 'needs_info';
ALTER TYPE public.registration_status ADD VALUE IF NOT EXISTS 'pending_board';

-- Add AI screening detail + reviewer fields on registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS ai_screening_result jsonb DEFAULT '{}'::jsonb;

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all activity" ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Authenticated can insert activity" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

-- Staff RLS additions
CREATE POLICY "Staff can view all registrations" ON public.registrations
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update all registrations" ON public.registrations
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));