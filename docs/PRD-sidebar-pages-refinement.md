# SafarOps sidebar, navigation, and page refinement

Date: 4 November 2026 · Status: UI implementation delivered; browser verification pending

## Implementation record

The sidebar now uses a measured minimum width, collapses to a 64px icon rail, keeps the admin action at the bottom, and reopens through the logo. The restored Kaaba/compass SVG comes from the sibling workspace identified below. Search lives below sidebar branding; Arabic and Indonesian reflection text form one source link. The chart has a styled keyboard-operated period popup; other selects share the new visual style. Phone navigation retains its existing menu.

Seven source views live in `pages/`, with CSS in `styles/pages/`. Inline CSS, theme configuration, and the application controller have been extracted from `index.html`. The build emits eight reloadable documents, with allowlisted navigation and Back/Forward handling. Shared views remain mounted in each document because the existing controller and dialogs depend on their DOM; this preserves in-progress form values. This is a deliberate compatibility implementation, not isolated page bundles. Page-controller isolation and replacing the existing CDN dependency delivery remain follow-up engineering work from the proposal below.

Verification: 40 Node tests pass, source checks pass, production build passes, and local HTTP checks pass for all eight pages, required assets, and private-source 404 responses. Tests cover direct-route restoration, Back to the root, and admin-route denial. These are local/unit results, not a new live Supabase authorization audit. Browser tools failed to initialize (`failed to write kernel assets`), so screenshots, drag/keyboard interaction, phone layout, and zoom checks remain unverified.

The sections below retain the original proposal and acceptance criteria for comparison with this implementation record.

## 1. Goal and boundaries

Refine the existing SafarOps workspace without redesigning the whole application. Keep its emerald/gold/ivory identity, Indonesian copy, cards, charts, forms, records, and account flows. Deliver a predictable desktop sidebar, an icon rail when collapsed, attractive dropdowns, the original Kaaba/compass mark, linked Arabic reflections, and separately maintained pages and CSS.

Actors: signed-in travel users and Super Admins. Super Admin access continues to come from the existing trusted account role. Anonymous visitors still enter through login/activation.

This document is the deliverable for this planning step. It specifies the implementation, dependencies, references, verification, and rollout. It does not claim that the UI is already changed or deployed.

Do not replace the app with React/Next.js, change Supabase tables or permissions, change passwords or session semantics, invent data, add analytics, or replace business workflows as part of this visual work.

## 2. Source evidence and asset provenance

Inspected current working files and the sibling workspace, not Git history.

| Evidence | Current behavior / implication |
| --- | --- |
| `index.html` | One large document; inline application controller and styles; seven workspace tab panels; shared dialogs and print UI. |
| `index.html`, `App.switchTab()` | Switches hidden panels, updates title/subtitle, then renders the workspace. This must become page-aware during extraction. |
| `workspace-layout.js` | Creates fixed reopen and title-adjacent collapse buttons; clamps width to 240–440px; hides sidebar completely when closed; quotes have a separate attribution link. |
| `workspace-layout.css` | Multiple overlapping desktop/mobile rules; visible resize handle becomes 10px wide on hover; closed mode removes the sidebar instead of retaining a rail. Consolidate these rules, do not append another override layer. |
| `public-site.js` | Adds mobile menu behavior and overrides existing handlers. Coordinate this with the shared shell to avoid duplicate toggles. |
| `admin-theme.css` | Existing brand tokens, typography, login styles, and mobile breakpoints. Preserve these values. |
| `assets/brand-compass.svg` | Current 128×128 compass-only mark. |
| `../SafarOps---Axis-Digital/dist/assets/brand-compass.svg` | Original 96×96 SVG: Kaaba cube, gold band/door, circular compass and cardinal points. Restore this exact asset rather than generating a new interpretation. Its `dist` location is a reference source, not the output to overwrite. |
| `scripts/build.cjs`, `scripts/serve.cjs` | Explicit file lists. New page, style, and script files will be missing unless build packaging and local serving are updated together. |
| `scripts/runtime-config.cjs`, `auth-flow.js` | Browser configuration allowlist and current login/role contract. Preserve them. |
| `vercel.json` | Static output in `dist`, build `npm run build`, framework null. Preserve the confirmed `awi-digital/safar-ops` deployment target. |

## 3. Confirmed requirements and layout interpretation

The requested “final length” is interpreted as the minimum expanded **width**, measured from the Manifest navigation row. Sidebar height remains the viewport height. This interpretation allows the requested narrow-to-collapse gesture.

Expanded desktop sidebar:

```text
┌─────────────────────────────────────┐
│ [Kaaba/compass] SafarOps    [collapse]│
│                subtitle             │
│ [search icon] Search…                │
│ navigation icon + label             │
│ Manifest, Dokumen & Kamar            │
│ …                                   │
│                                     │
│ Arabic reflection + meaning (link)   │
│ account / logout                    │
│ [shield] Super Admin (if authorized) │
└─────────────────────────────────────┘
```

Collapsed desktop rail (proposed 64px width): logo/open control at top; search icon; navigation icons; account/logout; Super Admin shield anchored at bottom when authorized. Main content begins immediately after the rail. No floating reopen button overlaps the content.

The requested top-right sidebar icon means the right end of the **sidebar brand row**, alongside the web title. Remove the previously inserted button directly after the SafarOps text and the fixed top-left button; replace them with this one intentional control. Remove header search and move the existing search input/behavior to the top of the sidebar. Do not add a second dashboard navigation control in the content header; the sidebar overview item owns that navigation.

Retain current phone header/navigation behavior. Desktop rail/resizing applies from the existing 1024px breakpoint. Mobile uses its existing expandable navigation, with the restored logo and moved search inside that navigation. Quotes remain hidden on phones.

## 4. Sidebar state and sizing specification

State owner: one shared `sidebar` controller, not separate handlers in `public-site.js` and `workspace-layout.js`.

States: expanded desktop, resizing desktop, collapsed desktop rail, mobile closed, mobile open. Store desktop expanded width and collapsed preference separately; crossing a breakpoint must not overwrite the saved desktop preference.

### Width measurement

Compute the minimum expanded width after `document.fonts.ready` using an invisible measurement row with the same font, icon, gap, and padding as the real Manifest item:

`minimumExpandedWidth = ceil(labelWidth + iconWidth + iconGap + rowPaddingLeft + rowPaddingRight + navPaddingLeft + navPaddingRight + borders) + 4px`

The 4px is extra slack after accounting for the whole row. Do not hardcode a guessed character count or clip “Manifest, Dokumen & Kamar”. Use the existing label text unless the product copy is deliberately changed. Default expanded width equals this measured minimum. Reopening restores the last valid expanded width, at least this minimum. Proposed maximum is 440px while retaining usable main-content space; if the viewport cannot accommodate the minimum, use the mobile layout.

Recompute when fonts or text metrics change, using ResizeObserver without repeatedly writing the size being observed. A font/zoom reflow that increases the minimum should expand to fit, not unexpectedly collapse.

### Resize and collapse

- Keep an 8–12px transparent pointer target at the right sidebar edge; show only a 1px gold line, 2px on hover/focus/drag, centered exactly on the border. The target can overlap the content edge; the visible line must not become a wide yellow strip.
- Pointer capture keeps drag stable outside the handle. Release on pointerup/pointercancel; update geometry at most once per animation frame.
- While the requested drag width is below the measured minimum, enter collapsed rail mode once. End that drag, release capture, and preserve the previous valid expanded width. Avoid flickering between states at the threshold.
- Keyboard separator: arrows resize; Enter toggles rail/expanded; Home restores minimum. Expose label, orientation, controlled pane, minimum/maximum/current values. Focus stays usable if collapse removes the separator: move it to the rail logo button.
- Rail logo changes visually to the open-sidebar icon on hover **and keyboard focus**. Clicking, Enter, or Space opens it. Its accessible name is always “Buka sidebar”; touch does not depend on hover.
- Expanded collapse button is an icon only with accessible name “Tutup sidebar”. No duplicate control or “Menu” text.
- Rail icons have accessible names, focus styles, and visible hover/focus tooltips. Active route remains marked; hidden labels must not remove accessible names.
- Super Admin sits in the bottom section and is absent for normal users. Low-height displays scroll the central navigation while keeping top controls and bottom actions reachable. Logout remains available in both desktop states.

## 5. Search, quotes, logo, dropdowns

### Search

Move the existing global-search input into the sidebar below branding. Preserve its query state and current filtering semantics; this is not a new global database-search feature. In rail mode the search icon expands the sidebar then focuses the input. Mobile search appears inside the expanded mobile navigation. Remove `dashboard-search-toggle` and its listener.

### Logo

Copy the original Kaaba/compass SVG from the sibling workspace into the app's owned assets and reuse it for product branding and the rail toggle. Keep customer agency logos in agency-specific locations; do not overwrite uploaded branding. Use fixed intrinsic dimensions and `object-fit: contain`; compare the restored mark at 24, 32, and 44px. No image generation or new image dependency is required.

### Reflections

Keep random selection on each document reload, previous-entry avoidance when storage is available, Arabic text, and Indonesian meaning. Make the Arabic and meaning one semantic hyperlink to the existing vetted source. Remove the separate visible verse/source caption. Retain source metadata internally and an accessible link name identifying the reference. Use `lang="ar"`, `dir="rtl"` on Arabic only. Keyboard focus must outline the linked card. Keep quotes hidden in the rail and on phones; do not replace them with clipped text.

### Dropdown visual system

Use one shared dropdown style: ivory surface, emerald text, 10px corners, subtle border/shadow, 44px trigger height, consistent inset, gold/emerald focus ring, aligned chevron, and clear selected state.

For the chart period control, propose a select-only combobox with a styled listbox: rounded popup, selected check, hover/focus row, viewport-aware placement and maximum-height scrolling. Implement Arrow keys, Home/End, Enter/Space, Escape, typeahead, Tab, and outside-click dismissal. Canceling must retain the previous selection. Keep a native select as progressive fallback and use its existing values/change path as the source of truth. Avoid nested interactive elements.

Apply the shared native-select trigger style to account scope, role/status, package selection, and forms first. Enhance additional popup lists only after the reusable combobox passes keyboard/mobile checks. Dynamic options must remain synchronized and form validity/reset behavior must work. Do not turn searchable long lists into a short fixed menu. Native mobile selection is acceptable and preferred where it is more usable.

Chart period remains bottom-right inside the chart card, and keeps its existing 6-month, 12-month, year, and all-history values. Preserve real-data filtering and zero-data behavior.

## 6. Page and CSS separation

Proposal: retain vanilla JavaScript and the current Node static build. Create separate source views, controller modules, and styles; generate standalone page documents with one shared authenticated shell. This provides actual page URLs without introducing a framework migration.

Proposed new structure (paths are plans, not existing files):

```text
src/
  shell/                 document.html, sidebar.html, header.html, shared-dialogs.html
  pages/
    overview/            view.html, page.js, page.css
    packages/            view.html, page.js, page.css
    crm/                 view.html, page.js, page.css
    manifest/            view.html, page.js, page.css
    finance/             view.html, page.js, page.css
    settings/            view.html, page.js, page.css
    superadmin/          view.html, page.js, page.css
    auth/                view.html, page.js, page.css
  styles/                tokens.css, base.css, shell.css, components.css, print.css
  components/            sidebar.js, select.js, quote.js
  core/                  bootstrap.js, state.js, navigation.js
```

Generated outputs: `/index.html` for authentication, and `/overview.html`, `/packages.html`, `/crm.html`, `/manifest.html`, `/finance.html`, `/settings.html`, `/superadmin.html`. Shared assets use stable root-relative URLs. Update the local server and Vercel output packaging for every page and asset; do not expose source templates, `.local`, env files, or private server files.

Extraction order matters:

1. Extract inline CSS and shared tokens without moving DOM or changing behavior.
2. Extract view markup into source fragments composed by the build. Keep the existing single-page output temporarily so current all-page rendering remains valid.
3. Separate page controllers and make initialization/render calls page-aware. `App.renderAll()` currently assumes other pages exist: splitting HTML alone will break those lookups.
4. Generate independent pages only after page-local renderers, shared dialogs, charts, and event cleanup are isolated. Initially retain compatibility wrappers for existing `App` handlers, then remove them as each view migrates.
5. Use real navigation links with normal Back/Forward/reload behavior. Preserve server-verified session restoration before rendering protected data. Carry only intended route/filter state, never tokens or private records, in URLs. Keep activation/setup hash handling on the auth entry; do not reuse that hash for page routing.

Page navigation must not discard an unsaved modal/form silently: provide save/discard/cancel behavior where a dirty form exists. Return-to URLs must be an allowlist of local pages. A normal user opening `/superadmin.html` directly gets an access-denied state and no privileged fetch; existing server/RLS checks remain authoritative.

Account scope, form payloads, payment status values, chart aggregation, exports, printable documents, and other legacy values must survive extraction. Review shared dialogs for cross-page dependencies before moving them.

## 7. Dependencies and framework decision

| Component | Observed state | Required action |
| --- | --- | --- |
| App framework | Vanilla HTML/CSS/JS; Vercel framework null | Keep it; no React, Next, or UI kit required. |
| Node | package requires >=18; Node 24 was used in local commands | Use supported Node runtime already selected for deployment; align local/build versions during implementation. |
| npm dependencies | No dependencies declared in package.json | Do not claim CDN libraries are locked npm dependencies. No new runtime package is necessary for this design. |
| Tailwind | `cdn.tailwindcss.com` plus inline theme config | Preserve utility behavior during extraction. Before release replace development CDN with a compatible pinned build-time Tailwind toolchain; establish the current major and inventory dynamic classes first. Do not jump to current v4 just because its docs are current. Add exact dev dependency and lockfile only after compatibility validation. |
| Lucide | `unpkg.com/lucide@latest` | Keep existing icon vocabulary; pin the proven version before release, avoiding an implicit major upgrade. Reinitialize only newly mounted icons. |
| Chart.js | Unversioned CDN | Keep API/data contract, determine and pin working version; call resize/update after shell/page changes. |
| Supabase JS | CDN major `@2` | Preserve auth and data calls; resolve/pin working version rather than changing the provider. |
| SheetJS / QRCode | `xlsx@0.18.5`, `qrcodejs@1.0.0` | Preserve export/print integration; upgrades are outside this visual change. |
| Fonts | Plus Jakarta Sans, Amiri via Google Fonts | Reuse; wait for font readiness before measuring sidebar. |
| Browser APIs | Pointer Events, ResizeObserver, matchMedia, storage, semantic links | Enough for sidebar and routing; no drag library needed. Storage failure must have an in-memory fallback. |
| Verification | Existing Node tests/check/build scripts | Reuse; add focused sidebar and page isolation checks only as needed. Browser checks are required for layout and keyboard behavior. |

Exact resolved versions of unpinned CDN scripts are not present in the manifest and were not inferred. Record them from actual responses before changing dependency delivery. There are no installations or credential changes needed merely to produce this PRD.

## 8. Integration boundaries

Public surface: SVG, styles, page markup, quote content/reference URLs, public Supabase config. Private data: existing records loaded after authentication. Trusted authorization: Supabase/Edge Function role and owner checks. Secrets: remain in trusted service environments. This task introduces no new database schema, external messaging, record creation on navigation, or server credential in a client file.

Super Admin UI visibility is a convenience, not authorization. Test denial through the existing service boundary; do not invent a browser admin session to certify it. Use designated test accounts if available; otherwise label integration coverage as pending.

## 9. Acceptance criteria

| ID / priority | Observable result | Evidence |
| --- | --- | --- |
| NAV-01 P0 | No old floating top-left button, inline text-adjacent Menu button, or header search icon; one collapse icon in sidebar brand row. | Desktop screenshot + DOM/action check. |
| NAV-02 P0 | Manifest label fits on one line at measured minimum with 4px extra slack after row geometry. | Browser measurement after fonts load at 100%/200% zoom. |
| NAV-03 P0 | Drag below minimum changes to a 64px rail once; all navigation icons remain usable; content margin matches state. | Pointer interaction across threshold and viewport resize. |
| NAV-04 P0 | Gold divider visually 1–2px, aligned with right edge; keyboard and pointer target remain usable. | Screenshot + arrows/Enter/drag/cancel. |
| NAV-05 P0 | Rail logo swaps on hover/focus and opens on click/keyboard; tooltip names and active item are clear. | Keyboard traversal and touch-like activation. |
| NAV-06 P0 | Authorized Admin shield remains at bottom; normal users never receive the control or privileged page data. | Role checks + short-screen scrolling. |
| NAV-07 P0 | Mobile retains working compact header/navigation; no desktop rail, resizer, or quote appears. | 360px and 390px portrait plus landscape. |
| BRAND-01 P0 | Restored original sibling-workspace Kaaba/compass asset renders sharply; customer logos still load. | Compare SVG provenance and 24/32/44px renders. |
| QUOTE-01 P1 | Arabic + meaning themselves link to source; no separate visible citation line; reload randomization still works. | DOM target, keyboard focus, blocked storage scenario. |
| SELECT-01 P1 | Chart dropdown popup is styled, keyboard operable, and changes actual period data without losing selection on cancel. | Pointer/keyboard checks and chart values. |
| PAGE-01 P0 | All seven workspace pages have separate source markup/controller/CSS and independently reloadable output URLs. | Build output inspection + each direct URL and Back/Forward. |
| PAGE-02 P0 | Page extraction produces no missing-element errors, duplicate listeners, cross-page CSS leakage, or duplicated chart instances. | Console and repeated page/modal navigation. |
| REG-01 P0 | Login, invitation/setup, account scope, role controls, form saves, export, and print keep existing contracts. | Existing checks and authorized integration flows. |
| VIS-01 P1 | Existing visual identity and card content preserved; tables stay within rounded scroll containers. | Before/after desktop/mobile comparison, long data and zoom. |

## 10. Implementation and release sequence

1. Capture current desktop/mobile baseline; inventory DOM IDs, dynamic dropdown options, and shared controller dependencies. Preserve unrelated local changes.
2. Restore the original SVG. Consolidate shell CSS and build the measured-width expanded/rail/mobile state controller. Remove legacy competing controls and handlers.
3. Move search and change quote links. Verify focus, role visibility, overflow, and responsive states before page extraction.
4. Deliver dropdown styling and the chart combobox; preserve selected values and form semantics.
5. Extract styles and page fragments incrementally, then introduce page-local controllers and standalone outputs. Update build, serve, deployment packaging, and source checks together.
6. Resolve CDN versions and compile compatible Tailwind for release; inspect generated classes, including runtime status classes. Preserve a known-working deployment for rollback.
7. Run appropriate checks/build and focused tests; operate representative desktop/mobile flows. Do not claim screenshots establish persisted records. No production sample records without explicit authority.
8. Commit only scoped files and push according to repository workflow. Review the Vercel build for that commit. Publishing success is a READY deployment plus checked assets/routes, not just a successful push.

Definition of done: all P0 criteria pass, P1 outcomes are checked, no page/auth/data regression, production build contains every required asset, source references and dependency versions are recorded, and outstanding limitations are explicitly reported.

## 11. References and how to use them

Checked 4 November 2026. ChatGPT is the user's interaction reference; do not copy its branding or claim a live screenshot comparison was performed.

- Original visual source: `../SafarOps---Axis-Digital/dist/assets/brand-compass.svg` and the user's supplied green Arabic card screenshot.
- [WAI-ARIA window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/): focusable separator semantics and keyboard sizing. The pattern notes its review status; validate the actual implementation with keyboard/screen-reader behavior.
- [WAI-ARIA combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): selection popup roles and keyboard model.
- [MDN ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver): measuring element geometry after content/viewport changes.
- [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API): reference only if in-place navigation is later retained; the proposed initial independent pages use normal links.
- [Tailwind Play CDN](https://tailwindcss.com/docs/installation/play-cdn): development delivery guidance; motivates a compatible compiled release, not a major-version redesign.
- [Lucide vanilla JavaScript](https://lucide.dev/guide/lucide): existing icon integration and accessible icon handling; current documentation may describe a newer major than the app resolves.
- [Chart.js updates](https://www.chartjs.org/docs/latest/developers/updates.html): preserve chart instances/data updates where practical during period and layout changes.
- Existing quote provenance: [94:5](https://quran.com/94/5), [13:28](https://quran.com/13/28), [Bukhari 1](https://sunnah.com/bukhari:1), [Muslim 2699a](https://sunnah.com/muslim:2699a). Verify Arabic and meaning against these before altering content.

Open implementation decisions (not blockers to planning): exact measured minimum width after fonts load; resolved CDN versions; whether additional large form dropdowns need searchable popups. Proposed defaults above allow implementation to proceed without broad redesign.
