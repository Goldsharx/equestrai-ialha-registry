# Equestrai — IALHA Equestrian Registry Scaffold

A React + TypeScript app on the existing TanStack Start + Tailwind v4 stack, branded for IALHA, with Lovable Cloud (Supabase) wired up and all placeholder routes/layout in place. This plan covers the foundation only — no real auth flows, registry logic, or chat behavior yet (those become follow-ups).

## 1. Branding & design system (`src/styles.css`)

Add IALHA tokens in OKLCH (converted from the supplied hex):

- `--navy` `#1B2A4A` → `--primary`
- `--gold` `#C5A55A` → `--accent` (and a `--ring` highlight)
- `--cream` `#F5F0E8` → `--background` / `--muted`
- `--white` `#FFFFFF` → `--card`
- `--dark-gray` `#333333` → `--foreground`

Map foregrounds (primary-foreground = cream, accent-foreground = navy). Register `--font-heading` (Playfair Display) and `--font-sans` (Inter) in `@theme inline`, and add Google Fonts `<link>` via the root route `head()` (preconnect + Playfair Display 400/600/700 + Inter 400/500/600). Set `body { font-family: var(--font-sans) }` and `h1–h6 { font-family: var(--font-heading) }` in the base layer.

Dark mode tokens: muted navy background, cream foreground, gold accent preserved.

## 2. Lovable Cloud

Enable Lovable Cloud so Supabase URL/keys, the generated client (`src/integrations/supabase/client`), and auth middleware are provisioned automatically. No env vars need to be hand-set — the platform injects `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

No tables yet. Auth schema decisions (profiles table, roles) will be made when login/signup is actually implemented.

## 3. Layout components (`src/components/layout/`)

- `SiteHeader.tsx` — navy bar, gold "Equestrai" wordmark + IALHA logo placeholder (square cream tile) on the left; nav links Home / Studbook / Login / Sign Up; mobile hamburger using shadcn `Sheet`; notification bell (`Bell` icon) with a gold badge showing a hardcoded unread count for now.
- `SiteFooter.tsx` — navy background, three columns: contact (address, phone, email `mailto:`), social icon row (Facebook/Instagram/X placeholders linking to `#`), "Powered by Equestrai" tagline.
- `PublicLayout.tsx` — header + `<Outlet />` + footer; used by marketing/auth routes.
- `AppSidebar.tsx` + `AppLayout.tsx` — shadcn `Sidebar` (collapsible="icon") with items Dashboard, My Horses, Register, Transfer, Profile, Chat, plus an Admin section. Header (with bell) stays on top; sidebar on the left; main content in the middle. Active route highlighted via `useRouterState`.

Both layouts are pathless TanStack layout routes so child route files render inside automatically.

## 4. Routes (`src/routes/`)

Replace the placeholder index. Every route gets its own `head()` with unique title + description.

Public (under `_public.tsx` layout → `PublicLayout`):
- `_public.index.tsx` → `/` — IALHA hero (navy + gold), short intro, CTAs to Studbook and Sign Up.
- `_public.studbook.tsx` → `/studbook` — placeholder search/listing UI.
- `_public.login.tsx` → `/login` — email + password form (UI only, non-functional).
- `_public.signup.tsx` → `/signup` — signup form (UI only).

App (under `_app.tsx` layout → `AppLayout`):
- `_app.dashboard.tsx` → `/dashboard`
- `_app.horses.tsx` → `/horses`
- `_app.register.tsx` → `/register`
- `_app.transfer.tsx` → `/transfer`
- `_app.profile.tsx` → `/profile`
- `_app.notifications.tsx` → `/notifications`
- `_app.chat.tsx` → `/chat`
- `_app.admin.tsx` → `/admin`

Each app page renders a branded "Coming soon" card with the page title and a one-line description so the navigation feels real.

No auth gating yet — sidebar routes are reachable directly so the structure is browsable. We'll add `beforeLoad` redirects when real auth lands.

## 5. Root route updates (`src/routes/__root.tsx`)

- Add Google Fonts links + IALHA-flavored default meta (`title: "Equestrai — IALHA Registry"`, description, og tags).
- Keep the existing 404 / error components but restyle them with the new tokens (navy headings, gold buttons).

## 6. Out of scope for this turn

- Real Supabase auth (signup/login/session, profiles table, roles)
- Real notification data (bell count is static)
- Studbook search backend, horse registration logic, transfers, chat, admin tools
- Logo asset (placeholder tile until the user provides one)

These are intentional follow-ups so this turn delivers a clean, branded shell we can build on.

## Technical notes

- Tailwind v4 — no `tailwind.config.js`; tokens live in `@theme inline` in `src/styles.css`.
- Routing is TanStack Router file-based; layout routes use the `_public` / `_app` pathless prefix and children render via `<Outlet />`.
- Icons from `lucide-react` (`Bell`, `Menu`, `LayoutDashboard`, `Horse`/`Rabbit` fallback, `FilePlus`, `ArrowLeftRight`, `User`, `MessageSquare`, `Shield`).
- Supabase client is imported from `@/integrations/supabase/client` once Cloud is enabled — no manual env wiring needed.
