export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border bg-card p-10 shadow-sm">
        <div className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
          Coming soon
        </div>
        <h1 className="mt-4 font-heading text-3xl text-primary">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
