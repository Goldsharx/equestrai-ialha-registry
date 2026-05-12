import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, startOfYear, endOfYear, parseISO } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Equestrai" }] }),
  component: AdminReports,
});

const COLORS = ["#d4a017", "#1f6feb", "#10b981", "#f43f5e", "#8b5cf6", "#f97316", "#06b6d4"];

type Reg = {
  id: string;
  type: string | null;
  status: string;
  fee_total: number | null;
  payment_status: string;
  applicant_id: string;
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
};

type Horse = { id: string; breed_type: string | null; sire_id: string | null; status: string };
type Profile = { user_id: string; membership_type: string | null };

function csvDownload(name: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function AdminReports() {
  const { checking } = useStaffGuard();
  const [from, setFrom] = useState<Date>(startOfYear(new Date()));
  const [to, setTo] = useState<Date>(endOfYear(new Date()));
  const [regs, setRegs] = useState<Reg[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [stallionNames, setStallionNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      const fromStr = from.toISOString();
      const toStr = to.toISOString();
      const [regRes, horseRes, profRes] = await Promise.all([
        supabase
          .from("registrations")
          .select("id, type, status, fee_total, payment_status, applicant_id, submitted_at, updated_at, created_at")
          .gte("created_at", fromStr)
          .lte("created_at", toStr)
          .limit(5000),
        supabase.from("horses").select("id, breed_type, sire_id, status").limit(5000),
        supabase.from("profiles").select("user_id, membership_type").limit(5000),
      ]);
      setRegs((regRes.data ?? []) as Reg[]);
      setHorses((horseRes.data ?? []) as Horse[]);
      setProfiles(new Map((profRes.data ?? []).map((p) => [p.user_id, p as Profile])));

      // Stallion names
      const sireIds = Array.from(new Set((horseRes.data ?? []).map((h) => h.sire_id).filter(Boolean) as string[]));
      if (sireIds.length) {
        const { data: sires } = await supabase.from("horses").select("id, name").in("id", sireIds);
        setStallionNames(new Map((sires ?? []).map((s) => [s.id, s.name])));
      }
      setLoading(false);
    })();
  }, [checking, from, to]);

  // Summary
  const summary = useMemo(() => {
    const total = regs.length;
    const revenue = regs.filter((r) => r.payment_status === "paid").reduce((s, r) => s + Number(r.fee_total ?? 0), 0);
    const approved = regs.filter((r) => r.status === "approved" && r.submitted_at);
    const avgDays = approved.length
      ? approved.reduce((s, r) => s + (parseISO(r.updated_at).getTime() - parseISO(r.submitted_at!).getTime()), 0) /
        approved.length / 86400000
      : 0;
    const decided = regs.filter((r) => r.status === "approved" || r.status === "rejected").length;
    const approvalRate = decided ? (approved.length / decided) * 100 : 0;
    return { total, revenue, avgDays, approvalRate };
  }, [regs]);

  // Registrations by Month (grouped bars by type)
  const byMonth = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    const types = new Set<string>();
    for (const r of regs) {
      const key = format(parseISO(r.created_at), "yyyy-MM");
      const t = r.type ?? "unknown";
      types.add(t);
      const row = map.get(key) ?? { month: key };
      row[t] = ((row[t] as number) ?? 0) + 1;
      map.set(key, row);
    }
    return { rows: Array.from(map.values()).sort((a, b) => String(a.month).localeCompare(String(b.month))), types: Array.from(types) };
  }, [regs]);

  // Revenue by Type (stacked, by month)
  const revenueByType = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    const types = new Set<string>();
    for (const r of regs.filter((x) => x.payment_status === "paid")) {
      const key = format(parseISO(r.updated_at), "yyyy-MM");
      const t = r.type ?? "unknown";
      types.add(t);
      const row = map.get(key) ?? { month: key };
      row[t] = ((row[t] as number) ?? 0) + Number(r.fee_total ?? 0);
      map.set(key, row);
    }
    return { rows: Array.from(map.values()).sort((a, b) => String(a.month).localeCompare(String(b.month))), types: Array.from(types) };
  }, [regs]);

  // Member vs Non-Member
  const memberPie = useMemo(() => {
    let member = 0, nonMember = 0;
    for (const r of regs) {
      const p = profiles.get(r.applicant_id);
      const m = p?.membership_type;
      if (!m || m === "none" || m === "non_member") nonMember++;
      else member++;
    }
    return [
      { name: "Member", value: member },
      { name: "Non-Member", value: nonMember },
    ];
  }, [regs, profiles]);

  // Breed Type Distribution (donut, approved horses)
  const breedDonut = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of horses.filter((x) => x.status === "approved")) {
      const k = h.breed_type ?? "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [horses]);

  // Top Stallions
  const topStallions = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of horses) {
      if (h.sire_id) map.set(h.sire_id, (map.get(h.sire_id) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => ({ name: stallionNames.get(id) ?? id.slice(0, 8), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [horses, stallionNames]);

  // Pipeline funnel
  const pipeline = useMemo(() => {
    const stages = ["draft", "pending_signatures", "pending_payment", "submitted", "in_review", "approved"];
    return stages.map((s, i) => ({
      name: s.replace(/_/g, " "),
      value: regs.filter((r) => r.status === s).length,
      fill: COLORS[i % COLORS.length],
    }));
  }, [regs]);

  if (checking) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-muted-foreground">Operational insights and analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateBtn date={from} onChange={setFrom} label="From" />
          <DateBtn date={to} onChange={setTo} label="To" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total Registrations" value={loading ? "—" : String(summary.total)} />
        <Stat label="Total Revenue" value={loading ? "—" : `$${summary.revenue.toFixed(2)}`} />
        <Stat label="Avg Processing Time" value={loading ? "—" : `${summary.avgDays.toFixed(1)} days`} />
        <Stat label="Approval Rate" value={loading ? "—" : `${summary.approvalRate.toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Registrations by Month"
          onExport={() => csvDownload("registrations-by-month", byMonth.rows as Record<string, unknown>[])}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byMonth.rows}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {byMonth.types.map((t, i) => (
                <Bar key={t} dataKey={t} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue by Type"
          onExport={() => csvDownload("revenue-by-type", revenueByType.rows as Record<string, unknown>[])}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByType.rows}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {revenueByType.types.map((t, i) => (
                <Bar key={t} dataKey={t} stackId="rev" fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Member vs Non-Member"
          onExport={() => csvDownload("member-breakdown", memberPie)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={memberPie} dataKey="value" nameKey="name" outerRadius={100} label>
                {memberPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Breed Type Distribution"
          onExport={() => csvDownload("breed-distribution", breedDonut)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={breedDonut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                {breedDonut.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top Stallions by Offspring"
          onExport={() => csvDownload("top-stallions", topStallions)}
        >
          <ResponsiveContainer width="100%" height={Math.max(280, topStallions.length * 28)}>
            <BarChart data={topStallions} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Registration Pipeline"
          onExport={() => csvDownload("pipeline", pipeline)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={pipeline} isAnimationActive>
                <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Link to="/admin" className="text-sm text-muted-foreground underline">← Back to Dashboard</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, onExport, children }: { title: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onExport}><Download className="mr-1 h-4 w-4" /> CSV</Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DateBtn({ date, onChange, label }: { date: Date; onChange: (d: Date) => void; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}: {format(date, "PP")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
