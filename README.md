# Civic Letter

Find your Canadian elected representatives at every level of government by
postal code and send them a clear, professional letter in minutes.
Bilingual (English / French).

## How it works

1. **Look up** — enter a postal code; representatives are fetched from the
   [Open North Represent API](https://represent.opennorth.ca/) and grouped by
   level of government (Municipal / Regional / Provincial / Federal). If the
   direct call is blocked, an AI fallback (Anthropic API + web search) finds
   the same directory data.
2. **Choose** who to write to.
3. **Describe** your concern — pick an AI-drafted letter or a fill-in template.
4. **Review & send** — edit the letter, open it in your email app, or copy it.

## Running locally

```sh
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

### AI-drafted letters

Drafting prefers a **local model** served by [Ollama](https://ollama.com) —
private, free, and offline. If Ollama is running, the app auto-detects the
best installed model (it prefers `gemma*`, e.g. Google's Gemma). To set it up:

```sh
ollama pull gemma4:e4b   # or any small instruct model
```

Nothing else to configure — the app finds it at `http://localhost:11434`.
Override with `VITE_OLLAMA_URL` / `VITE_OLLAMA_MODEL` in `.env.local` if
needed. The first draft can take a few minutes while the model loads into
memory; after that, drafts take a few seconds.

If no local model is running, drafting falls back to the Anthropic API when
`VITE_ANTHROPIC_API_KEY` is set (see `.env.example`), and the fill-in template
mode always works with no AI at all.

> **Security note:** an Anthropic key in `.env.local` is bundled into the
> client-side JavaScript. That is fine for personal/local use, but never ship
> a shared key on a public site — proxy the call through a server endpoint
> instead. (The Ollama path has no such concern — it talks to your own
> machine.)

### Municipal coverage

The Represent directory lacks council data for many smaller cities, towns,
and villages. When that happens the app still shows a Municipal entry —
"Mayor & Council of {your city}" — so every political level is always
writable: generate the letter, copy it, and submit it via the town office
(the "Official's page" button searches for the exact contact page).

## Build for production

```sh
npm run build    # outputs static site to dist/
npm run preview  # serve the production build locally
```

The build is a fully static site and can be hosted anywhere (Vercel, Netlify,
GitHub Pages, etc.).
