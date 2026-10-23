# Mypetravel API (Cloudflare Worker)

Server side for the app. It does two jobs:

1. **`POST /chat`** for Ask Claude. The Anthropic key lives only here, never in the app bundle.
   * Only signed in users: the app sends its Supabase session token, the Worker checks it with Supabase.
   * Only our own sites: requests from other origins are refused.
   * The system prompt, model, token budget and input sizes are set here, so the endpoint can't be used as a general purpose LLM proxy.
2. **Daily keep alive.** A cron trigger makes one database request a day so the free Supabase project doesn't pause.

## First deploy

```bash
cd worker
npm install
npx wrangler login                          # first time only
npx wrangler secret put ANTHROPIC_API_KEY   # paste a NEW key from console.anthropic.com
npx wrangler secret put SUPABASE_ANON_KEY   # same value as EXPO_PUBLIC_SUPABASE_ANON_KEY
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
