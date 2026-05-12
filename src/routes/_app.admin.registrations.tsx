import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

type Row = {
  id: string;
  horse_name: string | null;
  type: string | null;
  submitted_at: string | null;
  created_at: string;
  ai_screening_score: number | null;
  status: string;
  applicant_id: string;
  applicant_name?: string | null;
};

type SortKey = "ai" | "date" | "type";

const STATUS_OPTIONS = [
  "all", "draft", "pending_signatures", "pending_payment", "submitted",
  "in_review", "needs_info", "pending_board", "approved", "rejected",
];

export const Route = createFileRoute("/_app/admin/registrations")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? s.status : "all",
  }),
  head: () => ({ meta: [{ title: "Registrations Queue — Equestrai" }] }),
  component: AdminRegistrations,
});

function aiBadge(score: number | null) {
  if (score == null) return <Badge variant="secondary">Not screened</Badge>;
  if (score > 90) return <Badge className="bg-emerald-600 hover:bg-emerald-700">{score.toFixed(0)}</Badge>;
  if (score >= 70) return <Badge className="bg-amber-500 hover:bg-amber-600">{score.toFixed(0)}</Badge>;
  return <Badge className="bg-rose-600 hover:bg-rose-700">{score.toFixed(0)}</Badge>;
}

function AdminRegistrations() {
  const { checking } = useStaffGuard();
  const { status } = Route.useSearch();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("ai");

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("registrations")
        .select("id, horse_name, type, submitted_at, created_at, ai_screening_score, status, applicant_id");
      if (status && status !== "all") q = q.eq("status", status);
      const { data } = await q.limit(500);
      const ids = Array.from(new Set((data ?? []).map((r) => r.applicant_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      const nameMap = new Map(profs?.map((p) => [p.user_id, p.full_name]));
      setRows(((data ?? []) as Row[]).map((r) => ({ ...r, applicant_name: nameMap.get(r.applicant_id) ?? null })));
      setLoading(false);
    })();
  }, [checking, status]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    if (sortKey === "ai") {
      arr.sort((a, b) => {
        // Flagged (low/null) first. Treat null as 50.
        const av = a.ai_screening_score ?? 50;
        const bv = b.ai_screening_score ?? 50;
        return av - bv;
      });
    } else if (sortKey === "date") {
      arr.sort((a, b) => (b.submitted_at ?? b.created_at).localeCompare(a.submitted_at ?? a.created_at));
    } else {
      arr.sort((a, b) => (a.type ?? "").localeCompare(b.type ?? ""));
    }
    return arr;
  }, [rows, sortKey]);

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Registrations</h1>
          <p className="text-muted-foreground">Review and act on submitted registrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={status}
            onValueChange={(v) => navigate({ to: "/admin/registrations", search: { status: v } })}
          >
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Queue ({sorted.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Horse</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => setSortKey("type")}>
                      Type <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => setSortKey("date")}>
                      Submitted <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => setSortKey("ai")}>
                      AI Score <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/admin/registrations/$registrationId", params: { registrationId: r.id } })}
                  >
                    <TableCell>{r.applicant_name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.horse_name ?? "—"}</TableCell>
                    <TableCell>{r.type ?? "—"}</TableCell>
                    <TableCell>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{aiBadge(r.ai_screening_score)}</TableCell>
                    <TableCell><Badge variant="outline">{r.status.replace(/_/g, " ")}</Badge></TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No registrations match.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link to="/admin" className="text-sm text-muted-foreground underline">← Back to Dashboard</Link>
    </div>
  );
}
