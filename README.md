# SafarOps — Smart Umrah Agent Workspace

## Run locally

Requires Node.js 18 or newer. Run `npm run dev` and open http://127.0.0.1:4173. If that port is occupied, run `npm run dev -- 4175` and open http://127.0.0.1:4175. The application keeps its existing CDN dependencies, so internet access is required for the staff workspace libraries.

Run `npm run check` for source/asset checks, `npm test` for input validation checks, and `npm run build` to create the static production files in `dist/`. Vercel reads the tracked `vercel.json` and runs that build.

Public branding and the consultation WhatsApp destination are in `public-config.js`. The destination is intentionally blank until verified business contact details are supplied. Public packages use an information fallback; private workspace records are never used as public content. Authentication continues through the existing Supabase integration.

The production package includes the requested JEJAKIMANI homepage still and SafarOps icon assets. It excludes developer notes, tests, and the Supabase secret key. See `docs/LOCAL-VERIFICATION.md` for checks and known limits, and `assets/SOURCE-MANIFEST.md` for asset provenance.

SafarOps is a web-based operations workspace and executive CRM for Indonesian Umrah travel agencies. It brings agency setup, departure planning, pilgrim management, document tracking, payment administration, and printable travel documents into one interface.

The application is presented in Indonesian and is designed around the day-to-day workflow of an Umrah travel operator, from activating an agency account through preparing pilgrims for departure.

## What the application does

- **Authentication and licensing** — sign-in, account activation, license whitelist checks, and role-aware access for travel-agency users and super administrators.
- **Agency onboarding and branding** — configure the agency’s legal identity, PPIU/license information, director, contact details, bank information, logo, and travel banner.
- **Executive dashboard** — view operational KPIs such as total pilgrims, revenue, collected payments, outstanding balances, conversion rate, payment trends, and CRM-pipeline distribution.
- **Umrah package management** — create departure batches with dates, airline, duration, quota, price, status, and visual theme.
- **Pilgrim CRM** — manage leads and registered pilgrims through stages including Leads Baru, Follow Up, DP Masuk, Cicilan, Lunas, and Siap Berangkat.
- **Manifest and readiness tracking** — maintain pilgrim identity, passport, contact, employment, rooming, mahram, and document-completion information.
- **Payment ledger** — record deposits, installments, and settlements; calculate balances; and update the pilgrim’s payment stage.
- **Official documents** — print or save payment receipts, transaction histories, recommendation/leave documents, and pilgrim ID cards as PDF-ready documents.
- **QR validation** — generate QR codes for document and ID-card validation workflows.
- **Reporting** — export a manifest and financial summary to Excel.
- **Data persistence** — use Supabase for cloud synchronization when configured, with browser local storage available as a fallback for local/demo usage.
- **Super-admin controls** — manage buyer/license email access and account status.

## Typical workflow

1. Sign in or activate an agency license.
2. Complete the agency setup wizard and apply branding assets.
3. Create Umrah departure packages and define quotas and pricing.
4. Add pilgrims and manage them through the CRM pipeline.
5. Track required documents, room assignments, and mahram groups.
6. Record payments and monitor outstanding balances.
7. Generate receipts, reports, ID cards, and other departure-ready documents.

## Technology

- HTML, CSS, and vanilla JavaScript
- Tailwind CSS via CDN
- Plus Jakarta Sans and Amiri fonts
- Lucide icons
- Chart.js for dashboard analytics
- SheetJS for Excel exports
- QRCode.js for QR generation
- Supabase JavaScript client for optional cloud authentication and data synchronization

## Local development

Node.js 18 or newer is sufficient; this static application has no npm dependencies to install. The existing workspace still uses its original CDN libraries and auth logic. SafarOps2 points to the separate Supabase project described in `docs/LOCAL-VERIFICATION.md`.

```powershell
Set-Location -LiteralPath 'C:/Users/michu/Documents/PROGRAM/PROJECT-AXIS-YASIR/SafarOps2'
npm run dev
```

Open `http://localhost:4173/`. Stop the owned preview with Ctrl+C. Set `PORT` in the current shell before starting if that port is occupied.

Use `npm test` for validation/preservation tests, `npm run check` for source/assets, and `npm run build` for static output in `dist/`. For a running local preview, `node scripts/verify-local.cjs` checks referenced assets over HTTP. None of these commands pushes or deploys the site.

Edit `public-config.js` to replace the SafarOps brand/contact placeholders with verified public details. The empty WhatsApp number intentionally disables draft preparation. Public package information uses the PRD fallback; private operational records are not marketing content.

See `docs/LOCAL-VERIFICATION.md` for check results and limitations, and `assets/SOURCE-MANIFEST.md` for the hero photo and icon sources.

## Intended audience

SafarOps is intended for Umrah travel agencies, operators, administrators, and customer-service teams that need a centralized workspace for sales follow-up, pilgrim readiness, package operations, and payment administration.

## Deployment notes

The app is a client-rendered single-page application and can be served as a static web deployment. For production use, configure the Supabase project, authentication policies, database tables, and access controls appropriate to the agency’s data. Do not expose privileged credentials in client-side code.
