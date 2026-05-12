import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, PlusCircle } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/horses")({
  head: () => ({
    meta: [
      { title: "My Horses — EquestRai" },
      { name: "description", content: "Manage your registered horses." },
    ],
  }),
  component: HorsesPage,
});

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  deceased: "bg-gray-200 text-gray-700 border-gray-300",
};

const REG_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  pending_signatures: "bg-blue-100 text-blue-800 border-blue-200",
  pending_payment: "bg-orange-100 text-orange-900 border-orange-300",
  submitted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_review: "bg-purple-100 text-purple-800 border-purple-200",
  needs_info: "bg-amber-100 text-amber-900 border-amber-300",
  pending_board: "bg-violet-100 text-violet-800 border-violet-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const REG_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_signatures: "Pending Signatures",
  pending_payment: "Pending Payment",
  submitted: "Submitted",
  in_review: "In Review",
  needs_info: "Needs Info",
  pending_board: "Pending Board",
  approved: "Approved",
  rejected: "Rejected",
};

const TYPE_LABEL: Record<string, string> = {
  purebred_ialha: "Purebred (IALHA)",
  purebred_foreign: "Purebred (Foreign)",
  half_bred: "Half-Bred",
};

function HorsesPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ["horses", "owned", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horses")
        .select("id,name,registration_number,breed,sex,status")
        .eq("current_owner_id", user!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["registrations", "mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("id,name_choice_1,horse_name,type,status,created_at,horse_id")
        .eq("applicant_id", user!.id)
        .neq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return horses.filter((h) => {
      const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || (h.status ?? "pending") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [horses, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-primary">My Horses</h1>
          <p className="text-sm text-muted-foreground">
            Every horse registered under your IALHA membership.
          </p>
        </div>
        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link to="/register">
            <PlusCircle className="mr-2 h-4 w-4" />
            Register a Horse
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading horses…</div>
        ) : horses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="font-serif text-xl text-primary">No horses yet.</p>
            <p className="text-sm text-muted-foreground">
              Register your first horse to begin building your stable.
            </p>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/register">Register your first horse</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No horses match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reg Number</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((h) => {
                const status = (h.status ?? "pending") as string;
                return (
                  <TableRow
                    key={h.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/horses/$horseId", params: { horseId: h.id } })
                    }
                  >
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{h.registration_number ?? "—"}</TableCell>
                    <TableCell>{h.breed ?? "—"}</TableCell>
                    <TableCell className="capitalize">{h.sex ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-serif text-2xl text-primary">Pending Applications</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Drafts and registrations still working their way through review.
        </p>
        <div className="rounded-lg border bg-card">
          {pendingLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading applications…</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No pending applications. Start one from “Register a Horse”.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horse Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => {
                  const name = r.horse_name || r.name_choice_1 || "Untitled draft";
                  const type = r.type ? (TYPE_LABEL[r.type] ?? r.type) : "—";
                  const status = r.status as string;
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/register/$registrationId/edit",
                          params: { registrationId: r.id },
                        })
                      }
                    >
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={REG_STATUS_STYLES[status] ?? ""}>
                          {REG_STATUS_LABEL[status] ?? status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
