# SafarOps — Admin, Maps, AI and Multilingual Upgrade PRD

**Version:** 1.0  
**Date:** 3 November 2026  
**Status:** Requirements and implementation plan; no application, account, database or deployment change is made by this document.  
**Implementation companion:** `SafarOps-Admin-Maps-AI-Implementation-Prompt.md` in this directory.

## 1. Product decision

Upgrade the existing SafarOps Umroh website and staff workspace while preserving the public homepage's identity and the established operational workflows. Split the current monolithic HTML into maintainable HTML pages and shared JavaScript/CSS, add a multi-location Google Map to the staff workspace, provide a bottom-right AI assistant on both the public homepage and staff pages, and add a secure `/admin` area for agency owners to see their agency's people and AI usage. Add Indonesian/English switching and simple, reliable local setup documentation.

**Confirmed by the user:**

- The chatbot belongs on **both** the public homepage and the authenticated staff dashboard.
- The admin/workspace map must support **several locations on one map**.
- An agency owner sees users and AI usage **only within their own agency**. Ordinary staff do not get owner access.
- The seven attached screenshots are the dashboard visual references. The finished workspace must also look like the existing SafarOps homepage.
- The implementer must inspect existing Supabase state and produce reviewed `.sql` files for necessary additions, modifications, data updates and removals. Existing data and accounts must be protected.
- Supply an environment-variable inventory, what each value does, where to obtain it, and a short local installation guide. Never place passwords or server-only API keys in source control or browser bundles; expose deliberately public, restricted browser keys only through an explicit allowlist.

**Working assumptions, not yet confirmed business facts:** An OpenAI Responses API integration is the reference AI provider for planning; the implementation must make the provider and model configurable and may adapt if the user chooses another provider. The map initially shows only owner-supplied, verified office, hotel or meeting-point locations. No actual location list, API credentials, AI quota numbers, or public package catalog has been supplied. Missing values produce clear setup/unavailable states.

## 2. Existing application: observed integration map

Source inspection on 3 November 2026; the working tree has ongoing user/main-chat changes that must be preserved. These are observations, not a claim that all production behavior has been verified.

| Area | What exists in the checkout | Integration consequence |
| --- | --- | --- |
| Frontend | `index.html` contains the public landing, `auth-view`, onboarding, workspace tabs and most application code. `landing.css`, `public-site.js`, `public-config.js`, `validation.js` are separate. HTML, CSS and vanilla JavaScript with existing CDNs; no frontend framework. | Split the HTML as requested, extract shared logic carefully, and preserve the current stack unless a necessary incompatibility is demonstrated. |
| Views | Existing workspace tabs include overview, packages, CRM, manifest/rooming, finance, settings and super-admin. Login/activation is opened from the public page through `public-site.js`. | Keep all current operations, session restoration, modal/activation paths, reports, exports, printing and branding. A new `/admin` owner route is distinct from the everyday workspace. |
| Authentication | `App.init`, `bindAuthEvents`, `handleAuthenticatedUser` and `logout` use Supabase Auth and existing local storage. The original code also contains client-side local-user fallbacks and an `email.includes('admin')` menu decision. | The email heuristic and client-only state are not authoritative authorization. Preserve valid accounts, but design and test a verified server/RLS-backed owner role before enabling owner-only data or AI management. Explain any compatibility changes; never add a hardcoded account or password. |
| Operational data | Source references `safarops_packages`, `safarops_jamaah`, `safarops_payments` and `safarops_licenses`. Client operations include select/insert/update/delete and field-specific updates. | These names and calls are observed in source; actual schema, grants, RLS, ownership and data quality remain unverified. Do not assume a tenant column exists or change a payload based on a screenshot. |
| Existing build | `scripts/serve.cjs` serves an allowlist; `scripts/build.cjs` copies five named entry files and top-level runtime assets to `dist/`; `vercel.json` serves `dist/` with a static build. `package.json` has dev/check/test/build scripts. | New HTML, shared assets, routes and any server functions must be included and verified in **both** local and Vercel execution. A static HTML file alone cannot protect an admin API or hold a provider secret. |
| Local config | `public-config.js` contains public brand/contact placeholders; its WhatsApp destination is empty. `.gitignore` currently ignores `.env*`. | Add a safe `.env.example` exception when implementing it; use an explicit public-config allowlist and keep secrets server-only. Do not invent customer contact details. |
| Live database access | The connected Supabase account could not access the project referenced by the app: the project lookup returned a permission error. | Real schema/RLS inspection, accurate migrations and live-login checks remain dependent on access to the correct project. The current document does not claim a database audit. |

The existing checkout is the integration target. Review `git status`, current uncommitted changes and applicable `AGENTS.md` files again immediately before implementation; do not replace or reset another active chat's work.

## 3. Users and journeys

| Actor | Need | Expected journey |
| --- | --- | --- |
| Public visitor / calon jamaah | Understand the offering, ask a question and find contact. | Open public homepage → see verified content and bottom-right assistant → ask a general question or use contact; a missing AI configuration shows an honest unavailable state. No staff or pilgrim records are sent to the assistant. |
| Agency staff | Perform existing daily work and find travel locations. | Sign in using the real existing Supabase/activation flow → open workspace → navigate packages, jamaah, tracking, rooming, finance and map → use the staff assistant without gaining owner privileges. |
| Agency owner / main account | See people and AI limits for their agency. | Sign in → authorized `/admin` → see agency users, status, usage and limits → filter or inspect a permitted account. Another agency's records are inaccessible even with a guessed URL or user ID. |
| Existing returning user | Continue without losing identity or data. | Refresh or open a deep link → verify the existing session through the real auth service → load only authorized data → preserve logout and session expiry behavior. |
| Developer / owner | Run and configure the project. | Clone → install dependencies → start the local app with one dev command. The homepage loads without paid keys; integrations clearly show configuration needed. |

`/admin` is an agency-owner area. If a separate platform-wide super-admin is already present, preserve it only after its authority is verified; no cross-agency access is implied by the agency-owner decision.

## 4. Reference screenshots and design translation

These local attachments are visual references, not approved SafarOps data. Retain the existing original SafarOps logo, green/gold/ivory palette, photographic/illustrative hero and accessible identity. Do not copy the TeraUmroh name, logo, user names, prices, dates, testimonials or numbers as real content. If an implementer cannot access an image, request it or use the descriptions below without claiming visual inspection.

| Ref | Local reference file | Intended design guidance |
| --- | --- | --- |
| 1 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.25 PM.jpeg` | Desktop overview: deep-green sidebar, warm light background, greeting/next-departure panel, seat capacity card, KPIs, upcoming trips and status summaries. |
| 2 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.37 PM.jpeg` | Jamaah list: search, package/status filters, document chips, payment balances and scannable status. |
| 3 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.42 PM.jpeg` | Payment history dialog: total/paid/remaining summary, dated transactions and existing payment actions. |
| 4 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.26 PM.jpeg` | Package cards: departure details, dates, capacity, actual hotel information, and existing detail/edit actions. |
| 5 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.33 PM.jpeg` | Rooming layout: unassigned list and room cards with occupancy and existing supported actions. |
| 6 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.43 PM.jpeg` | Mobile: stacked overview cards, compact header and reachable bottom navigation. |
| 7 | `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.48 PM.jpeg` | Mobile: urgent-action list with text-labeled status chips and bottom navigation. |

Use consistent typography, spacing, shadows, button shapes and responsive behavior across the landing and staff pages. Status color must always have a readable text label. Every value must come from authorized existing data or be displayed as unavailable. Screenshot traffic-light deadlines and illustrative hotel names are **not** established SafarOps business rules. Reuse verified existing calculations; ask for the actual rules before introducing new status logic.

## 5. Functional requirements

### FR-01 — Split the application into HTML pages · P0

Refactor `index.html` into multiple understandable HTML pages plus shared CSS, JavaScript modules and reusable layout/interaction code. A suitable proposed structure is `index.html` for the public page, workspace pages for overview, packages, jamaah, tracking/finance, rooming, maps and settings, plus `admin/index.html` served at `/admin`. Final file names may fit the existing static build. The user specifically wants different HTML files; do not merely rename a single monolith.

Separate markup without duplicating or losing business logic. Audit current inline handlers, IDs, dynamically generated markup and code that assumes every DOM element is on the same page. Load shared modules in a predictable order, initialize only components present on the current page, preserve modal accessibility and prevent duplicate event handlers or repeated data writes. Keep public assets and existing links functional. Ensure browser back/forward, refresh, direct URLs, missing pages and expired sessions work.

Update `scripts/build.cjs`, `scripts/serve.cjs`, `vercel.json` and any dependency/lockfile as needed so the same actual routes and server functions work locally and on Vercel. Define `/admin` and workspace routes explicitly, including trailing slash/deep-link behavior. Keep the homepage public. On an unauthorized staff/admin page, show a safe login/denied state; protect data and actions at the server/database layer, not by hiding HTML or buttons.

### FR-02 — Dashboard and existing modules · P0

Adapt the screenshot layout while retaining SafarOps's identity. Overview presents existing verified next-departure information, capacity and operational metrics. Package, jamaah, document/payment, rooming, finance, settings and existing owner workflows remain accessible with their current data and actions. Reuse existing storage formats, IDs, relationships, payment calculations, report/export/print/QR behavior, tenant branding, activation and license workflows.

Use screenshot details only where a real field and approved business rule exist. For an absent hotel, departure deadline, outstanding balance, room assignment or status, show an honest empty/unavailable state. Do not invent a record, change a payment, trigger an import or seed production data to fill the design. Visual red/yellow/green chips must match approved existing rules; propose changes separately when rules are unknown.

### FR-03 — Google Maps, several locations · P0

Add **Lokasi & Peta / Locations & Map** to the authenticated workspace. Show several authorized, verified locations on one interactive map using the Google Maps JavaScript API; include an accessible accompanying location list, search/filter where supported by the actual location data, individual marker selection, readable location details and an **Open directions** link. List/map interactions, loading, no locations, missing configuration, quota/provider/network failure and keyboard navigation must work on desktop/mobile. Avoid full-screen overlays hiding navigation or the assistant.

Initial location data must be supplied by the agency or come from an existing, verified, authorized source. Do not invent hotel addresses/coordinates. Until locations are configured, show an empty state rather than a fake map result. The first version may use reviewed frontend configuration if one shared list is sufficient; persistent per-agency editing requires a deliberately designed authorized data model and SQL migration after schema discovery. Do not infer that displaying a pilgrim's private address or real-time location is authorized. Never auto-geolocate a visitor or claim live tracking. Google Maps receives map requests and visible map positions according to its service behavior.

The proposed multi-marker setup uses `GOOGLE_MAPS_BROWSER_KEY` and, for advanced markers, `GOOGLE_MAPS_MAP_ID`. These are browser-visible configuration values, not server secrets. Restrict the key to the required API and approved website origins. Google requires an enabled billing account for Maps JavaScript API use; review current pricing and usage with the account owner. A map can still show a truthful setup state when these values are absent.

### FR-04 — AI chatbot on homepage and dashboard · P0

Provide a clearly labeled floating assistant at the bottom right of both the public site and workspace. It must open/close with keyboard and touch, have a visible title and labeled input, show loading, response, retry/error, quota exceeded and unavailable states, and remain usable above mobile bottom navigation. Respect reduced motion, focus order and screen-reader announcements.

The public assistant answers general questions using only approved public content and the visitor's submitted message. It has no access to staff-only tables, account data, payments, passport/NIK data, private agency records or hidden tool actions. The staff assistant starts with the same conservative scope; do not automatically send private records or entire page contents to the AI provider. Any future access to agency data or tools requires separately scoped authorization, data minimization and auditability. Do not invent prices, bookings, visas, religious rulings or verified business claims; route uncertain questions to a human contact path where available.

Use a trusted server endpoint to call the chosen provider. Never call the provider using a secret embedded in HTML/JavaScript, local storage, a public config response, a log, or a repository file. OpenAI Responses API is a planning default, not a claim that an account/model/key is available. Do not add signup, paid integration, API spend or external messages merely by opening the page. Missing key, disabled AI, missing quotas, failed database accounting or provider failure must fail safely and retain the entered text for retry.

### FR-05 — Agency owner `/admin` and accounts · P0

Separate **agency owner** and **staff** capabilities using a trusted, existing or migration-backed role/membership mapping. An authenticated agency owner can view agency-scoped user information already authorized for this purpose: name/display name, email or verified identifier, role, account status, and AI usage/limit where available. Staff can see their own AI use/limit if exposed, but cannot list or edit others' accounts. No user can inspect another agency by changing a URL, ID, browser state, claimed role or request payload.

Keep the existing license/account activation and legitimate owner/staff sessions functional while phasing out any client-only role heuristic or locally fabricated identity as an authorization source. Do not create or reset an account or place passwords in code. Bootstrap or identify the real owner via a documented secure account process after the correct account and current permissions are verified. A platform super-admin is separate and only included if supported by the verified existing model and explicitly scoped.

Authorization is enforced on **every** new privileged server operation and by suitable database grants/RLS; protected API queries use the real caller's verified Supabase identity. A browser route, `localStorage`, email text or a hidden navigation button is never sufficient proof of role. Where a server-only privileged Supabase key is required for quota accounting, isolate that use; it bypasses RLS and must never turn arbitrary owner input into a cross-agency read/write.

### FR-06 — AI usage, limits and accounting · P0

Show owners a usage overview for their own agency and a per-member breakdown: current-period request count, input/output/total tokens when returned by the provider, the applicable limit, remaining requests and reset time. Distinguish agency aggregate, member usage and the unrelated public visitor pool. Where usage data has not been measured, show unavailable; never display invented cost or imply a confirmed bill. Monetary estimates are optional and require owner-supplied, dated pricing; the provider bill remains authoritative.

The reference design uses owner-configured request limits: an agency monthly limit, a per-user monthly limit and a separate public daily global limit. Reset boundaries use `Asia/Jakarta` unless the product owner specifies another per-agency policy. Defaults in example configuration are disabled/blank rather than invented paid allowances. Per-user overrides are optional and must remain tenant-scoped; no UI for changing a budget is required until its policy is approved.

Enforce limits on the server **before** a provider call using a durable, atomic reservation or equivalent transaction across concurrent requests and serverless instances. Include per-identity request rate limiting, a trusted source for any visitor-network identifier, an overall anonymous budget, input-length and output-token bounds, and idempotency keys. Do not trust client-provided `userId`, agency, usage count, timestamps, IP headers or quota. Treat different API invocations of the same user/session correctly; if there is no reliable shared quota/rate-limit store, fail closed instead of advertising a limit that can be bypassed.

Reconcile success, provider errors, partial streams, timeouts, retries and user cancellation without double-counting. Provider timeouts can leave billing uncertain: mark them unknown and reconcile when possible; do not claim a request was free. Count token usage only when measured. Define retention of minimal audit counters/events, pseudonymize visitor rate-limit identifiers and avoid storing message bodies or credentials by default. Request/token quotas help bound consumption but are not a guaranteed currency spend cap; the owner should configure provider billing limits separately.

### FR-07 — Indonesian / English · P0

Add a visible **IDN / ENG** control at the top right of the homepage, staff workspace and `/admin` (place it accessibly in mobile navigation where space is limited). Translate navigation, labels, dialogs, validation, empty/loading/error states, map controls and assistant UI. Language selection is independent of user role, remains stable during navigation/refresh, defaults to Indonesian, and updates document `lang` and locale-sensitive display formatting where appropriate. Persist only the preference; do not rewrite stored names, free-text records, currency, dates or other original values merely to translate the interface. Machine-translated historical data is not required.

### FR-08 — SQL migration files and Supabase discovery · P0

Before proposing a concrete migration, inspect the actual project, current table definitions, `auth.users` references, indexes, grants, RLS/policies, functions/triggers, storage, active accounts and migration history with read-only tools. The currently connected account returned a permission error for the app's project; no real schema has been verified in this PRD. Do not query or display unnecessary personal records.

For every necessary schema addition, column or index change, policy/function update and planned data backfill/update/delete, create reviewable, ordered `.sql` files using the current Supabase migration workflow. Document assumptions, transactional/concurrency behavior, before/after queries, privileges, dependencies, data preservation, expected affected rows, rollback/recovery and whether an operation is destructive. Generate migration names with the Supabase CLI rather than guessing. Use additive/expand-and-contract changes where possible and verify on a disposable local or explicitly designated test project. Produce a no-op or clearly blocked migration plan if schema access is missing; never present speculative destructive SQL as safe to run.

No production migration, account change, reset, import, secret rotation or deployment is authorized by this planning request. Applying a future destructive SQL change requires an explicit, separate decision and a verified recovery plan. Do not weaken RLS, grant broad anonymous access, hardcode credentials, create fake sessions, or bulk-rewrite legacy values.

### FR-09 — README, local run and safe setup · P0

Rewrite `README.md` into a short, accurate setup guide. Remove the obsolete `tes github push` line and redundant old material. It must include prerequisites, the actual repository clone URL, `cd`, `npm install`/`npm ci` as appropriate to the committed lockfile, the single local start command, localhost URL, simple checks and how to stop. Give Windows PowerShell-compatible instructions and a POSIX equivalent when syntax differs. Do not claim commands work until tested on a clean clone without relying on globally installed tools or hidden files.

Include a complete `.env.example` with placeholder values and the variable inventory below, required/optional conditions, official provider links, development/production examples, setup of a browser-restricted Google Maps key, and clear steps for assigning real values directly in local `.env` and Vercel's environment settings. Fix the current `.gitignore` pattern so a non-secret `.env.example` can be tracked while all real `.env*` files remain ignored. Do not create cloud resources, enable billing or incur fees during setup without the owner's decision.

With no paid-service keys, `npm run dev` should still start the homepage and show honest map/chat configuration states. Existing staff access requires the actual Supabase configuration; no fake login is allowed. If new API functions cannot run using the current static server, implement a single reliable local start path that serves both the frontend and the same handler contracts. Verify Vercel's function discovery with the existing static output configuration; update build/deploy setup as necessary rather than assuming `dist/` automatically exposes API routes.

## 6. Proposed environment-variable inventory

These are **proposed names for the future implementation**, not variables that already exist in the current app. Names must be implemented exactly as documented or changed consistently in `.env.example`, server configuration and README. The owner's real values are never included in these files. OpenAI is the proposed provider; selecting a different provider changes the AI-specific rows and requires an updated complete inventory.

| Variable | Required when | Visibility / what it is | Where to obtain or set it |
| --- | --- | --- | --- |
| `APP_BASE_URL` | Production and local server | Public configuration: the trusted app origin, e.g. `http://localhost:4173` locally; configure separately for preview/production. | Set to the actual site URL. [Vercel environment variables](https://vercel.com/docs/environment-variables). |
| `PORT` | Optional locally | Non-secret local server port; Vercel supplies its own runtime port. | Choose a free local port; default may remain `4173`. |
| `SUPABASE_URL` | Staff auth/data and AI usage storage | Public project URL; safe to expose only through the deliberate public-config allowlist. | [Supabase project dashboard](https://supabase.com/dashboard/projects) → project connection/API settings; [API key guide](https://supabase.com/docs/guides/api/api-keys). |
| `SUPABASE_PUBLISHABLE_KEY` | Staff auth/data | Browser-visible project publishable key. Its visibility does not replace RLS and grants. | Same Supabase project's **Settings → API Keys** or Connect dialog. [Key guide](https://supabase.com/docs/guides/api/api-keys). |
| `SUPABASE_SECRET_KEY` | Proposed trusted server-side quota ledger / narrowly scoped administration, if verified needed | **Server secret.** This privileged key bypasses RLS. Never return it to browsers or use it as a substitute for verifying a user's role/agency. A safer nonprivileged design may eliminate this key only after review. | Same project's **Settings → API Keys**. Configure directly in the server environment; never paste it into chat or source. [Supabase API keys](https://supabase.com/docs/guides/api/api-keys). |
| `GOOGLE_MAPS_BROWSER_KEY` | Interactive multi-marker map | Browser-visible Google Maps Platform key, restricted by website referrer and to required APIs. Use separate local/production keys where appropriate. | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials) → enable Maps JavaScript API, configure billing and create/restrict key. [Setup](https://developers.google.com/maps/documentation/javascript/get-api-key). |
| `GOOGLE_MAPS_MAP_ID` | Production advanced markers in the proposed map | Public map identifier, not a password. Google provides `DEMO_MAP_ID` for local testing only. | [Create a map ID](https://developers.google.com/maps/documentation/javascript/advanced-markers/start) in Google Maps Platform. |
| `OPENAI_API_KEY` | OpenAI chat enabled | **Server secret**, used only by the trusted chat endpoint. | [Create/manage OpenAI API keys](https://platform.openai.com/api-keys). [Authentication guidance](https://developers.openai.com/api/reference/overview). |
| `OPENAI_MODEL` | OpenAI chat enabled | Server configuration containing a model available to the owner's account; e.g. `gpt-6-luna` is an illustrative current model ID, not a guaranteed account entitlement or required choice. | [OpenAI model list](https://developers.openai.com/api/docs/models). Confirm availability and current pricing before enabling. |
| `AI_PUBLIC_ENABLED` | Optional feature switch | Server flag; default `false` until public safeguards and quota are configured. | Set `true` or `false` in local/server environment. |
| `AI_STAFF_ENABLED` | Optional feature switch | Server flag; default `false` until staff authentication and limits are configured. | Set `true` or `false` in local/server environment. |
| `AI_PUBLIC_DAILY_REQUEST_LIMIT` | Public chat enabled | Positive integer for the global anonymous request budget per Jakarta calendar day. Blank/invalid means unavailable. | Choose an amount suitable for the owner's budget; this is an app setting, not a provider-issued key. |
| `AI_USER_MONTHLY_REQUEST_LIMIT` | Staff chat enabled | Positive integer default per staff member per Jakarta calendar month; per-user overrides require approved storage/policies. | Owner chooses; app setting. |
| `AI_AGENCY_MONTHLY_REQUEST_LIMIT` | Staff chat enabled | Positive integer total per agency per Jakarta calendar month. | Owner chooses; app setting. |
| `AI_REQUESTS_PER_MINUTE` | Either chatbot enabled | Positive integer request-rate ceiling per verified user or trusted, pseudonymized public identity. | Owner chooses; app setting. Enforce through shared durable storage. |
| `AI_MAX_OUTPUT_TOKENS` | Either chatbot enabled | Positive integer maximum response length passed to the provider after checking the chosen model's supported parameters. | Owner chooses; app setting. Check the [Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create). |
| `AI_RATE_LIMIT_HASH_SECRET` | Public chat with pseudonymized network identifiers enabled | **Server secret** used to HMAC/hash a trusted rate-limit identifier; not an API key and not sent to Google/OpenAI or a browser. Generate a strong random value and keep it stable across instances. | Owner generates a random value locally or via a secret manager; see [Node.js crypto randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback). |

Do not add a separate `SUPABASE_SERVICE_ROLE_KEY` if the project supports `SUPABASE_SECRET_KEY`; a legacy equivalent is conditional on the actual project and must never be exposed client-side. No Google geocoding/Places key, storage key, email key, analytics key, payment credential, Vercel token or JWT signing secret is required by this baseline. Add and document extra variables only when the owner approves the corresponding feature. Vercel-managed values such as `VERCEL_URL` and `NODE_ENV` are runtime-provided when available, not secrets the user should paste.

**Conceptual `.env.example`** — all blanks are placeholders; do not copy actual credentials here:

```dotenv
APP_BASE_URL=http://localhost:4173
PORT=4173
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_MAP_ID=
OPENAI_API_KEY=
OPENAI_MODEL=
AI_PUBLIC_ENABLED=false
AI_STAFF_ENABLED=false
AI_PUBLIC_DAILY_REQUEST_LIMIT=
AI_USER_MONTHLY_REQUEST_LIMIT=
AI_AGENCY_MONTHLY_REQUEST_LIMIT=
AI_REQUESTS_PER_MINUTE=
AI_MAX_OUTPUT_TOKENS=
AI_RATE_LIMIT_HASH_SECRET=
```

An existing checked-in `public-config.js` is browser-visible and must never contain a secret. A new runtime config endpoint or equivalent may expose **only** the Supabase URL/publishable key and the restricted Google browser key/map ID; it must not serialize the entire environment.

## 7. Data and integration boundaries

| Boundary | Contract |
| --- | --- |
| Browser → public page | Public marketing content and public chat UI. No protected operational queries on the landing page. |
| Browser → Google Maps | Browser-restricted Maps key and map ID; location details/viewport are shared with Google as necessary to render the map. Use only authorized locations. |
| Browser → chat server | Validated message, request ID and minimal context; staff session token verified on server. Never send API secrets from the browser. |
| Server → provider | Server-held `OPENAI_API_KEY`; only the permitted current message/approved public context, bounded input/output, no implicit CRM context. |
| Server → quota ledger | Atomic check/reservation, scoped caller, durable minimal usage information, no plaintext IP or message transcript by default. A privileged Supabase key is isolated to approved operations. |
| Staff/admin → Supabase | Verified identity, agency membership and role on each operation; RLS and grants enforce access. No client-asserted ownership and no service key in a client. |
| SQL and original records | Discover actual schema first; reviewed migration and rollback for every change. No fake data, automatic resets or destructive production changes. |

The current backend/policies have not been inspected. The implementation must verify all boundaries and report limitations rather than asserting that hiding a page or passing a UI test proves server security.

## 8. Acceptance and verification

| ID | Scenario | Observable passing result |
| --- | --- | --- |
| AC-01 | Public root and navigation | Existing homepage, visual identity, consultation and hero remain usable; no operational record is fetched anonymously. |
| AC-02 | HTML split and routing | Several HTML files exist; direct load, refresh, back/forward, `/admin`, deep links, local server and production build all resolve correctly. |
| AC-03 | Existing staff login | Existing valid auth, activation, license and logout workflows work with designated test accounts; expired/invalid sessions cannot load protected data. |
| AC-04 | Agency owner vs staff | Owner can view their own agency users/usage; staff lacks owner functions; guessed IDs and cross-agency requests are denied server-side and by RLS. |
| AC-05 | Existing modules | Package, jamaah, documents, payments, rooming, reports, print/QR, exports and branding retain values and actions; no sample data or destructive writes are introduced. |
| AC-06 | Dashboard data | Screenshot-inspired cards show correct results from approved real fields/calculations; missing information is not fabricated. |
| AC-07 | Multi-location map | Several authorized configured locations render as correct markers and list items; selection/details and directions work. |
| AC-08 | Map failure / accessibility | Missing key, no locations, blocked provider or offline state is clear; location list remains usable by keyboard and on mobile. |
| AC-09 | Public chatbot | Bottom-right launcher works without a staff account; only user-entered message and approved public context reach the server/provider. |
| AC-10 | Staff chatbot | Authenticated user can open/use it within permitted scope; no implicit private-record forwarding, CRUD, fake response or leaked secret. |
| AC-11 | AI unavailable | Missing key, disabled flag, unavailable quota storage, provider error or exhausted limit blocks the paid provider call and shows a truthful message while retaining text. |
| AC-12 | Quota concurrency / retries | Parallel requests and idempotent retries cannot exceed configured per-user, agency and public budgets; failures/cancellation/reconciliation are counted as specified. |
| AC-13 | Owner usage information | Real measured request/token usage and limits appear for owner-authorized members; unknown/cost figures are clearly labeled and cross-tenant access fails. |
| AC-14 | Languages | IDN/ENG switches all changed surfaces and states; choice persists across navigation/refresh, screen-reader language changes, and stored values stay intact. |
| AC-15 | SQL deliverables | Every required addition/change/backfill/removal has an ordered reviewed `.sql` migration and verification/recovery notes based on the actual schema. Missing project access is reported as a block. |
| AC-16 | Setup from clean clone | Documented commands install/run on supported Windows and POSIX systems; no undocumented global install or secret is needed for the public landing; integrations fail safely until configured. |
| AC-17 | Environment and secret scan | `.env.example` contains every implemented variable without secrets; ignored real `.env` files and all frontend/config/log responses contain no server-only keys. |
| AC-18 | Responsive / a11y | Check 360, 390, 768, 1024 and 1440px plus keyboard, focus, contrast, text zoom, reduced motion, mobile bottom nav and chatbot/map overlays. |
| AC-19 | Preservation / deployment | Diff and test evidence confirm no unintended writes, account/role regressions or production SQL. Build contains every new route and function, and production changes only after separate authorization. |
| AC-20 | Release evidence | Report local preview, changed files, screenshots, tested vs mocked service boundaries, migrations, complete `.env` inventory and remaining account/access decisions. |

Use meaningful tests: unit tests for validation/accounting, integration tests for atomic quota races and RLS with disposable fixtures, and browser checks for journeys/keyboard/responsive layouts. Mock external AI/maps for deterministic tests, then verify configured services separately with designated nonproduction credentials and minimal cost. Never test production CRUD with real pilgrim records.

## 9. Delivery sequence and open dependencies

1. **Discover:** Re-read this PRD and companion prompt, screenshots, existing source, live access availability and current worktree. Produce a short verified integration and security map.
2. **Design:** Map each existing module to a new HTML page/shared component; design the SafarOps-aligned desktop/mobile workspace, map, chat, owner panel and IDN/ENG controls.
3. **Prepare safe data contracts:** With correct Supabase access, inspect schema and policy; create reviewed SQL and local/disposable test fixtures. Without it, document the exact block and continue non-database work.
4. **Implement locally:** Split pages, preserve workflows, integrate the authorized map and assistant, implement role and quota enforcement at trusted boundaries, translate, and update README/`.env.example`/build routes.
5. **Verify:** Run the AC matrix including real boundaries only in authorized nonproduction contexts; record results and limitations.
6. **Handoff:** Provide files, local commands, configuration instructions, migration scripts and evidence. Do not commit, push, apply production SQL or publish until separately requested for this new work.

Open inputs: the actual list of map locations; correct Supabase project access and verified agency/member model; owner account identification; chosen AI provider/model and funded account; quota values and data-retention policy; Maps Cloud project/key/map ID; and an approved nonproduction test environment. Paid integrations remain disabled until configured by the owner. These open inputs do not block creation of the UI, PRD, prompt or safe local scaffolding.

## 10. Official references

- Google multi-marker API and map ID: https://developers.google.com/maps/documentation/javascript/advanced-markers/start
- Google Maps JavaScript billing: https://developers.google.com/maps/documentation/javascript/usage-and-billing
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Supabase grants and RLS: https://supabase.com/docs/guides/api/securing-your-api
- Supabase migration workflow: https://supabase.com/docs/guides/deployment/database-migrations
- OpenAI quickstart and Responses API: https://developers.openai.com/api/docs/quickstart
- OpenAI API key security: https://developers.openai.com/api/reference/overview
- OpenAI model availability and pricing: https://developers.openai.com/api/docs/models
- Vercel Functions: https://vercel.com/docs/functions
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel static build output: https://vercel.com/docs/builds/configure-a-build

**Definition of done:** The requested pages, map, assistant, agency-owner view, language switcher, SQL artifacts and setup guide work locally with evidence; real service integrations and privileged paths are verified only where authorized; existing data and workflows remain intact; and any unavailable access or configuration is reported accurately.
