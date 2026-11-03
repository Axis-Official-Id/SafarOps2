# Copy-ready implementation prompt: SafarOps admin, maps, AI and languages

Work in the existing `SafarOps---Axis-Digital` repository. Implement the changes below locally, following the detailed requirements and AC-01–AC-20 in `SafarOps-Admin-Maps-AI-PRD.md` in this repository. Read that PRD, the applicable repository instructions, the existing code and current working-tree changes before designing or editing. Treat the existing code and the current Supabase schema as facts to verify, not as assumptions from this prompt. Preserve work that is already in progress, and do not reset, overwrite or discard unrelated changes.

The product is SafarOps, an Umroh agency website and staff workspace. Preserve its brand, existing public homepage and working operations. The user wants a practical, maintainable improvement, with real behavior behind the controls and honest configuration states when a service is unavailable. Run everything locally first. Do not commit, push, deploy, modify production data/accounts, or apply production SQL as part of this request; report what would be needed to do those later.

## Confirmed decisions

1. Add the floating AI assistant to **both the public homepage and the authenticated staff dashboard**.
2. Put **several locations on one Google Map** in the authenticated workspace/admin area.
3. An agency owner can see users and AI usage for **their own agency only**; ordinary staff do not get owner access.
4. Use the seven attached screenshots as dashboard design references while matching the visual identity, colors and polish of the SafarOps homepage. Do not copy the reference product's brand or treat the example records as real data.
5. Split the large index into **multiple meaningful HTML files**, add the **IDN / ENG** language control, give the project a simple local installation README, and create SQL migration artifacts for changes supported by the verified database schema.

## Discover and plan around the actual application

- Check `git status`, existing scripts, routes, authentication, configuration, packages, dependencies and relevant instructions. Map the existing landing, login/activation, workspace modules, payment and rooming flows, reports/exports/print, branding and any existing platform-admin functionality before refactoring. Record enough baseline behavior to detect regressions.
- Read the seven reference images and the design translation table in the PRD. The images are at:
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.25 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.37 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.14.42 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.26 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.33 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.43 PM.jpeg`
  - `C:/Users/michu/Pictures/AXIS/WhatsApp Image 2026-11-02 at 3.15.48 PM.jpeg`
- Inspect the actual Supabase project, existing tables, migration history, grants, row-level security, policies, functions and verified user/agency membership model with read-only access before preparing concrete migrations. Avoid querying or displaying unnecessary personal data. The prior project lookup returned a permission error, so do not assume this access will work or claim that the schema has already been audited. If it remains unavailable, document the exact block, create only clearly labeled non-runnable design notes where needed, and continue independent UI and local work. Do not invent production table structures or destructive SQL.
- Use the current stack and package manager unless there is a specific, documented need to change them. Do not introduce a framework merely to split pages.

## Pages, visual design and existing behavior

Refactor the current monolithic `index.html` into multiple real HTML pages with shared styling, components and JavaScript. Keep a public `index.html`; provide understandable separate pages for the existing staff areas such as overview, packages, jamaah/tracking, rooming, finance and settings, plus a map and an agency-owner `/admin` route. Choose final filenames to fit the actual routing, but do not merely create several URLs that all serve the original monolith.

Match the screenshot's well-organized sidebar, overview cards, departure details, jamaah/payment table, payment-history dialog, package and rooming cards, urgent-status cues, and mobile bottom navigation where supported by existing functionality. Use SafarOps' existing green/gold/ivory palette, logo, typography and homepage character so the site feels cohesive. Show labels as well as colors for status. Layout must work on desktop, tablet and mobile with keyboard navigation and reasonable text zoom.

Preserve existing valid accounts, activation/license behavior, session restoration, logout, data formats, calculations and workflows. Audit IDs, inline handlers, component initialization and shared state so page splitting does not cause errors, duplicated handlers, missing functionality or unintended writes. Maintain back/forward navigation, refresh, direct links and expired-session handling. Do not fabricate operational data, prices, deadlines, status rules, hotels, testimonials or business claims. If data or an approved calculation is missing, show a truthful empty/unavailable state. Maintain an existing platform-wide super-admin only if the actual authority is verified; it is separate from an agency owner.

Update the existing local server, build allowlist, Vercel configuration and function routing as necessary. Verify the actual generated build contains the new pages, assets and routes, and that `/admin` and deep links behave consistently locally and in the production build. Static HTML visibility or a hidden button is never a security boundary.

## Google Maps: several locations on one map

Add **Lokasi & Peta / Locations & Map** to the authenticated staff workspace and make it accessible to the appropriate agency owner. Show multiple authorized, verified locations together as markers and in an accompanying accessible list. A selected list item/marker should reveal its permitted details and provide an appropriate Google Maps directions link. Support reasonable filtering, keyboard operation and mobile display as described in the PRD.

Use agency-provided location data or an existing verified authorized source; never invent addresses or coordinates. Do not collect a visitor's or pilgrim's live location or publish private addresses. If there are no approved locations, no Maps key, a provider/network failure or a quota error, show a clear empty/configuration/error state; the rest of the site must continue to work. If persistent per-agency location editing is necessary, design it only after schema and authorization discovery.

Use Google Maps JavaScript API with a browser-visible key restricted to allowed referrers and necessary APIs. If using advanced markers, configure a map ID and use Google's testing ID only for development. Document Google Cloud project, billing, API activation, key restrictions and map ID setup with official links. Do not enable billing or provision a paid cloud resource on the user's behalf.

## AI assistant, server security and usage

Add an accessible bottom-right assistant on both requested surfaces. It must open/close by touch and keyboard, remain usable above mobile navigation, and show loading, response, error, retry, exhausted-limit and unavailable states while preserving unsent text. Public visitors can ask general questions using approved public content only. The staff version starts with the same conservative scope: do not automatically send CRM, passport, payment or other private information to a model or allow hidden data-changing tools. Do not invent visa, booking, price, religious or other business facts; suggest an existing human contact path when appropriate.

Implement the provider call on a trusted server endpoint, not directly from the browser. Use the OpenAI Responses API as the **proposed configurable default** unless the owner selects another provider; allow an owner-selected available model. Never expose a secret key in source, frontend code, public configuration, browser storage, output or logs. A public or restricted browser key is not a server secret. Opening a page must not trigger a paid model request. When credentials, limits or the quota store are absent, disable the paid operation safely and explain the setup state.

Protect both assistants from unbounded usage. Before any provider call, enforce durable, shared, atomic request reservations and rate limits across concurrent requests and serverless instances. Support a separate global daily pool for anonymous visitors and agency-wide plus per-user monthly limits for authenticated staff. Obtain identity and agency membership from verified server-side authentication; never trust a browser-provided role, agency, user ID, usage count, timestamp or arbitrary IP header. Use a trusted visitor identity source where available, bounded message and response sizes, and idempotency. If a reliable shared accounting boundary is unavailable, fail closed instead of presenting unenforced quotas. Example flags and limits should default to disabled or blank; never choose paid allowances for the owner.

Reconcile retries, failures, partial results, cancellations and timeouts without double counting. Where provider billing is uncertain, mark it unknown; record token usage only if supplied, and do not present a request limit as a guaranteed monetary spend cap. Keep only minimal usage/audit data; do not persist prompt contents or plaintext network identifiers by default. See the PRD for reset boundaries, limits and retention considerations.

## Secure agency-owner `/admin`

Provide an agency-owner page showing authorized people in that agency, their relevant account details/status and actual AI request usage, measured tokens, limits, remaining allowance and reset period when available. The owner must not see another agency. Staff can see their own usage where provided but cannot list/manage other users. Missing data must be labeled accurately; never invent costs or usage.

Use the actual verified Supabase Auth identity and a verified or migration-backed membership/role model for each privileged request, with appropriate database grants and RLS. Test both cross-agency and role-based denials. A local-storage flag, a client-side email substring, a URL, or a hidden navigation item cannot authorize access. Preserve legitimate existing sessions while removing reliance on insecure role heuristics for new privileged operations. Avoid creating or resetting real accounts, changing supplied credentials, or weakening existing protections. Isolate any genuinely necessary server-only Supabase secret to narrowly scoped trusted operations; it bypasses RLS and must never be exposed to the browser.

## IDN / ENG

Add a visible **IDN / ENG** option at the top right of the homepage, workspace and `/admin`, with an accessible equivalent in compact mobile layouts. Translate the UI, navigation, labels, dialogs, validation messages, map/chat controls, and empty/loading/error states. Default to Indonesian, preserve the preference during page navigation and reload, and update the document language and appropriate display formatting. Do not translate or rewrite persisted names, historical records or other user-entered data.

## Supabase SQL and safe testing

Once the actual schema and permissions are known, produce ordered, reviewable SQL migration files for every necessary addition, alteration, policy/function change, backfill/update or removal. Use the supported Supabase migration workflow and generated migration filenames. Include assumptions, dependencies, transaction/concurrency considerations, verification queries, expected effects, rollback/recovery steps and a clear warning for any destructive operation. Prefer additive changes that preserve existing records and accounts. If nothing requires a migration, document that; if access is unavailable, document the missing access and schema questions rather than creating runnable speculative SQL.

Test migrations and RLS with disposable local fixtures or an explicitly designated test project. Do not apply changes to production, bulk-delete or rewrite records, seed real customer data, rotate secrets or modify users. Continue work that does not depend on the unavailable project and make the remaining block explicit in the handoff.

## README, environment and local development

Replace the existing GitHub README with a concise, accurate guide for prerequisites, the actual `git clone` URL, `cd`, dependency installation, a single local start command, localhost URL, useful checks and how to stop the server. Give Windows PowerShell-compatible instructions; include POSIX alternatives when they differ. Test the instructions from a clean setup where possible. The public homepage should start without paid-service credentials, and missing integrations should show honest setup states. Existing staff login must use real configured authentication, not a fabricated account.

Add a checked-in, non-secret `.env.example` and update `.gitignore` so real `.env` files stay ignored while the example is trackable. Document **every environment variable that the final implementation actually uses**, its purpose, whether required, public or server-only, example placeholder, and the official link or local action for obtaining it. Start from the proposed inventory in PRD section 6, adjusting names everywhere if the implementation differs:

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

These names are a proposed contract, not evidence that the current app already uses them. Some are conditional or may be removed if the final architecture does not need them. Explain that browser-visible Maps/Supabase publishable values need appropriate restrictions and database protection, whereas OpenAI, Supabase privileged keys and rate-limit secrets stay server-only. Include links to the Supabase dashboard/key guide, Google Maps credentials/map ID setup, OpenAI API keys/model list, and Vercel environment settings. Do not put real secrets or passwords in examples, Git, browser bundles or chat. Verify that a single local command serves both the pages and server endpoints, and verify Vercel function discovery rather than assuming the existing static `dist/` build supplies an API.

## Verify and hand off

Work through the PRD's acceptance criteria AC-01–AC-20. Run appropriate existing checks and meaningful tests, including direct routes and refresh, existing workflows, IDN/ENG persistence, map empty/failure states and markers, chat disabled/error states, authorization and cross-agency denial, concurrent quota/rate-limit enforcement, and responsive/keyboard behavior. Mock external services for repeatable tests; separately label any real nonproduction service tests and their limitations. Never use real pilgrim records or production CRUD to prove a feature. Check the built artifact and scan public outputs for server secrets. Verify on representative mobile and desktop sizes and capture screenshots if the tooling is available.

Finish with a concise report of files changed, actual local start command and URL, what was tested versus mocked, screenshots, exact implemented environment variables with official links, reviewed SQL migration paths and any unavailable schema/access/configuration. Identify unresolved business decisions or external dependencies honestly. Do not claim an inaccessible integration, security boundary or deployment was verified. Leave unrelated work and production untouched.
