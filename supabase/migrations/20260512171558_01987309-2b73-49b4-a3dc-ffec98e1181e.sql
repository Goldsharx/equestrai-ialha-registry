-- Status enum for registrations
CREATE TYPE public.registration_status AS ENUM (
  'draft',
  'pending_signatures',
  'pending_payment',
  'submitted',
  'in_review',
  'approved',
  'rejected'
);

-- HORSES
CREATE TABLE public.horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  breed TEXT,
  sex TEXT CHECK (sex IN ('stallion','mare','gelding','colt','filly')),
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX horses_owner_idx ON public.horses(current_owner_id);

ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view horses"
  ON public.horses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can insert their horses"
  ON public.horses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = current_owner_id);

CREATE POLICY "Owners can update their horses"
  ON public.horses FOR UPDATE TO authenticated
  USING (auth.uid() = current_owner_id);

CREATE POLICY "Owners can delete their horses"
  ON public.horses FOR DELETE TO authenticated
  USING (auth.uid() = current_owner_id);

CREATE TRIGGER update_horses_updated_at
BEFORE UPDATE ON public.horses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REGISTRATIONS
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horse_id UUID REFERENCES public.horses(id) ON DELETE SET NULL,
  horse_name TEXT,
  status public.registration_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX registrations_applicant_idx ON public.registrations(applicant_id);
CREATE INDEX registrations_status_idx ON public.registrations(status);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view their registrations"
  ON public.registrations FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can create registrations"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update their registrations"
  ON public.registrations FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can delete their registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (auth.uid() = applicant_id);

CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;