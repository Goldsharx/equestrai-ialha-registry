import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "EquestRai — IALHA Equestrian Registry" },
      {
        name: "description",
        content:
          "The official IALHA registry for Andalusian and Lusitano horses. Search the studbook, register and transfer horses.",
      },
      { property: "og:title", content: "EquestRai — IALHA Equestrian Registry" },
      {
        property: "og:description",
        content:
          "The official IALHA registry for Andalusian and Lusitano horses.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              International Andalusian &amp; Lusitano Horse Association
            </p>
            <h1 className="mt-4 font-heading text-5xl leading-tight sm:text-6xl">
              The official registry for{" "}
              <span className="text-accent">Andalusian &amp; Lusitano</span> horses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/80">
              Search the studbook, register new horses, manage ownership transfers,
              and connect with breeders — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/studbook">Browse Studbook</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-accent"
              >
                <Link to="/signup">Create an Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Studbook Search",
              body: "Look up registered horses by name, breed, sire, or dam.",
            },
            {
              title: "Register a Horse",
              body: "Submit registrations and ownership records online.",
            },
            {
              title: "Member Portal",
              body: "Manage your stable, transfers, and notifications in one place.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-heading text-xl text-primary">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
