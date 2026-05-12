import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";

type Entry = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const Route = createFileRoute("/_app/admin/activity")({
  head: () => ({ meta: [{ title: "Activity Log — Equestrai" }] }),
  component: AdminActivity,
});

function AdminActivity() {
  const { checking } = useStaffGuard();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      setRows((data ?? []) as Entry[]);
      setLoading(false);
    })();
  }, [checking]);

  const entityTypes = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => r.entity_type)))], [rows]);
  const actions = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => r.action)))], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (entity !== "all" && r.entity_type !== entity) return false;
      if (action !== "all" && r.action !== action) return false;
      if (from && r.created_at < from) return false;
      if (to && r.created_at > to + "T23:59:59") return false;
      return true;
    });
  }, [rows, entity, action, from, to]);

  const toggle = (id: string) => {
    const s = new Set(expanded);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpanded(s);
  };

  const linkFor = (r: Entry): string | null => {
    if (!r.entity_id) return null;
    if (r.entity_type === "registration") return `/admin/registrations/${r.entity_id}`;
    if (r.entity_type === "transfer") return `/admin/transfers/${r.entity_id}`;
    if (r.entity_type === "horse") return `/horses/${r.entity_id}`;
    return null;
  };

  if (checking) return <Skeleton className="h-64 w-full" />;

  const meta = (m: Record<string, unknown>) => {
    const old = m.old_values ?? m.old;
    const next = m.new_values ?? m.new;
    if (old || next) {
      return (
        <div className="grid gap-2 text-xs md:grid-cols-2">
          <div>
            <div className="font-semibold text-muted-foreground">Old</div>
            <pre className="rounded bg-muted p-2">{JSON.stringify(old ?? {}, null, 2)}</pre>
          </div>
          <div>
            <div className="font-semibold text-muted-foreground">New</div>
            <pre className="rounded bg-muted p-2">{JSON.stringify(next ?? {}, null, 2)}</pre>
          </div>
        </div>
      );
    }
    return <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(m, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Activity Log</h1>
        <p className="text-muted-foreground">{filtered.length} of {rows.length} entries</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div>
            <Label>Entity</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{entityTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 500).map((r) => {
                  const open = expanded.has(r.id);
                  const link = linkFor(r);
                  return (
                    <Fragment key={r.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggle(r.id)}>
                        <TableCell>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{r.entity_type}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">
                          {link ? <Link to={link} className="underline" onClick={(e) => e.stopPropagation()}>{r.entity_id?.slice(0, 8)}</Link> : r.entity_id?.slice(0, 8) ?? "—"}
                        </TableCell>
                        <TableCell><Badge>{r.action}</Badge></TableCell>
                        <TableCell>{r.actor_name ?? "—"}</TableCell>
                      </TableRow>
                      {open && (
                        <TableRow>
                          <TableCell></TableCell>
                          <TableCell colSpan={5}>{meta(r.metadata ?? {})}</TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No entries.</TableCell></TableRow>
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
