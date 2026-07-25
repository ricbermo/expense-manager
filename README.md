# Gastos — Expense Tracker

A personal expense tracker and budget manager built for a **single user** who wants a calm, honest view of their money. Mobile-first PWA with a clean slate-and-navy design — no gamification, no marketing tone, no alarm fatigue.

> **Note:** This is a single-user app by design. RLS policies lock data to one authorized email. If you need multi-user, you'll need to adapt the auth layer.

---

## Features

- **Dashboard** — monthly income, expenses, savings rate, expense projection, category breakdown, monthly trend
- **Transactions** — record, edit, delete expenses/income/transfers with category, account, budget, date, optional installments
- **Accounts** — savings, cash, credit card, and loan accounts with balance tracking and credit card statement management
- **Budgets** — per-category monthly budgets with progress tracking (both expense budgets and income targets)
- **Installments** — multi-month installment expenses with a projection view
- **SMS automation** (optional) — forward bank SMS to a Gemini-powered endpoint to auto-record expenses
- **iOS Shortcut** (optional) — quick-add transactions via a shared-secret API
- **PWA** — installable on mobile home screen with offline support via service worker
- **Dark mode** — full dark theme that inverts the palette without introducing new hues

---

## Screenshots

Vista previa de las pantallas principales con datos ficticios. Abre cada HTML en el navegador para ver el mockup en vista móvil.

| Pantalla | Archivo |
|----------|---------|
| **Dashboard** — Resumen mensual, KPI cards, tendencia, gastos por categoría | [`screenshots/screenshot-dashboard.html`](screenshots/screenshot-dashboard.html) |
| **Movimientos** — Lista de transacciones con búsqueda y filtros | [`screenshots/screenshot-transactions.html`](screenshots/screenshot-transactions.html) |
| **Cuentas** — Resumen de saldos, tarjetas de crédito y próximos pagos | [`screenshots/screenshot-accounts.html`](screenshots/screenshot-accounts.html) |
| **Presupuestos** — Límites por categoría con barras de progreso y alertas | [`screenshots/screenshot-budgets.html`](screenshots/screenshot-budgets.html) |
| **Ajustes** — Configuración, zona de peligro y cierre de sesión | [`screenshots/screenshot-settings.html`](screenshots/screenshot-settings.html) |
| **Ingresar** — Pantalla de inicio de sesión | [`screenshots/screenshot-login.html`](screenshots/screenshot-login.html) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Runtime | [Node.js](https://nodejs.org/) 24+ / [Bun](https://bun.sh/) 1.3+ |
| UI | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [@base-ui/react](https://base-ui.com/) |
| Forms | [react-hook-form](https://react-hook-form.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Backend / Auth | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/) |
| PWA | [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) |
| Icons | [Lucide](https://lucide.dev/) |
| Notifications | [Sonner](https://sonner.emilkowalinski.com/) |
| Linting | [Biome](https://biomejs.dev/) |

---

## Quick Start

### Prerequisites

- Node.js 24+ or Bun 1.3+
- A [Supabase](https://supabase.com/) project

### Setup

```bash
# 1. Clone and install
git clone https://github.com/ricbermo/expense-manager.git
cd expense-manager
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `ALLOWED_USER_EMAIL` | The email that will be the sole authorized user |
| `SUPABASE_SECRET_KEY` | Supabase secret key for server-side admin operations |

### Database

1. Run `supabase/schema.sql` in your Supabase SQL editor to create tables, indexes, triggers, and RLS policies
2. Create your user in **Supabase Auth** (use the email you set in `ALLOWED_USER_EMAIL`)
3. (Optional) Run `supabase/seed.sql` to populate default categories

> **Important:** Before running SQL, replace `your-email@example.com` in the RLS policies with your actual email. Every table policy locks data to `auth.jwt() ->> 'email'` — if the email doesn't match, you get no data.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Sign in with the Supabase Auth user you created.

---

## Customization

- **Your email** — set `ALLOWED_USER_EMAIL` in your environment. The fallback is in `src/lib/auth/allowed-user.ts`.
- **Categories** — edit `supabase/seed.sql` and add/remove rows. Categories have a name, icon (Lucide name), color, and type (`expense` or `income`). Default categories are in Spanish — translate or replace them to suit your language and spending patterns.
- **Theme** — colors, typography, and component styles are defined in `DESIGN.md` and the token system in `.impeccable/design.json`. The palette is cool slate-and-navy; fork-friendly by design.
- **Currency** — all amounts are stored as `BIGINT` (integer cents of the base unit). The display format can be changed in the currency utility at `src/lib/utils/currency.ts`.

---

## Architecture Notes

- **Single-user auth**: The middleware checks `ALLOWED_USER_EMAIL` after Supabase auth. RLS policies on every table enforce the same email check at the database level. This is defense-in-depth for a personal finance app.
- **Mobile-first**: The layout is designed for a phone screen first. The bottom nav and compact cards work best on mobile but scale to desktop via `max-w-5xl`.
- **Amounts as BIGINT**: All monetary values are stored in the smallest unit (cents) as `BIGINT` to avoid floating-point precision issues. Display formatting lives in the frontend.
- **Balance triggers**: Account balances are auto-updated by PostgreSQL triggers on transaction insert/delete — no application-level balance recomputation.
- **Cloudflare Workers**: The app deploys to Cloudflare Workers via OpenNext. Environment variables are managed as Cloudflare Worker secrets, not `.env` files, in production.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run preview` | Preview Cloudflare Worker build |
| `npm run deploy` | Deploy to Cloudflare Workers |

---

## License

[MIT](LICENSE)