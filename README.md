# EventPlanner

AI-powered event planning for tech communities. List your events, generate operational plans, and work through practical checklists.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in values:

- **Clerk** — create an app at [clerk.com](https://clerk.com), enable Email + Google sign-in
- **Supabase** — create a project at [supabase.com](https://supabase.com)
- **OpenAI** — API key for plan generation

### 3. Run database migration

In the Supabase SQL editor, run migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_prd_schema.sql
supabase/migrations/003_event_currency.sql
supabase/migrations/004_share_token.sql
supabase/migrations/005_features.sql
```

Migration 002 adds tasks, timeline, budget, team collaboration, activity logs, and templates. Migration 003 adds per-event budget currency. Migration 004 adds public share links. Migration 005 adds plan source tracking, task contacts, user templates, email reminders, and onboarding preferences.

Optional environment variables:

- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — deadline reminder emails (daily cron)
- `CRON_SECRET` — secures `/api/cron/reminders` (set in Vercel Cron too)
- `NEXT_PUBLIC_APP_URL` — link target in reminder emails

### 4. Clerk webhook (optional)

Point a Clerk webhook to `/api/webhooks/clerk` for `user.created` and `user.updated` events.

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Core flow

1. Sign in
2. Create an event with basic details
3. AI generates a plan summary + categorized checklists
4. Check items off as you complete them

## Tech stack

- Next.js App Router
- Clerk authentication
- Supabase Postgres
- Vercel AI SDK + OpenAI
- Tailwind CSS + shadcn-style UI components
