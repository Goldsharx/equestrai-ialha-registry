import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Fee = {
  id: string;
  code: string;
  description: string;
  amount: number;
  currency: string;
  active: boolean;
  created_at: string;
};

const REG_TYPES = ["purebred_ialha", "purebred_foreign", "half_arabian", "partbred"];
const ADD_ONS = [
  { code: "DNA_KIT", label: "DNA Kit" },
  { code: "MICROCHIP", label: "Microchip" },
  { code: "EXPEDITED", label: "Expedited Processing" },
];

export const Route = createFileRoute("/_app/admin/fees")({
  head: () => ({ meta: [{ title: "Fees — EquestRai" }] }),
  component: AdminFees,
});

function AdminFees() {
  const { checking } = useStaffGuard();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: "", description: "", amount: 0 });

  // preview
  const [pType, setPType] = useState(REG_TYPES[0]);
  const [pAddOns, setPAddOns] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("fee_schedule").select("*").order("code");
    setFees((data ?? []) as Fee[]);
    setLoading(false);
  };

  useEffect(() => { if (!checking) void load(); }, [checking]);

  const updateField = async (id: string, field: keyof Fee, value: string | number | boolean) => {
    const { error } = await supabase.from("fee_schedule").update({ [field]: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const addFee = async () => {
    if (!draft.code || !draft.description) { toast.error("Code and description required"); return; }
    const { error } = await supabase.from("fee_schedule").insert({
      code: draft.code, description: draft.description, amount: draft.amount, currency: "USD", active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Fee added");
    setAdding(false); setDraft({ code: "", description: "", amount: 0 });
    void load();
  };

  const previewTotal = useMemo(() => {
    const lines: Array<{ label: string; amount: number }> = [];
    const baseFee = fees.find((f) => f.code === pType.toUpperCase() || f.code === pType);
    if (baseFee) lines.push({ label: baseFee.description, amount: Number(baseFee.amount) });
    for (const a of ADD_ONS) {
      if (pAddOns.has(a.code)) {
        const f = fees.find((x) => x.code === a.code);
        if (f) lines.push({ label: f.description, amount: Number(f.amount) });
      }
    }
    return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
  }, [fees, pType, pAddOns]);

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Fee Schedule</h1>
          <p className="text-muted-foreground">Changes take effect immediately for new applications.</p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" /> Add Fee</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Fees</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Amount (USD)</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adding && (
                  <TableRow>
                    <TableCell><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="e.g. LATE_FEE" /></TableCell>
                    <TableCell><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></TableCell>
                    <TableCell><Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={addFee}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>×</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.code}</TableCell>
                    <TableCell>
                      <Input
                        defaultValue={f.description}
                        onBlur={(e) => e.target.value !== f.description && updateField(f.id, "description", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={f.amount}
                        onBlur={(e) => Number(e.target.value) !== Number(f.amount) && updateField(f.id, "amount", Number(e.target.value))}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={f.active} onCheckedChange={(v) => updateField(f.id, "active", v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fee Preview Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Registration Type</Label>
              <Select value={pType} onValueChange={setPType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Add-ons</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ADD_ONS.map((a) => {
                  const active = pAddOns.has(a.code);
                  return (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        const s = new Set(pAddOns);
                        if (active) s.delete(a.code); else s.add(a.code);
                        setPAddOns(s);
                      }}
                      className={`rounded border px-3 py-1 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded border p-3">
            {previewTotal.lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching fees in schedule.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {previewTotal.lines.map((l, i) => (
                  <li key={i} className="flex justify-between"><span>{l.label}</span><span>${l.amount.toFixed(2)}</span></li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
              <span>Total</span><span>${previewTotal.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link to="/admin" className="text-sm text-muted-foreground underline">← Back to Dashboard</Link>
    </div>
  );
}
