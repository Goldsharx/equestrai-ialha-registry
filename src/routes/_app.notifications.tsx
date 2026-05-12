import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, CheckCircle2, AlertTriangle, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

type Filter = "all" | "registrations" | "transfers" | "system";

function classify(n: Notification): { kind: Filter; tone: "info" | "success" | "warning" } {
  const link = n.link ?? "";
  const t = (n.title + " " + (n.body ?? "")).toLowerCase();
  let kind: Filter = "system";
  if (link.includes("/register") || t.includes("registration")) kind = "registrations";
  else if (link.includes("/transfer") || t.includes("transfer")) kind = "transfers";
  let tone: "info" | "success" | "warning" = "info";
  if (t.match(/approved|success|complete|paid/)) tone = "success";
  else if (t.match(/reject|fail|warning|needs|action|expire/)) tone = "warning";
  return { kind, tone };
}

function ToneIcon({ tone }: { tone: "info" | "success" | "warning" }) {
  if (tone === "success") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (tone === "warning") return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  return <Info className="h-5 w-5 text-sky-600" />;
}

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — EquestRai" },
      { name: "description", content: "Your IALHA registry notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error(t("notif.loadFailed"));
      else setItems((data ?? []) as Notification[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") return [payload.new as Notification, ...prev];
            if (payload.eventType === "UPDATE")
              return prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n));
            if (payload.eventType === "DELETE")
              return prev.filter((n) => n.id !== (payload.old as Notification).id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((n) => classify(n).kind === filter);
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) await markAsRead(n.id);
    if (n.link) navigate({ to: n.link });
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) toast.error(t("err.tryAgain"));
    else toast.success(t("notif.markAllSuccess"));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("notif.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? t("notif.unreadCount", { n: unreadCount }) : t("notif.allCaughtUp")}
          </p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          {t("btn.markAllRead")}
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">{t("notif.tabAll")}</TabsTrigger>
          <TabsTrigger value="registrations">{t("notif.tabRegistrations")}</TabsTrigger>
          <TabsTrigger value="transfers">{t("notif.tabTransfers")}</TabsTrigger>
          <TabsTrigger value="system">{t("notif.tabSystem")}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : filtered.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t("notif.empty")}</p>
            </Card>
          ) : (
            filtered.map((n) => {
              const { tone } = classify(n);
              return (
                <Card
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-accent/5 ${
                    !n.read ? "border-l-4 border-l-accent" : ""
                  }`}
                >
                  <div className="mt-0.5"><ToneIcon tone={tone} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                        {n.title}
                      </h3>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                    </div>
                    {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
