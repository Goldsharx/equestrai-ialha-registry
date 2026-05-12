import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ArrowRightLeft, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/horses/$horseId")({
  head: () => ({
    meta: [{ title: "Horse Details — EquestRai" }],
  }),
  component: HorseDetailPage,
});

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  deceased: "bg-gray-200 text-gray-700 border-gray-300",
};

function HorseDetailPage() {
  const { horseId } = useParams({ from: "/_app/horses/$horseId" });
  const user = useUser();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: horse, isLoading } = useQuery({
    queryKey: ["horse", horseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("id", horseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["horse-photos", horseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horse_photos")
        .select("*")
        .eq("horse_id", horseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["horse-transfers", horseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("horse_id", horseId)
        .order("transfer_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["horse-documents", horseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foreign_documents")
        .select("*")
        .eq("horse_id", horseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="space-y-4 text-center py-16">
        <p className="font-serif text-2xl text-primary">Horse not found</p>
        <Button asChild variant="outline">
          <Link to="/horses">Back to My Horses</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === horse.current_owner_id;
  const status = (horse.status ?? "pending") as string;

  return (
    <div className="space-y-8">
      <Link
        to="/horses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> All horses
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-4xl text-primary">{horse.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Reg #{horse.registration_number ?? "—"}</span>
            {horse.breed && (
              <Badge variant="outline" className="border-secondary text-secondary">
                {horse.breed}
              </Badge>
            )}
            <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
              {status}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/transfer" search={{ horse: horseId }}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Ownership
            </Link>
          </Button>
          {horse.certificate_url && (
            <Button asChild variant="outline">
              <a href={horse.certificate_url} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" /> Certificate
              </a>
            </Button>
          )}
          {isOwner && (
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Pencil className="mr-2 h-4 w-4" /> Update Details
            </Button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
            <Field label="Sex" value={horse.sex} className="capitalize" />
            <Field label="Color" value={horse.color} />
            <Field label="Birth Date" value={horse.date_of_birth} />
            <Field label="Birth Country" value={horse.birth_country} />
            <Field label="DNA Status" value={horse.dna_status} />
            <Field label="Microchip" value={horse.microchip_number} />
          </dl>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p.url)}
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <img
                    src={p.url}
                    alt={p.caption ?? horse.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Markings */}
      {(horse.markings_image_url || horse.markings_description) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-primary">Markings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {horse.markings_image_url && (
              <img
                src={horse.markings_image_url}
                alt={`${horse.name} markings`}
                className="max-h-96 w-auto rounded-md border"
              />
            )}
            {horse.markings_description && (
              <p className="text-sm text-foreground">{horse.markings_description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pedigree */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Pedigree</CardTitle>
        </CardHeader>
        <CardContent>
          <PedigreeTree horse={horse} />
        </CardContent>
      </Card>

      {/* Ownership history */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Ownership History</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ownership transfers recorded.</p>
          ) : (
            <ol className="relative border-l-2 border-secondary/40 pl-6">
              {transfers.map((t) => (
                <li key={t.id} className="mb-6 last:mb-0">
                  <span className="absolute -left-2 mt-1.5 h-3 w-3 rounded-full bg-secondary" />
                  <time className="text-xs uppercase tracking-wide text-muted-foreground">
                    {new Date(t.transfer_date).toLocaleDateString()}
                  </time>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t.from_owner_name ?? "Previous owner"}</span>
                    {" → "}
                    <span className="font-medium text-primary">
                      {t.to_owner_name ?? "New owner"}
                    </span>
                  </p>
                  {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-primary">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.document_type && (
                      <p className="text-xs text-muted-foreground">{d.document_type}</p>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={d.url} target="_blank" rel="noreferrer">
                      <Download className="mr-1 h-3 w-3" /> Open
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {lightbox && (
            <div className="relative">
              <img src={lightbox} alt="" className="w-full rounded-lg" />
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-2 text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm font-medium text-foreground ${className ?? ""}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

type AncestorRef = {
  id?: string | null;
  name?: string | null;
};

function PedigreeTree({ horse }: { horse: { sire_id?: string | null; dam_id?: string | null; sire_name?: string | null; dam_name?: string | null } }) {
  // Placeholder 4-generation tree using known sire/dam.
  // The pedigree-lookup edge function will hydrate deeper ancestors later.
  const sire: AncestorRef = { id: horse.sire_id, name: horse.sire_name };
  const dam: AncestorRef = { id: horse.dam_id, name: horse.dam_name };

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[640px] gap-4">
        <Generation title="Sire line" root={sire} />
        <Generation title="Dam line" root={dam} />
      </div>
    </div>
  );
}

function Generation({ title, root }: { title: string; root: AncestorRef }) {
  return (
    <div className="flex-1 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary">{title}</h3>
      <AncestorNode ancestor={root} depth={0} />
    </div>
  );
}

function AncestorNode({ ancestor, depth }: { ancestor: AncestorRef; depth: number }) {
  if (depth >= 3) return null;
  const label = ancestor.name ?? "Unknown";
  const content = (
    <div className="rounded-md border border-secondary/30 bg-card px-3 py-2 text-sm">
      <span className="font-medium text-primary">{label}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      {ancestor.id ? (
        <Link to="/horses/$horseId" params={{ horseId: ancestor.id }} className="block hover:opacity-80">
          {content}
        </Link>
      ) : (
        content
      )}
      {depth < 2 && (
        <div className="ml-4 grid grid-cols-1 gap-2 border-l border-secondary/30 pl-3">
          <AncestorNode ancestor={{ name: null }} depth={depth + 1} />
          <AncestorNode ancestor={{ name: null }} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}
