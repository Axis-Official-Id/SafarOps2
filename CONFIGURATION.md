# Deployment configuration

Vercel project: `awi-digital/safar-ops` (repository `Axis-Official-Id/SafarOps2`).

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the deployment environment.
The build creates `dist/runtime-config.js` from this explicit public allowlist.
It rejects secret/service-role keys. These two public values remain visible in
the browser because Supabase's browser client needs them. Database RLS and
authenticated server checks enforce access.

There is no configured admin email or password in the browser. Roles come from
`safarops_licenses`. Privileged credentials stay in the Supabase Edge Function
environment; do not copy them into browser configuration or public assets.

For local development, set those same public environment variables, run
`node scripts/runtime-config.cjs`, then `npm run dev`. The generated root config
is gitignored. Run `npm run build`, `npm run check`, and `npm test` before release.

The sidebar width is draggable and keyboard adjustable (Left/Right/Home/End).
Width and closed state are stored locally; mobile opens as a drawer. The quote
selection is made on every document load and avoids the preceding quote when
local storage is available. Texts are labeled Indonesian summaries of meaning
with links to the original Quran or sahih hadith references.

Release status: source/build/tests prepared; Vercel environment values saved.
Preview upload was denied by automatic approval review due to existing personal
and banking-like sample content in the full app source. No deployment was
created. Browser interaction verification remains pending.
