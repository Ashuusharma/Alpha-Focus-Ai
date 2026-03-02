# Supabase + Git Migration Guide (Personal → Company)

## Key clarification
Supabase is **not tied to a GitHub account**.
- Your Git repository identity can change.
- Your Supabase project can remain the same.
- You only need to update environment variables/secrets in the new repo.

So when moving from personal Git to company Git, you **do not need to recreate all tables** if you keep the same Supabase project.

## Two safe migration options

### Option A — Keep same Supabase project (fastest)
1. Keep existing Supabase project and database as source of truth.
2. Push code to company Git repository.
3. In company deployment environment, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if needed)
4. Rotate old personal secrets if required by policy.
5. Restrict access in Supabase team/project members.

### Option B — New company Supabase project (clean ownership)
1. Create a new Supabase project under company org.
2. Run SQL schema/migrations (start with `supabase/alpha_sikka_schema.sql`).
3. Export data from old project and import into new project.
4. Update environment variables in the company repo/deploy target.
5. Verify row counts and key reports before cutover.
6. Switch traffic to new project, then archive old one.

## Recommended production strategy
- Keep schema as SQL migration files in repo (`supabase/*.sql`).
- Never hardcode Supabase keys in source.
- Use different Supabase projects for dev/staging/prod.
- Use service-role key only on server routes/services.

## Alpha Sikka data model
Use append-only ledger (`alpha_sikka_transactions`).
- Balance = `SUM(amount)`
- Lifetime earned = `SUM(amount where amount > 0)`
- Tier derived from lifetime earned
- Redemption is negative transaction rows

## Company handoff checklist
- [ ] Add company Supabase members and roles
- [ ] Rotate all API keys/tokens
- [ ] Move env vars to company secret manager
- [ ] Confirm RLS policies in production
- [ ] Run a smoke test for earning, redemption, and dashboard summary

## Free Tier setup (recommended path for you)

You can do everything from the Supabase web dashboard. No CLI required.

### 1) Create project (Free plan)
1. Go to Supabase dashboard → New project.
2. Pick region closest to users.
3. Save DB password in your password manager.

### 2) Create core schema
1. Open SQL Editor.
2. Run [supabase/alpha_sikka_schema.sql](supabase/alpha_sikka_schema.sql).
3. Run [supabase/user_app_state.sql](supabase/user_app_state.sql).
4. Run [supabase/alpha_sikka_atomic.sql](supabase/alpha_sikka_atomic.sql).
3. Confirm these objects exist:
    - `alpha_sikka_transactions` table
    - `alpha_sikka_summary` view
   - `user_app_state` table
   - `process_alpha_sikka_transaction` function
    - RLS policies

### 3) Configure env in local app
In `.env.local` (never commit):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (must be secret/service-role, not `sb_publishable_*`)

Template keys are already listed in [.env.example](.env.example).

### 4) Test A$ APIs
Use app auth login first, then call:
- `POST /api/alpha-sikka/earn`
- `GET /api/alpha-sikka/summary`
- `POST /api/alpha-sikka/spend`

Example body:
```json
{
   "action": "daily_login",
   "referenceId": "daily_login_2026-03-02"
}
```

### 4.1) SQL verify checks (run in SQL Editor)
```sql
select to_regclass('public.alpha_sikka_transactions') as tx_table;
select to_regclass('public.alpha_sikka_summary') as summary_view;
select * from public.alpha_sikka_summary limit 5;
```

### 5) Free-tier guardrails
- Keep transaction metadata small (`jsonb` payload size impacts bandwidth).
- Avoid polling summary too frequently (cache in UI where possible).
- Batch non-critical writes when possible.
- Monitor monthly database + egress usage in project billing panel.

### 6) Auth mapping note (important)
Current app auth now uses Supabase session bearer tokens.
API routes resolve user with `auth.uid()` and map all writes by that UUID.
Alpha Sikka earn/spend now executes through the atomic Postgres RPC `process_alpha_sikka_transaction`.

## Git switch answer (personal Git → company Git)

You do **not** need to recreate tables when moving repos if you keep the same Supabase project.
You only need to:
1. Move code to company repo.
2. Add same env values in company deployment secrets.
3. Rotate keys and remove personal access.

Create a new Supabase project only if company policy requires separate ownership/billing.
