import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="font-heading text-xl font-semibold text-accent">EquestRai</div>
          <p className="mt-2 text-sm text-primary-foreground/70">
            The official registry platform of the International Andalusian &amp;
            Lusitano Horse Association.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-heading text-base text-accent">Contact</h3>
          <p className="flex items-start gap-2 text-primary-foreground/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>812 Old Rosenberg Road<br />Richmond, TX 77469</span>
          </p>
          <p className="flex items-center gap-2 text-primary-foreground/80">
            <Phone className="h-4 w-4 text-accent" />
            <a href="tel:+19792700935" className="hover:text-accent">979-270-0935</a>
          </p>
          <p className="flex items-center gap-2 text-primary-foreground/80">
            <Mail className="h-4 w-4 text-accent" />
            <a href="mailto:info@ialha.org" className="hover:text-accent">info@ialha.org</a>
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-heading text-base text-accent">Follow</h3>
          <div className="flex gap-3">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Twitter, label: "Twitter" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-primary-foreground/80 transition-colors hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} IALHA. All rights reserved.</span>
          <span>
            Powered by <span className="font-semibold text-accent">EquestRai</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
