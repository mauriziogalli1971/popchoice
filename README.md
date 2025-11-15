# PopChoice

A simple movie recommendation app powered by Supabase and OpenAI.

## How it works

- On first load, if the `movies` table is empty, the app chunks a local movies dataset, embeds each chunk, and stores
  content + vectors in Supabase.
- When the user submits the form, their input is embedded and matched against stored vectors.
- The best match is passed to an LLM that returns a strict JSON payload with a title and short description, which is
  rendered in the UI.

## Environment & scripts

- Dev: `npm run dev` — starts Vite dev server
- Build: `npm run build` — creates production build
- Preview: `npm run preview` — serves the built app locally

## Notes

- Keep your API keys in `.env` and never commit them.
- If you change embedding models, update the vector dimension in your database and reinitialize data.
- The RPC function must return the context/embedding needed by the app’s matching flow.

## License

MIT