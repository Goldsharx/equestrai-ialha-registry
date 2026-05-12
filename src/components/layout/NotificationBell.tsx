import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setRecent([]);
      return;
    }
    let active = true;

    const refresh = async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false),
        supabase
          .from("notifications")
          .select("id, title, body, link, read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (!active) return;
      setUnread(count ?? 0);
      setRecent((data ?? []) as Notification[]);
    };

    refresh();

    const channel = supabase
      .channel(`bell:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground/90 hover:bg-white/10 hover:text-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && <span className="text-xs text-muted-foreground">{unread} unread</span>}
        </div>
        <div className="max-h-80 overflow-auto">
          {recent.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            recent.map((n) => (
              <Link
                key={n.id}
                to={n.link ?? "/notifications"}
                onClick={() => !n.read && markRead(n.id)}
                className={`block border-b px-3 py-2 last:border-b-0 hover:bg-muted/50 ${
                  !n.read ? "bg-accent/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          className="block border-t px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted/50"
        >
          View All
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
