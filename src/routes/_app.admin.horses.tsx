import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

type Horse = {
  id: string;
  name: string;
  registration_number: string | null;
  breed_type: string | null;
  breed: string | null;
  sex: string | null;
  status: string;
  color: string | null;
  date_of_birth: string | null;
  current_owner_id: string;
};

const BREEDS = ["all", "PRE", "PSL", "SP", "Half-Bred"];
const SEXES = ["all", "stallion", "mare", "gelding", "colt", "filly"];
const STATUSES = ["all", "approved", "pending", "suspended", "deceased"];

export const Route = createFileRoute("/_app/admin/horses")({
  head: () => ({ meta: [{ title: "All Horses — EquestRai" }] }),
  component: AdminHorses,
});

function AdminHorses() {
  const { checking } = useStaffGuard();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [breed, setBreed] = useState("all");
  const [sex, setSex] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("horses").select("*").order("created_at", { ascending: false }).limit(1000);
      setRows((data ?? []) as Horse[]);
      setLoading(false);
    })();
  }, [checking]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (breed !== "all" && r.breed_type !== breed) return false;
      if (sex !== "all" && r.sex !== sex) return false;
      if (status !== "all" && r.status !== status) return false;
      if (term) {
        const blob = `${r.name} ${r.registration_number ?? ""} ${r.breed ?? ""}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, breed, sex, status]);

  const exportCsv = () => {
    const headers = ["Name", "Registration #", "Breed Type", "Breed", "Sex", "Color", "DOB", "Status"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const row = [r.name, r.registration_number ?? "", r.breed_type ?? "", r.breed ?? "", r.sex ?? "", r.color ?? "", r.date_of_birth ?? "", r.status];
      lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `horses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">All Horses</h1>
          <p className="text-muted-foreground">{filtered.length} of {rows.length} horses</p>
        </div>
        <Button onClick={exportCsv} variant="outline"><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <Input placeholder="Search name, reg #, breed…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={breed} onValueChange={setBreed}>
            <SelectTrigger><SelectValue placeholder="Breed type" /></SelectTrigger>
            <SelectContent>{BREEDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sex} onValueChange={setSex}>
            <SelectTrigger><SelectValue placeholder="Sex" /></SelectTrigger>
            <SelectContent>{SEXES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Horses</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg #</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate({ to: "/horses/$horseId", params: { horseId: r.id } })}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.registration_number ?? "—"}</TableCell>
                    <TableCell>{r.breed_type ?? r.breed ?? "—"}</TableCell>
                    <TableCell>{r.sex ?? "—"}</TableCell>
                    <TableCell>{r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Link to="/admin" className="text-sm text-muted-foreground underline">← Back to Dashboard</Link>
    </div>
  );
}
