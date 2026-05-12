import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  farm_name: string | null;
  membership_type: string | null;
  membership_expires: string | null;
  ialha_member_id: string | null;
  created_at: string;
};

type Role = "member" | "staff" | "registrar" | "admin" | "board";

const MEMBERSHIPS = ["", "non_member", "member", "lifetime", "junior"];
const ROLES: Role[] = ["member", "staff", "registrar", "admin", "board"];

export const Route = createFileRoute("/_app/admin/members")({
  head: () => ({ meta: [{ title: "Members — Equestrai" }] }),
  component: AdminMembers,
});

function AdminMembers() {
  const { checking } = useStaffGuard();
  const [rows, setRows] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Map<string, Role[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editingRoles, setEditingRoles] = useState<Set<Role>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setRows((profilesRes.data ?? []) as Profile[]);
    const map = new Map<string, Role[]>();
    for (const r of rolesRes.data ?? []) {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role as Role);
      map.set(r.user_id, list);
    }
    setRoles(map);
    setLoading(false);
  };

  useEffect(() => { if (!checking) void load(); }, [checking]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.ialha_member_id, r.farm_name].some((v) => v?.toLowerCase().includes(term))
    );
  }, [rows, q]);

  const openEdit = (p: Profile) => {
    setEditing(p);
    setEditingRoles(new Set(roles.get(p.user_id) ?? []));
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      membership_type: editing.membership_type || null,
      membership_expires: editing.membership_expires || null,
      ialha_member_id: editing.ialha_member_id || null,
      full_name: editing.full_name,
      farm_name: editing.farm_name,
    }).eq("id", editing.id);
    if (error) { toast.error(error.message); setBusy(false); return; }

    // Sync roles
    const existing = new Set(roles.get(editing.user_id) ?? []);
    const toAdd = [...editingRoles].filter((r) => !existing.has(r));
    const toRemove = [...existing].filter((r) => !editingRoles.has(r));
    if (toAdd.length) {
      await supabase.from("user_roles").insert(toAdd.map((role) => ({ user_id: editing.user_id, role })));
    }
    for (const r of toRemove) {
      await supabase.from("user_roles").delete().eq("user_id", editing.user_id).eq("role", r);
    }

    toast.success("Member updated");
    setEditing(null); setBusy(false);
    void load();
  };

  if (checking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Members</h1>
        <p className="text-muted-foreground">{filtered.length} of {rows.length} members</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input placeholder="Search by name, email, member ID, farm…" value={q} onChange={(e) => setQ(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Member Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                    <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell>{p.farm_name ?? "—"}</TableCell>
                    <TableCell>{p.membership_type ?? "—"}</TableCell>
                    <TableCell className="space-x-1">
                      {(roles.get(p.user_id) ?? []).map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                    </TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link to="/admin" className="text-sm text-muted-foreground underline">← Back to Dashboard</Link>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Full Name</Label><Input value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
              <div><Label>Farm Name</Label><Input value={editing.farm_name ?? ""} onChange={(e) => setEditing({ ...editing, farm_name: e.target.value })} /></div>
              <div><Label>IALHA Member ID</Label><Input value={editing.ialha_member_id ?? ""} onChange={(e) => setEditing({ ...editing, ialha_member_id: e.target.value })} /></div>
              <div>
                <Label>Membership Type</Label>
                <Select value={editing.membership_type ?? ""} onValueChange={(v) => setEditing({ ...editing, membership_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MEMBERSHIPS.filter(Boolean).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Membership Expires</Label>
                <Input type="date" value={editing.membership_expires ?? ""} onChange={(e) => setEditing({ ...editing, membership_expires: e.target.value })} />
              </div>
              <div>
                <Label>Roles</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const active = editingRoles.has(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          const s = new Set(editingRoles);
                          if (active) s.delete(r); else s.add(r);
                          setEditingRoles(s);
                        }}
                        className={`rounded border px-3 py-1 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Role changes require admin privileges.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
