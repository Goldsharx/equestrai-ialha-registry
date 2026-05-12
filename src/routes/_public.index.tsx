import { Link, createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Network, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-andalusian.jpg";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "EquestRai — IALHA Equestrian Registry" },
      {
        name: "description",
        content:
          "The official IALHA registry. Register horses, search the studbook, and join a community preserving the Andalusian and Lusitano breeds since 1979.",
      },
      { property: "og:title", content: "EquestRai — IALHA Equestrian Registry" },
      {
        property: "og:description",
        content:
          "Preserving excellence since 1979. The official IALHA registry for Andalusian & Lusitano horses.",
      },
      { property: "og:image", content: heroImage },
      { property: "twitter:image", content: heroImage },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: ClipboardList,
    title: "Digital Registration",
    body: "Submit applications online. Track status in real-time. No more paper forms.",
  },
  {
    icon: Network,
    title: "Verified Pedigrees",
    body: "4-generation pedigree charts verified against our studbook of 15,000+ horses.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    body: "Intelligent document processing, automated screening, and instant member support.",
  },
];

const stats = [
  { value: "15,000+", label: "Registered Horses" },
  { value: "4", label: "Breeds Served" },
  { value: "1979", label: "Established" },
  { value: "100%", label: "Digital" },
];

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Andalusian horse at golden hour"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/85" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 30%, color-mix(in oklab, var(--gold) 35%, transparent), transparent 55%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              International Andalusian &amp; Lusitano Horse Association
            </p>
            <h1 className="mt-5 font-heading text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Your Dream. <span className="text-accent">Our Purpose.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85 sm:text-xl">
              The International Andalusian &amp; Lusitano Horse Association —
              Preserving Excellence Since 1979.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground shadow-lg shadow-black/20 hover:bg-accent/90"
              >
                <Link to="/register">Register a Horse</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:border-accent hover:bg-white/10 hover:text-accent"
              >
                <Link to="/studbook">Search Studbook</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:border-accent hover:bg-white/10 hover:text-accent"
              >
                <Link to="/signup">Become a Member</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl text-primary sm:text-4xl">
              A modern home for a timeless tradition
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Everything you need to register, manage, and celebrate your horses.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-xl text-primary">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-y-10 text-center md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-heading text-4xl text-accent sm:text-5xl">{s.value}</dd>
                <p className="mt-2 text-sm uppercase tracking-wider text-primary-foreground/70">
                  {s.label}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl text-primary sm:text-4xl">
            Ready to modernize your registry experience?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Join breeders, owners, and IALHA members already on EquestRai.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground shadow-lg shadow-primary/10 hover:bg-accent/90"
            >
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
