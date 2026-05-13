import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_public/studbook")({
  head: () => ({
    meta: [
      { title: "Studbook — Equestrai" },
      {
        name: "description",
        content:
          "Search the official IALHA studbook of approved Andalusian and Lusitano horses by name, registration number, breed, sire, or dam.",
      },
      { property: "og:title", content: "Studbook — Equestrai" },
      {
        property: "og:description",
        content: "Search the official IALHA studbook.",
      },
    ],
  }),
  component: StudbookPage,
});

const PAGE_SIZE = 20;
const BREEDS = ["PRE", "PSL", "SP", "Half-Bred"];
const SEXES: { code: string; label: string }[] = [
  { code: "stallion", label: "Stallion" },
  { code: "mare", label: "Mare" },
  { code: "gelding", label: "Gelding" },
];
const COLORS = ["Bay", "Black", "Gray", "Chestnut", "Palomino", "Buckskin", "Dun", "Cremello", "Perlino", "Other"];

type Filters = {
  breeds: string[];
  sexes: string[];
  colors: string[];
  yearFrom: string;
  yearTo: string;
};

const EMPTY_FILTERS: Filters = {
  breeds: [],
  sexes: [],
  colors: [],
  yearFrom: "",
  yearTo: "",
};

function StudbookPage() {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  };

  const studbookQuery = useQuery({
    queryKey: ["studbook", query, filters, page],
    queryFn: async () => {
      let req = supabase
        .from("horses")
        .select(
          "id,name,registration_number,breed,breed_type,sex,color,sire_name,dam_name,date_of_birth",
          { count: "exact" },
        )
        .eq("status", "approved");

      if (query) req = req.textSearch("fts", query, { type: "websearch", config: "simple" });
      if (filters.breeds.length) req = req.in("breed_type", filters.breeds);
      if (filters.sexes.length) req = req.in("sex", filters.sexes);
      if (filters.colors.length) req = req.in("color", filters.colors);
      if (filters.yearFrom) req = req.gte("date_of_birth", `${filters.yearFrom}-01-01`);
      if (filters.yearTo) req = req.lte("date_of_birth", `${filters.yearTo}-12-31`);

      req = req
        .order("name", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count, error } = await req;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((studbookQuery.data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-serif text-4xl text-primary">Studbook</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search approved IALHA-registered horses.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, reg #, sire, or dam…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          Search
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="lg:hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="mt-4">
              <FiltersPanel filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} />
            </div>
          </SheetContent>
        </Sheet>
      </form>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <FiltersPanel filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} />
        </aside>

        <section>
          <ResultsTable loading={studbookQuery.isLoading} rows={studbookQuery.data?.rows ?? []} />
          {studbookQuery.data && studbookQuery.data.count > 0 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </section>
      </div>
    </div>
  );
}

function FiltersPanel({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const toggle = (key: "breeds" | "sexes" | "colors", value: string) => {
    const arr = filters[key];
    setFilters({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-4">
      <FilterGroup title="Breed Type">
        {BREEDS.map((b) => (
          <CheckRow
            key={b}
            id={`breed-${b}`}
            label={b}
            checked={filters.breeds.includes(b)}
            onChange={() => toggle("breeds", b)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Sex">
        {SEXES.map((s) => (
          <CheckRow
            key={s.code}
            id={`sex-${s.code}`}
            label={s.label}
            checked={filters.sexes.includes(s.code)}
            onChange={() => toggle("sexes", s.code)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="max-h-40 overflow-y-auto pr-1">
          {COLORS.map((c) => (
            <CheckRow
              key={c}
              id={`color-${c}`}
              label={c}
              checked={filters.colors.includes(c)}
              onChange={() => toggle("colors", c)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Birth Year">
        <div className="flex gap-2">
          <Input
            type="number"
            min={1950}
            max={2100}
            placeholder="From"
            value={filters.yearFrom}
            onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
          />
          <Input
            type="number"
            min={1950}
            max={2100}
            placeholder="To"
            value={filters.yearTo}
            onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
          />
        </div>
      </FilterGroup>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setFilters(EMPTY_FILTERS)}
      >
        Clear all filters
      </Button>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckRow({
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

type Row = {
  id: string;
  name: string;
  registration_number: string | null;
  breed: string | null;
  breed_type: string | null;
  sex: string | null;
  color: string | null;
  sire_name: string | null;
  dam_name: string | null;
};

function ResultsTable({ loading, rows }: { loading: boolean; rows: Row[] }) {
  if (loading) {
    return <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">Searching…</div>;
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="font-serif text-lg text-primary">No horses found matching your search.</p>
        <p className="mt-1 text-sm text-muted-foreground">Try removing filters or broadening your query.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <Th>Registered Name</Th>
            <Th>Reg #</Th>
            <Th>Breed</Th>
            <Th>Sex</Th>
            <Th>Color</Th>
            <Th>Sire</Th>
            <Th>Dam</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2.5">
                <Link to="/studbook/$horseId" params={{ horseId: h.id }} className="font-medium text-primary hover:underline">
                  {h.name}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.registration_number ?? "—"}</td>
              <td className="px-3 py-2.5">{h.breed_type ?? h.breed ?? "—"}</td>
              <td className="px-3 py-2.5 capitalize">{h.sex ?? "—"}</td>
              <td className="px-3 py-2.5">{h.color ?? "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.sire_name ?? "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{h.dam_name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-semibold text-foreground">{children}</th>;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: (number | "…")[] = [];
    const push = (v: number | "…") => arr.push(v);
    const window = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= window) push(i);
      else if (arr[arr.length - 1] !== "…") push("…");
    }
    return arr;
  }, [page, totalPages]);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className={p === page ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
