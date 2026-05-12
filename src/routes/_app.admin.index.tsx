import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, PenLine, CreditCard, Gavel, DollarSign, Activity } from "lucide-react";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Staff Dashboard — EquestRai" }] }),
  component: AdminDashboard,
});

type Counts = { review: number; signatures: number; payment: number; board: number };
type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_name: string | null;
  created_at: string;
};

const QUEUE_CARDS: Array<{
  key: keyof Counts;
  label: string;
  icon: typeof ClipboardCheck;
  filter: string;
  color: string;
}> = [
  { key: "review", label: "Pending Review", icon: ClipboardCheck, filter: "in_review", color: "text-blue-600" },
  { key: "signatures", label: "Pending Signatures", icon: PenLine, filter: "pending_signatures", color: "text-purple-600" },
  { key: "payment", label: "Pending Payment", icon: CreditCard, filter: "pending_payment", color: "text-amber-600" },
  { key: "board", label: "Pending Board", icon: Gavel, filter: "pending_board", color: "text-rose-600" },
];

function AdminDashboard() {
  const { checking } = useStaffGuard();
  const [counts, setCounts] = useState<Counts>({ review: 0, signatures: 0, payment: 0, board: 0 });
  const [revenue, setRevenue] = useState({ month: 0, quarter: 0, year: 0 });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking) return;
    (async () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();
      const startYear = new Date(now.getFullYear(), 0, 1).toISOString();

      const [reviewQ, sigQ, payQ, boardQ, paidRows, act] = await Promise.all([
        supabase.from("registrations").select("id", { count: "exact", head: true }).in("status", ["submitted", "in_review"]),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending_signatures"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending_board"),
        supabase
          .from("registrations")
          .select("fee_total, updated_at")
          .eq("payment_status", "paid")
          .gte("updated_at", startYear),
        supabase
          .from("activity_log")
          .select("id, action, entity_type, entity_id, actor_name, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setCounts({
        review: reviewQ.count ?? 0,
        signatures: sigQ.count ?? 0,
        payment: payQ.count ?? 0,
        board: boardQ.count ?? 0,
      });

      const rev = { month: 0, quarter: 0, year: 0 };
      for (const r of paidRows.data ?? []) {
        const amt = Number(r.fee_total ?? 0);
        const ts = r.updated_at;
        if (ts >= startYear) rev.year += amt;
        if (ts >= startQuarter) rev.quarter += amt;
        if (ts >= startMonth) rev.month += amt;
      }
      setRevenue(rev);
      setActivity((act.data ?? []) as ActivityRow[]);
      setLoading(false);
    })();
  }, [checking]);

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Review queues, revenue, and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUEUE_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              to="/admin/registrations"
              search={{ status: c.filter }}
              className="block"
            >
              <Card className="transition hover:border-primary hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${c.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "—" : counts[c.key]}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" /> Revenue (Paid)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(["month", "quarter", "year"] as const).map((p) => (
              <div key={p}>
                <div className="text-xs uppercase text-muted-foreground">This {p}</div>
                <div className="text-2xl font-bold">${revenue[p].toFixed(2)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.action}</Badge>
                    <span className="text-muted-foreground">{a.entity_type}</span>
                    {a.actor_name && <span>by {a.actor_name}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
