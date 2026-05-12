import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Languages, UserCircle, LogOut, LayoutDashboard, Heart, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function HeaderLanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary-foreground/90 transition-colors hover:bg-white/10 hover:text-accent"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "ES" : "EN"}
    </button>
  );
}

export function SiteHeader(_props: { unreadCount?: number } = {}) {
  const [open, setOpen] = useState(false);
  const { session, user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Account";

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/studbook", label: t("nav.studbook") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cream text-navy font-heading text-lg font-bold">
            I
          </div>
          <div className="leading-tight">
            <div className="font-heading text-lg font-semibold text-accent">Equestrai</div>
            <div className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
              IALHA Registry
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-primary-foreground/90 transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderLanguageToggle />
          {session && <NotificationBell />}

          <div className="hidden md:flex md:items-center md:gap-2">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-white/10 hover:text-accent"
                  >
                    <UserCircle className="h-5 w-5" />
                    <span className="max-w-[140px] truncate">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex w-full cursor-pointer items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/horses" className="flex w-full cursor-pointer items-center gap-2">
                      <Heart className="h-4 w-4" /> {t("nav.myHorses")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex w-full cursor-pointer items-center gap-2">
                      <UserIcon className="h-4 w-4" /> {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-accent">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/signup">{t("nav.signup")}</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-primary md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent"
                activeProps={{ className: "text-accent" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent">
                  {t("nav.dashboard")}
                </Link>
                <Link to="/horses" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent">
                  {t("nav.myHorses")}
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent">
                  {t("nav.profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
                >
                  {t("nav.signup")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
