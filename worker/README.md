# Mypetravel API (Cloudflare Worker)

Server side for the app. It does two jobs:

1. **`POST /chat`** for Ask Claude. The Anthropic key lives only here, never in the app bundle.
   * Only signed in users: the app sends its Supabase session token, the Worker checks it with Supabase.
   * Only our own sites: requests from other origins are refused.
   * The system prompt, model, token budget and input sizes are set here, so the endpoint can't be used as a general purpose LLM proxy.
2. **Supabase guard**, every hour from a cron trigger:
   * **Prevent:** calls `ping()`, which writes a timestamp. That is real database activity, so the free project doesn't pause for inactivity.
   * **Self heal:** if the ping fails, it asks the Supabase Management API for the project status and, if the project is paused, restores it.
   * **Tell me:** pushes an alert to my phone (ntfy) when it restores the project, when the database is back, or when something else is wrong.
   * Stateless: `ping()` returns the previous timestamp, so a gap of more than 3 hours means the database was down and is back.
   * The table and function are in [`sql/heartbeat.sql`](sql/heartbeat.sql). Row level security blocks direct access; the function can only update that one timestamp, so the public anon key can call it safely.

## First deploy

Run [`sql/heartbeat.sql`](sql/heartbeat.sql) once in the Supabase SQL editor first, otherwise the hourly guard reports a failing ping.

```bash
cd worker
npm install
npx wrangler login                          # first time only
npx wrangler secret put ANTHROPIC_API_KEY   # paste a NEW key from console.anthropic.com
npx wrangler secret put SUPABASE_ANON_KEY   # same value as EXPO_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_ACCESS_TOKEN  # Supabase personal access token (Account > Access Tokens)
npx wrangler secret put NTFY_TOPIC          # ntfy topic for phone alerts
npm run deploy
```

Wrangler prints the address, for example `https://mypetravel-api.<your-subdomain>.workers.dev`.
Put it in the app's `.env.local` as `EXPO_PUBLIC_ASK_CLAUDE_URL` (and in Netlify's environment variables), then rebuild the app.

## Local development

Create `worker/.dev.vars` (git ignored):

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_ANON_KEY=...
```

Then `npm run dev` and point `EXPO_PUBLIC_ASK_CLAUDE_URL` at `http://localhost:8787`.
Allowed origins are listed in `wrangler.jsonc` (`ALLOWED_ORIGINS`).
