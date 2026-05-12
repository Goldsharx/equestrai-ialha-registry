import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  id: string;
  horse_id: string;
  from_owner_name: string | null;
  to_owner_name: string | null;
  buyer_email: string | null;
  sale_date: string | null;
  status: string;
  payment_status: string;
  horse_name?: string | null;
};

const STATUSES = ["all", "draft", "submitted", "in_review", "approved", "rejected"];

export const Route = createFileRoute("/_app/admin/transfers")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? s.status : "all",
  }),
  head: () => ({ meta: [{ title: "Transfers Queue — Equestrai" }] }),
  component: AdminTransfers,
});

function AdminTransfers() {
  const { checking } = useStaffGuard();
  const { status } = Route.useSearch();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("transfers")
        .select("id, horse_id, from_owner_name, to_owner_name, buyer_email, sale_date, status, payment_status")
        .order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data } = await q.limit(500);
      const ids = Array.from(new Set((data ?? []).map((r) => r.horse_id)));
      const { data: horses } = ids.length
        ? await supabase.from("horses").select("id, name").in("id", ids)
        : { data: [] as { id: string; name: string }[] };
      const map = new Map(horses?.map((h) => [h.id, h.name]));
      setRows(((data ?? []) as Row[]).map((r) => ({ ...r, horse_name: map.get(r.horse_id) ?? null })));
      setLoading(false);
    })();
  }, [checking, status]);

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Transfers</h1>
          <p className="text-muted-foreground">Approve or reject ownership transfers.</p>
        </div>
        <Select value={status} onValueChange={(v) => navigate({ to: "/admin/transfers", search: { status: v } })}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Queue ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Horse</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/admin/transfers/$transferId", params: { transferId: r.id } })}
                  >
                    <TableCell>{r.from_owner_name ?? "—"}</TableCell>
                    <TableCell>{r.to_owner_name ?? r.buyer_email ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.horse_name ?? "—"}</TableCell>
                    <TableCell>{r.sale_date ? new Date(r.sale_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.payment_status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{r.status.replace(/_/g, " ")}</Badge></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No transfers.</TableCell></TableRow>
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
