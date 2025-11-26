# PopChoice

A simple movie recommendation app powered by Supabase and OpenAI, built with React + Vite and served via a Cloudflare
Worker.

## How it works

- On first load, if the `movies` table is empty, the app chunks a local movies dataset, creates embeddings, and stores
  content + vectors in Supabase.
- When a user submits a query, it’s embedded and matched against stored vectors.
- The best match is provided to an LLM, which returns a strict JSON payload with a title, short description, and release
  year; the UI renders it.

## Project structure

- Frontend (React + Vite): `src/`, built to `dist/`
- Cloudflare Worker: `popchoice-worker/` (serves static assets and handles API POSTs)

## Getting started

1) Install

- npm install

2) Environment

- Create a `.env` in the project root:
    - VITE_OPENAI_API_KEY=...
    - VITE_SUPABASE_URL=...
    - VITE_SUPABASE_API_KEY=...
    - VITE_TMDB_API_KEY=...

3) Supabase setup

- Create a `movies` table matching your embedding schema.
- Provide an RPC (e.g., `match_movies`) that accepts:
    - query_embedding float[] (or vector type)
    - match_count int
    - match_threshold float
- Ensure it returns the best match context/embedding.

4) Development

- npm run dev — start Vite dev server
- npm run build — production build to dist/
- npm run preview — preview the built app

## Deployment

- Frontend: `npm run build` produces `dist/`
- Worker:
    - Configure the Worker to:
        - Serve static assets from `dist/` (GET / returns the app)
        - Handle API requests on POST / and return JSON with CORS headers
    - Deploy with Wrangler

## CORS

- Preflight (OPTIONS) should return 204 with:
    - Access-Control-Allow-Origin: your site origin (or *)
    - Access-Control-Allow-Methods: POST, OPTIONS
    - Access-Control-Allow-Headers: Content-Type
- Include the same headers on success and error responses.

## Notes

- Keep API keys in `.env` and never commit them.
- If you change the embedding model, update vector dimensions and reinitialize data.
- The RPC must return the context/embedding used in matching.

## License

MIT