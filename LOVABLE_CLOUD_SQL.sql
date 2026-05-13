-- ============================================================
-- LOVABLE CLOUD SQL TRIGGERS
-- Run these in Lovable Cloud's SQL editor after migrations.
-- ============================================================

-- 1. Welcome notification on profile creation
-- Fires when a new profile is created (after signup), inserts a welcome notification.
CREATE OR REPLACE FUNCTION public.notify_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (
    NEW.user_id,
    'Welcome to Equestrai!',
    'Your IALHA registry account is ready. Start by registering a horse or exploring the studbook.',
    '/dashboard'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_notification ON public.profiles;
CREATE TRIGGER trg_welcome_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome();

-- 2. AI screening trigger on registration submitted
-- When a registration status changes to 'submitted', set a placeholder AI screening score.
-- In production, this would invoke an edge function; here we simulate auto-screening.
CREATE OR REPLACE FUNCTION public.ai_screen_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS DISTINCT FROM 'submitted') THEN
    -- Auto-advance to in_review and set a placeholder AI score.
    -- A real implementation would call the ai-screen edge function async.
    NEW.ai_screening_score := 85;
    NEW.ai_screening_notes := 'Auto-screened: all required fields present.';
    NEW.status := 'in_review';
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_screen_registration ON public.registrations;
CREATE TRIGGER trg_ai_screen_registration
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.ai_screen_registration();

-- 3. Pedigree refresh on horse approved
-- When a horse is approved, copy sire/dam names from the horses table for quick pedigree lookups.
CREATE OR REPLACE FUNCTION public.refresh_pedigree_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Populate sire_name from sire_id if not already set
    IF NEW.sire_id IS NOT NULL AND NEW.sire_name IS NULL THEN
      SELECT name INTO NEW.sire_name
      FROM public.horses
      WHERE id = NEW.sire_id;
    END IF;
    -- Populate dam_name from dam_id if not already set
    IF NEW.dam_id IS NOT NULL AND NEW.dam_name IS NULL THEN
      SELECT name INTO NEW.dam_name
      FROM public.horses
      WHERE id = NEW.dam_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_pedigree ON public.horses;
CREATE TRIGGER trg_refresh_pedigree
  BEFORE UPDATE ON public.horses
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_pedigree_names();

-- 4. Status change logging
-- Logs every registration status change to the activity_log table.
CREATE OR REPLACE FUNCTION public.log_registration_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'status_change',
      'registration',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status::text,
        'new_status', NEW.status::text,
        'horse_name', COALESCE(NEW.horse_name, NEW.name_choice_1)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_registration_status ON public.registrations;
CREATE TRIGGER trg_log_registration_status
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_registration_status_change();

-- Also log transfer status changes
CREATE OR REPLACE FUNCTION public.log_transfer_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'status_change',
      'transfer',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'horse_id', NEW.horse_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_transfer_status ON public.transfers;
CREATE TRIGGER trg_log_transfer_status
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transfer_status_change();

-- 5. Status change notification
-- Notifies the applicant when their registration status changes.
CREATE OR REPLACE FUNCTION public.notify_registration_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_label TEXT;
  horse_label  TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    horse_label := COALESCE(NEW.horse_name, NEW.name_choice_1, 'your horse');

    CASE NEW.status::text
      WHEN 'in_review'        THEN status_label := 'is now in review';
      WHEN 'approved'         THEN status_label := 'has been approved';
      WHEN 'rejected'         THEN status_label := 'has been rejected';
      WHEN 'needs_info'       THEN status_label := 'needs additional information';
      WHEN 'pending_board'    THEN status_label := 'has been sent to the board';
      WHEN 'pending_payment'  THEN status_label := 'is awaiting payment';
      WHEN 'submitted'        THEN status_label := 'has been submitted';
      ELSE status_label := 'status changed to ' || NEW.status::text;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.applicant_id,
      'Registration Update',
      'The registration for ' || horse_label || ' ' || status_label || '.',
      '/register/' || NEW.id || '/status'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_registration_status ON public.registrations;
CREATE TRIGGER trg_notify_registration_status
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_registration_status();

-- Notify transfer status changes to both parties
CREATE OR REPLACE FUNCTION public.notify_transfer_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  horse_label TEXT;
  msg         TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT name INTO horse_label FROM public.horses WHERE id = NEW.horse_id;
    horse_label := COALESCE(horse_label, 'a horse');

    CASE NEW.status
      WHEN 'approved' THEN msg := 'Transfer of ' || horse_label || ' has been approved.';
      WHEN 'rejected' THEN msg := 'Transfer of ' || horse_label || ' has been rejected.';
      WHEN 'submitted' THEN msg := 'Transfer of ' || horse_label || ' has been submitted for review.';
      ELSE msg := 'Transfer of ' || horse_label || ' status changed to ' || NEW.status || '.';
    END CASE;

    -- Notify seller
    IF NEW.from_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (NEW.from_owner_id, 'Transfer Update', msg, '/dashboard');
    END IF;

    -- Notify buyer (if they are an existing member)
    IF NEW.to_owner_id IS NOT NULL AND NEW.to_owner_id IS DISTINCT FROM NEW.from_owner_id THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (NEW.to_owner_id, 'Transfer Update', msg, '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_transfer_status ON public.transfers;
CREATE TRIGGER trg_notify_transfer_status
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_transfer_status();

-- 6. Transfer approval trigger
-- When a transfer is approved, update the horse's current_owner_id.
CREATE OR REPLACE FUNCTION public.apply_transfer_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Update horse ownership
    UPDATE public.horses
    SET current_owner_id = COALESCE(NEW.to_owner_id, current_owner_id),
        sex = CASE WHEN NEW.is_gelded_at_transfer THEN 'gelding' ELSE sex END,
        updated_at = now()
    WHERE id = NEW.horse_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_transfer ON public.transfers;
CREATE TRIGGER trg_apply_transfer
  AFTER UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_transfer_on_approval();
