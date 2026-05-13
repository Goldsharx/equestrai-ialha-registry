import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_public/studbook/$horseId")({
  head: () => ({
    meta: [
      { title: "Horse — IALHA Studbook" },
      { name: "description", content: "Public IALHA studbook profile." },
    ],
  }),
  component: StudbookHorsePage,
});

type Ancestor = {
  id: string | null;
  name: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  sire_name?: string | null;
  dam_name?: string | null;
};

const MAX_GENERATIONS = 4;

function StudbookHorsePage() {
  const { horseId } = useParams({ from: "/_public/studbook/$horseId" });
  const user = useUser();

  const { data: horse, isLoading } = useQuery({
    queryKey: ["studbook-horse", horseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horses")
        .select(
          "id,name,registration_number,breed,breed_type,sex,color,date_of_birth,birth_country,sire_id,dam_id,sire_name,dam_name,current_owner_id,status",
        )
        .eq("id", horseId)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: pedigree } = useQuery({
    enabled: !!horse,
    queryKey: ["pedigree", horseId],
    queryFn: () => buildPedigree(horseId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-primary">Horse not found</h1>
        <p className="text-sm text-muted-foreground">
          This horse is not in the public studbook, or has not yet been approved.
        </p>
        <Button asChild variant="outline">
          <Link to="/studbook"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Search</Link>
        </Button>
      </div>
    );
  }

  const isOwner = !!user && user.id === horse.current_owner_id;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/studbook"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Search</Link>
      </Button>

      <header className="space-y-3">
        <h1 className="font-serif text-4xl text-primary">{horse.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Reg #{horse.registration_number ?? "—"}</span>
          {horse.breed_type && (
            <Badge variant="outline" className="border-secondary text-secondary">{horse.breed_type}</Badge>
          )}
        </div>
        {isOwner && (
          <Link
            to="/horses/$horseId"
            params={{ horseId: horse.id }}
            className="inline-block text-sm font-semibold text-secondary hover:underline"
          >
            View full details in My Horses →
          </Link>
        )}
      </header>

      <Card>
        <CardHeader><CardTitle className="font-serif text-primary">Profile</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
            <Field label="Breed Type" value={horse.breed_type ?? horse.breed} />
            <Field label="Sex" value={horse.sex} className="capitalize" />
            <Field label="Color" value={horse.color} />
            <Field label="Birth Date" value={horse.date_of_birth} />
            <Field label="Birth Country" value={horse.birth_country} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-primary">Pedigree</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {pedigree ? (
            <PedigreeChart node={pedigree} generation={0} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading pedigree…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function buildPedigree(rootId: string): Promise<Ancestor | null> {
  // Collect ids needed per generation, batch-fetching from horses
  const cache = new Map<string, Ancestor>();

  const fetchHorses = async (ids: string[]) => {
    const need = ids.filter((id) => id && !cache.has(id));
    if (need.length === 0) return;
    const { data } = await supabase
      .from("horses")
      .select("id,name,sire_id,dam_id,sire_name,dam_name")
      .in("id", need)
      .eq("status", "approved");
    for (const h of data ?? []) {
      cache.set(h.id, {
        id: h.id,
        name: h.name,
        sire_id: h.sire_id,
        dam_id: h.dam_id,
        sire_name: h.sire_name,
        dam_name: h.dam_name,
      });
    }
  };

  await fetchHorses([rootId]);
  let frontier = [rootId];
  for (let g = 0; g < MAX_GENERATIONS; g++) {
    const next: string[] = [];
    for (const id of frontier) {
      const node = cache.get(id);
      if (!node) continue;
      if (node.sire_id) next.push(node.sire_id);
      if (node.dam_id) next.push(node.dam_id);
    }
    if (next.length === 0) break;
    await fetchHorses(next);
    frontier = next;
  }

  const build = (id: string | null, fallbackName: string | null, depth: number): Ancestor | null => {
    if (depth > MAX_GENERATIONS) return null;
    const cached = id ? cache.get(id) : undefined;
    if (!cached && !fallbackName && !id) return null;
    return {
      id: cached?.id ?? null,
      name: cached?.name ?? fallbackName ?? null,
      sire_id: cached?.sire_id ?? null,
      dam_id: cached?.dam_id ?? null,
      sire_name: cached?.sire_name ?? null,
      dam_name: cached?.dam_name ?? null,
    };
  };

  const root = cache.get(rootId);
  if (!root) return null;
  // Construct nested tree by walking sire/dam recursively from the cache
  const expand = (node: Ancestor, depth: number): any => {
    if (depth >= MAX_GENERATIONS) return { ...node, sire: null, dam: null };
    const sire = build(node.sire_id ?? null, node.sire_name ?? null, depth + 1);
    const dam = build(node.dam_id ?? null, node.dam_name ?? null, depth + 1);
    return {
      ...node,
      sire: sire ? expand(sire, depth + 1) : null,
      dam: dam ? expand(dam, depth + 1) : null,
    };
  };
  return expand(root, 0);
}

function PedigreeChart({ node, generation }: { node: any; generation: number }) {
  if (!node) return null;
  if (generation >= MAX_GENERATIONS) {
    return <NodeBox node={node} />;
  }
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex min-w-[100px] sm:min-w-[140px] items-center">
        <NodeBox node={node} />
      </div>
      {(node.sire || node.dam) && (
        <div className="flex flex-col justify-center gap-2 border-l-2 border-secondary/30 pl-3">
          {node.sire && (
            <div className="flex items-center">
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide text-secondary">S</span>
              <PedigreeChart node={node.sire} generation={generation + 1} />
            </div>
          )}
          {node.dam && (
            <div className="flex items-center">
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide text-secondary">D</span>
              <PedigreeChart node={node.dam} generation={generation + 1} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NodeBox({ node }: { node: Ancestor }) {
  const label = node.name ?? "Unknown";
  const className =
    "block whitespace-nowrap rounded-md border border-secondary/30 bg-card px-3 py-1.5 text-xs hover:border-secondary";
  if (node.id) {
    return (
      <Link to="/studbook/$horseId" params={{ horseId: node.id }} className={className}>
        <span className="font-medium text-primary">{label}</span>
      </Link>
    );
  }
  return (
    <span className={`${className} text-muted-foreground`}>
      {label}
    </span>
  );
}

function Field({
  label, value, className,
}: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm font-medium text-foreground ${className ?? ""}`}>{value ?? "—"}</dd>
    </div>
  );
}
