-- ============================================================
-- Equestrai / IALHA Registry — Database Triggers
-- Run this in Lovable Cloud's SQL Editor (Supabase dashboard)
-- ============================================================

-- 1. Welcome notification on profile creation
-- When a new profile row is inserted (after sign-up), send a welcome notification.
CREATE OR REPLACE FUNCTION public.notify_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (
    NEW.user_id,
    'Welcome to Equestrai!',
    'Your IALHA member profile has been created. Start by registering a horse or exploring the studbook.',
    '/dashboard'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_welcome ON public.profiles;
CREATE TRIGGER trg_profile_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome();


-- 2. AI screening on registration submitted
-- When a registration status changes to 'submitted', invoke the ai-screen-registration edge function.
CREATE OR REPLACE FUNCTION public.trigger_ai_screening()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS DISTINCT FROM 'submitted') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/ai-screen-registration',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('registration_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_ai_screen ON public.registrations;
CREATE TRIGGER trg_registration_ai_screen
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted')
  EXECUTE FUNCTION public.trigger_ai_screening();


-- 3. Pedigree refresh on horse approved
-- When a horse is approved, invoke the pedigree-refresh edge function to hydrate ancestors.
CREATE OR REPLACE FUNCTION public.trigger_pedigree_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/pedigree-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('horse_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_horse_pedigree_refresh ON public.horses;
CREATE TRIGGER trg_horse_pedigree_refresh
  AFTER UPDATE ON public.horses
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
  EXECUTE FUNCTION public.trigger_pedigree_refresh();


-- 4. Status change logging
-- Log every status change on registrations and transfers to an audit table.
CREATE TABLE IF NOT EXISTS public.status_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid
);

CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_change_log (table_name, record_id, old_status, new_status, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_status_log ON public.registrations;
CREATE TRIGGER trg_registration_status_log
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_status_change();

DROP TRIGGER IF EXISTS trg_transfer_status_log ON public.transfers;
CREATE TRIGGER trg_transfer_status_log
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_status_change();


-- 5. Status change notification
-- Notify the applicant / owner when a registration or transfer status changes.
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _label text;
  _link text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'registrations' THEN
    _user_id := NEW.applicant_id;
    _label := coalesce(NEW.horse_name, NEW.name_choice_1, 'your registration');
    _link := '/register/' || NEW.id || '/status';
  ELSIF TG_TABLE_NAME = 'transfers' THEN
    _user_id := NEW.from_owner_id;
    _label := 'your transfer';
    _link := '/transfer/' || NEW.id || '/pay';
  END IF;

  IF _user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      _user_id,
      initcap(TG_TABLE_NAME) || ' status updated',
      'The status of ' || _label || ' changed from '
        || coalesce(OLD.status, 'new') || ' to ' || NEW.status || '.',
      _link
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_status_notify ON public.registrations;
CREATE TRIGGER trg_registration_status_notify
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_status_change();

DROP TRIGGER IF EXISTS trg_transfer_status_notify ON public.transfers;
CREATE TRIGGER trg_transfer_status_notify
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_status_change();


-- 6. Transfer approval — update horse owner
-- When a transfer is approved, update the horse's current_owner_id to the buyer.
CREATE OR REPLACE FUNCTION public.transfer_update_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.horses
    SET current_owner_id = NEW.to_owner_id,
        updated_at = now()
    WHERE id = NEW.horse_id;

    -- Notify the new owner
    IF NEW.to_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        NEW.to_owner_id,
        'Horse transferred to you',
        'A horse has been transferred to your ownership. Check your horses page for details.',
        '/horses'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transfer_approve_owner ON public.transfers;
CREATE TRIGGER trg_transfer_approve_owner
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
  EXECUTE FUNCTION public.transfer_update_owner();
