import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type StaffRole = "staff" | "registrar" | "admin";

const STAFF_ROLES: StaffRole[] = ["staff", "registrar", "admin"];

export function useStaffGuard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [roles, setRoles] = useState<StaffRole[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      let allowed: StaffRole[] = [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("[useStaffGuard] user_roles query failed", error);
      } else {
        allowed = (data ?? [])
          .map((r) => r.role as string)
          .filter((r): r is StaffRole => STAFF_ROLES.includes(r as StaffRole));
      }

      // Fallback: check profiles.role
      if (allowed.length === 0) {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profErr) {
          console.error("[useStaffGuard] profiles fallback failed", profErr);
        } else if (prof?.role && STAFF_ROLES.includes(prof.role as StaffRole)) {
          allowed = [prof.role as StaffRole];
          console.warn("[useStaffGuard] using profiles.role fallback", prof.role);
        }
      }

      if (allowed.length === 0) {
        toast.error("Staff access required");
        navigate({ to: "/dashboard" });
        return;
      }
      setRoles(allowed);
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  return { checking, roles, user };
}
