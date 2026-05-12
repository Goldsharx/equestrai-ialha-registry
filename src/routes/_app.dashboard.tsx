import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowLeftRight,
  Bell,
  FilePlus,
  MessageSquare,
  Rabbit,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EquestRai" },
      { name: "description", content: "Your IALHA registry dashboard." },
    ],
  }),
  component: DashboardPage,
});

type StatusKey =
  | "draft"
  | "pending_signatures"
  | "pending_payment"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "needs_info"
  | "pending_board";

const statusClasses: Record<StatusKey, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending_signatures: "bg-yellow-100 text-yellow-900 border-yellow-300",
  pending_payment: "bg-orange-100 text-orange-900 border-orange-300",
  submitted: "bg-blue-100 text-blue-900 border-blue-300",
  in_review: "bg-purple-100 text-purple-900 border-purple-300",
  approved: "bg-green-100 text-green-900 border-green-300",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  needs_info: "bg-amber-100 text-amber-900 border-amber-300",
  pending_board: "bg-indigo-100 text-indigo-900 border-indigo-300",
};

function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const horsesQuery = useQuery({
    enabled: !!userId,
    queryKey: ["dashboard", "horses", userId],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("horses")
        .select("id, name", { count: "exact" })
        .eq("current_owner_id", userId!)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return { items: data ?? [], count: count ?? 0 };
    },
  });

  const registrationsQuery = useQuery({
    enabled: !!userId,
    queryKey: ["dashboard", "registrations", userId],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("registrations")
        .select("id, horse_name, status, updated_at", { count: "exact" })
        .eq("applicant_id", userId!)
        .not("status", "in", "(approved,rejected)")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return { items: data ?? [], count: count ?? 0 };
    },
  });

  const notificationsQuery = useQuery({
    enabled: !!userId,
    queryKey: ["dashboard", "notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, link, read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime: invalidate notifications on any change
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard", "notifications", userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Horses */}
        <DashboardCard
          icon={Rabbit}
          title="My Horses"
          count={horsesQuery.data?.count}
          loading={horsesQuery.isLoading}
          footer={
            <Link to="/horses" className="inline-flex items-center text-sm font-semibold text-primary hover:text-accent-foreground">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          }
        >
          {horsesQuery.data?.items.length ? (
            <ul className="divide-y">
              {horsesQuery.data.items.map((h) => (
                <li key={h.id}>
                  <Link
                    to="/horses"
                    className="flex items-center justify-between py-2.5 text-sm text-foreground hover:text-accent-foreground"
                  >
                    <span className="font-medium">{h.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No horses registered yet." />
          )}
        </DashboardCard>

        {/* Pending Applications */}
        <DashboardCard
          icon={FilePlus}
          title="Pending Applications"
          count={registrationsQuery.data?.count}
          loading={registrationsQuery.isLoading}
          footer={
            <Link to="/register" className="inline-flex items-center text-sm font-semibold text-primary hover:text-accent-foreground">
              Start a new registration <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          }
        >
          {registrationsQuery.data?.items.length ? (
            <ul className="divide-y">
              {registrationsQuery.data.items.map((r) => {
                const style = statusStyles[r.status as RegistrationStatus];
                return (
                  <li key={r.id}>
                    <Link
                      to="/register"
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-accent-foreground"
                    >
                      <span className="truncate font-medium">
                        {r.horse_name ?? "Untitled application"}
                      </span>
                      <Badge variant="outline" className={cn("shrink-0 border", style.className)}>
                        {style.label}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState text="No pending applications." />
          )}
        </DashboardCard>

        {/* Recent Notifications */}
        <DashboardCard
          icon={Bell}
          title="Recent Notifications"
          loading={notificationsQuery.isLoading}
          footer={
            <Link to="/notifications" className="inline-flex items-center text-sm font-semibold text-primary hover:text-accent-foreground">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          }
        >
          {notificationsQuery.data?.length ? (
            <ul className="space-y-2">
              {notificationsQuery.data.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-md border bg-background/50 px-3 py-2 text-sm",
                    !n.read && "border-l-4 border-l-accent",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{n.title}</p>
                    <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="You're all caught up." />
          )}
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard icon={ArrowRight} title="Quick Actions">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickAction to="/register" icon={FilePlus} label="Register a Horse" primary />
            <QuickAction to="/transfer" icon={ArrowLeftRight} label="Transfer Ownership" />
            <QuickAction to="/studbook" icon={Search} label="Search Studbook" />
            <QuickAction to="/chat" icon={MessageSquare} label="AI Chat" />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  count,
  loading,
  footer,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  loading?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-lg text-primary">{title}</h2>
        </div>
        {typeof count === "number" && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            {count}
          </span>
        )}
      </header>
      <div className="mt-4 flex-1">
        {loading ? (
          <div className="h-16 animate-pulse rounded-md bg-muted/60" />
        ) : (
          children
        )}
      </div>
      {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
    </section>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Button
      asChild
      variant={primary ? "default" : "outline"}
      className={cn(
        "h-auto justify-start gap-2 py-3",
        primary
          ? "bg-accent text-accent-foreground hover:bg-accent/90"
          : "border-border hover:border-accent hover:bg-accent/10",
      )}
    >
      <Link to={to}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </Link>
    </Button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-2 text-sm text-muted-foreground">{text}</p>;
}

