# Pimp My Prompt

Scores how marketers brief their AI tools — the prompt itself, and whether
the tool they picked is even the right one for the job.

Stack: **Vite + React** (frontend) · **Supabase** (auth + database) ·
**Vercel** (hosting + serverless API routes) · **Anthropic API** (scoring).

## 1. Local setup

```bash
npm install
cp .env.example .env      # fill in the values from the Supabase/Anthropic steps below
```

The `/api` routes are Vercel Serverless Functions — plain `npm run dev` won't
run them. For local testing with the API working, install the Vercel CLI and use:

```bash
npm i -g vercel
vercel dev
```

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers**: confirm Email is enabled.
3. **Authentication → Settings**: for frictionless testing, turn **off**
   "Confirm email" (Email Auth section) so sign-up logs people in immediately.
   Leave it on if you want real email verification before launch.
4. **SQL Editor → New query**: paste the contents of `supabase/schema.sql` and run it.
   This creates `results`, `usage_totals`, `global_usage`, and the
   `increment_usage` function.
5. **Settings → API**: copy the **Project URL** and the **anon public key** →
   these are `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (and their
   non-`VITE_` server-side twins).
6. Same page, reveal the **service_role** key (keep it secret) →
   `SUPABASE_SERVICE_ROLE_KEY`. This is what lets `/api/score` and
   `/api/admin-usage` write/read past the RLS policies.

## 3. GitHub

```bash
git init
git add .
git commit -m "Initial commit: Pimp My Prompt"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR-USERNAME/pimp-my-prompt.git
git branch -M main
git push -u origin main
```

## 4. Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build command / output dir: defaults are fine.
3. **Project Settings → Environment Variables** — add all of these
   (values from step 2 and your Anthropic account):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same value as `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (optional — defaults to `claude-sonnet-5`; check the
     [Anthropic Console](https://console.anthropic.com) for the current model ID if this drifts)
   - `ADMIN_EMAILS` — comma-separated emails allowed to see the Usage & Alerts panel, e.g. `you@company.com`
   - `ALERT_WEBHOOK_URL` (optional — a Slack incoming-webhook URL; if set, `/api/score`
     pings it the moment total spend crosses the alert threshold)
4. **Deploy**. Vercel builds the Vite app and turns everything in `/api` into serverless functions automatically.

## 5. Test it

Open the deployed URL → sign up → run a query → check Supabase's **Table
Editor** for a new row in `results` and `usage_totals`.

## How the pieces fit together

- **Auth**: real Supabase Auth (email/password) — sessions persist across
  devices, unlike the earlier in-chat prototype.
- **`results`**: one row per scan, protected by row-level security so each
  user only ever sees their own (`user_id = auth.uid()`).
- **`usage_totals` / `global_usage`**: no RLS policies at all — the anon key
  can't touch them. Only the service-role key (used server-side in
  `/api/admin-usage.js`) can read them, and only for emails listed in `ADMIN_EMAILS`.
- **`/api/score.js`**: verifies the caller's Supabase session server-side,
  calls the Anthropic API with your secret key (never exposed to the
  browser), scores the submission, saves the result, and atomically updates
  usage totals via the `increment_usage` Postgres function.
- **Rubric & cost math**: lives in `lib/rubric.js`, imported by both the
  frontend (for labels) and the API route (for the system prompt and cost
  calculation) — one source of truth.

## Extending it

- **Real cost tracking**: `RATE` in `lib/rubric.js` is a reference number.
  Check the Anthropic Console periodically and update it, or read pricing
  from the API if Anthropic exposes that later.
- **Notifications beyond the in-app banner**: `ALERT_WEBHOOK_URL` already
  wires into Slack-style incoming webhooks. For email, swap that fetch call
  for whatever provider you use (Resend, Postmark, etc.).
