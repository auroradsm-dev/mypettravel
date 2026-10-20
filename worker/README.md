# mypetravel-api (Cloudflare Worker)

A small backend helper for MyPetTravel with two jobs:

1. **`POST /ask`** keeps the Anthropic API key on the server. The app sends the chat here with the user's Supabase session, the Worker checks the user is signed in, then calls Claude.
2. **Scheduled ping** every 2 days reads from Supabase so the free project never pauses for inactivity.

## Setup (first time)

```bash
cd worker
npm install
npx wrangler login                          # opens the browser
npx wrangler secret put ANTHROPIC_API_KEY   # paste the new key
npx wrangler secret put SUPABASE_ANON_KEY   # paste the anon key from .env.local
npm run deploy                              # prints https://mypetravel-api.<you>.workers.dev
```

Then in the app's `.env.local`:

```
EXPO_PUBLIC_ASK_URL=https://mypetravel-api.<you>.workers.dev
```

and remove `EXPO_PUBLIC_ANTHROPIC_KEY`.

## Day to day

* `npm run deploy` after changing the Worker
* `npm run logs` to watch live logs (keep alive pings show as `Supabase keep alive: 200`)
* Allowed websites are set in `ALLOWED_ORIGINS` in `wrangler.jsonc`
