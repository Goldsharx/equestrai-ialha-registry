import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type StaffRole = "staff" | "registrar" | "admin";

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
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) {
        toast.error("Could not verify access");
        navigate({ to: "/dashboard" });
        return;
      }
      const allowed = (data ?? [])
        .map((r) => r.role as string)
        .filter((r): r is StaffRole => r === "staff" || r === "registrar" || r === "admin");
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
