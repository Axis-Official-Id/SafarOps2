# SafarOps Umroh — PRD Engine Master Prompt

**Target model: GPT-6.1 Sol Max**

Act as an expert Senior Product Manager and Software Architect. Review the SafarOps Umroh addition PRD below and produce the **first implementation-ready PRD review and frontend architecture blueprint**. Your job in this first output is to translate the PRD into a traceable plan for engineering and design, expose its gaps, and define how completion will be verified. Do not implement code, change files, alter accounts, or deploy in this first output.

Use the C.R.O.C. workflow throughout:

- **Context:** The existing SafarOps site opens on a login screen. The requested addition is a public Umroh landing page for jamaah to browse services/packages and contact the travel team. Staff must continue to reach the original workspace through the existing sign-in flow.
- **Role:** Senior Product Manager and Software Architect accountable for product clarity, technical feasibility, preservation, and a handoff engineers can follow.
- **Objective:** Produce an evidence-based requirements review, user stories, UX and frontend architecture blueprint, edge-case register, acceptance and verification plan, and prioritized clarification list.
- **Constraints:** Preserve all original data, Supabase logic, credentials, sessions, permissions, and security behavior. Use the existing app architecture once verified. Do not invent business facts, public data access, backend changes, or a working credential shortcut.

## PRD context

The following is the full source PRD. Treat its confirmed choices and scope boundaries as authoritative for this exercise. Treat its observations as observations, its proposals as proposals, and its unverified details as unverified.

--- BEGIN SAFAROPS PRD ---

# SafarOps Umroh Website — Addition PRD

**Version:** 1.0 · **Date:** 2 November 2026 · **Implementation target:** GPT-6.1 Sol Max

**Status:** Planning deliverable. No application, account, database, security setting, or deployment has been changed.

## 1. Product decision

Add a welcoming public Umroh landing page to the existing SafarOps website. Jamaah should be able to understand the travel offering, browse available package information, and contact the travel team before seeing any login screen. Authorized staff reach the existing workspace through an **Admin Console** button that opens the original login in a popup.

This is an addition to the existing product. Preserve its original records, Supabase integration, authentication behavior, permissions, operational features, and business rules.

### Confirmed choices

| Topic | Decision |
| --- | --- |
| Primary audience | Jamaah exploring Umroh services/packages and contacting the travel team. |
| Header actions | Separate **Kontak** and **Admin Console** controls. Kontak opens customer contact information; Admin Console opens the login popup. |
| Phone validation | Apply to consultation/contact forms and existing registration/profile forms that collect phone numbers. Keep sign-in as email + password. |
| Design references | JEJAKIMANI for the photographic hero, travel presentation, navigation, and consultation hierarchy; DREAMTOUR for navigation clarity and readable package information. |
| Competitor reference | TeraUmroh informs clarity of benefits and mobile presentation. Its software sales positioning and features are not requirements for this travel homepage. |
| Backend/data | No schema, migration, Supabase logic, security-policy, credential, or original-record changes in this release. |
| Framework direction | Prefer the existing stack. Use Tailwind/Next.js/Node.js where compatible; do not introduce a framework migration simply to redesign the frontend. |

### Explicit credential conflict

The original request includes changing sign-in to **admin@admin / admin**. The deployed SafarOps login visibly requires a password of at least **six characters**; `admin` has five. The repository and actual authentication configuration could not be inspected, so support for `admin@admin` is also unverified. This pair cannot be specified as a working production login while also promising unchanged authentication, security, and account data.

**Release decision:** preserve existing working credentials and login validation. Record the requested pair as an unresolved, separate credential requirement, excluded from this frontend release. Do not create an account, reset an existing password, lower password requirements, add an alias that impersonates a user, hardcode a login check, or fabricate a session. Any later credential change needs a separate decision that resolves the preservation constraint. This conflict does not block the landing-page work.

## 2. Evidence and current state

Reviewed on 2 November 2026. Observations describe the visible interface, not an audit of server-side behavior.

| Source | Observed evidence | Consequence for this PRD |
| --- | --- | --- |
| [Existing SafarOps deployment](https://safarops-axisdigital.vercel.app/) | Root opens an email/password login card; a remember-session checkbox, license activation action, and license link are visible. Password field declares a six-character minimum. Branding reads SafarOps, with a green/gold visual treatment. | Add a public first visit. Reuse the login and preserve activation/session behavior. Retain current brand identity until approved travel-operator branding is available. |
| [JEJAKIMANI homepage](https://www.jejakimani.com/) | Large Makkah imagery behind the hero, navigation over the banner, consultation/package actions, service categories, trust content, and branch/contact information. | Adapt the visual hierarchy and information categories. Do not present its company facts as SafarOps facts. |
| [DREAMTOUR homepage](https://www.dreamtour.co/) | Compact navigation, a large visual banner, service categories, and packages displaying departure, duration, airline, hotels, and price. | Use a clear header and compact, scannable package cards when corresponding original fields are available. |
| [TeraUmroh competitor](https://digiteraai.myscalev.com/teraumroh) | Landing page for management software with problem/benefit sections, screenshots, pricing, FAQ, and repeated CTAs. | Borrow clarity and hierarchy only. Do not add its payment, rooming, traffic-light, or other operational features. |
| [FarmOps example](https://farmops-smart-dashboard.vercel.app/) | A workspace sign-in and product explanation for a different industry. | Secondary reference for sign-in readability. No agricultural copy, records, or workflows are in scope. |
| [Supplied GitHub repository](https://github.com/clipperww3-ops/SafarOps---Axis-Digital) | GitHub connector returned 404 / Not Found for repository metadata and contents. The two supplied repository URLs identify the same repository. | Stack, source files, route names, Supabase methods, authorization gates, and data contracts remain unverified. Do not invent file paths or claim a code audit. |

Supabase documents project-level password controls in its [password security documentation](https://supabase.com/docs/guides/auth/password-security). This PRD does not infer the project's current provider settings from that documentation.

### Implementation discovery required

Before editing code, identify the current entry point, router or view-switching mechanism, build scripts, style system, authentication handlers, protected workspace gate, activation flow, and existing contact mechanism. Produce a short map of those integration points. Inspect available public-safe package fields and the existing phone field storage contract. Repository access is required for implementation, but not for completing this PRD.

The public travel brand, contact destination, service catalog, package visibility, and supported business claims must come from verified original configuration/content. If those are unavailable, use the fallback rules below. Do not substitute JEJAKIMANI contact details or package data.

## 3. Problem, goals, and USP

The current first screen asks visitors to sign in before explaining the travel offering. For jamaah, the new first screen should answer: What is offered? What information is available? How do I speak to the travel team?

### Goals

1. Make the root page useful without authentication.
2. Establish a calm, credible travel identity through imagery, typography, clear information, and verifiable evidence.
3. Make package exploration and consultation easy on a phone.
4. Preserve reliable staff access to all existing operations.
5. Reject malformed form input before an existing submission action runs, with clear Indonesian messages.
6. Preserve every original record and the existing backend/security contract.

### Proposed USP

**“Rencanakan Umroh dengan lebih tenang: informasi paket jelas, konsultasi mudah, dan persiapan yang terarah.”**

This is proposed positioning, not proof that every service exists. Publish each supporting benefit only when existing content or the travel team can substantiate it.

| Value pillar | What visitors should see | Evidence requirement |
| --- | --- | --- |
| Clear package information | Dates, duration, price basis, facilities, and inclusions/exclusions where already available. | Original package data or verified editorial content. Never invent prices or seat availability. |
| Accessible consultation | A consistent consultation CTA and the travel team's actual contact channel. | Existing configured contact destination. Never route inquiries to a reference company's number. |
| Guided preparation | A concise explanation of the next steps and required preparation. | The operator's verified process. No invented visa guarantees, approvals, or service promises. |

Use specific evidence instead of generic claims such as “best,” “cheapest,” or “guaranteed departure.” Display licenses, partner logos, testimonials, review counts, and experience figures only when verified for this business.

### Scope boundaries

**In scope:** public landing page, favicon suite, header/footer, responsive UI, existing-login modal, presentation improvements to existing workspace screens, client-side validation, loading/error/empty states, public metadata, and regression verification.

**Out of scope:** database changes; new Supabase tables, columns, buckets, functions, policies, triggers, or migrations; auth/provider changes; credential changes; new checkout/booking/payment systems; new CRM features; new OTP/SMS integrations; new lead storage; copying competitor records; framework migration; automated production publishing.

## 4. Experience and page structure

### Navigation model

Treat these as logical destinations. Keep current route names and view mechanisms wherever possible.

| Destination | Expected behavior |
| --- | --- |
| Public root | Opens the landing page without a forced login or automatically opened modal. |
| Beranda / Paket Umroh / Keunggulan / Tentang / FAQ / Kontak | Scroll to corresponding landing-page sections. Show only sections supported by verified content. |
| Admin Console | Opens the existing login as an accessible modal above the landing page. |
| Existing protected workspace | Keeps its current authentication and authorization gate; original operational links continue to work. |
| Existing login/activation links | Remain functional. A supported direct login entry may remain as a fallback; do not remove account activation. |

Returning authenticated staff still see the landing at the root. Admin Console may become **Buka Console** and open their existing authorized workspace. Do not sign them out or alter remember-session behavior. Logout clears access through the existing mechanism and returns to a public state.

### Layout order

1. **Header:** original brand/logo on the left; travel navigation in the center when space allows; Kontak and Admin Console at the right. Kontak has customer-facing wording; Admin Console has a clear staff label.
2. **Hero:** full-width JEJAKIMANI homepage image as the background; readable headline, short supporting copy, primary consultation action, secondary package action. No login fields in the hero.
3. **Verified trust strip:** only substantiated business facts. Omit the strip if none are available.
4. **Paket Umroh:** a small selection of actual public-safe offerings, or a truthful availability/contact fallback.
5. **Why choose this travel team:** three evidence-backed USP pillars.
6. **Preparation process:** verified steps from consultation to preparation. No new booking workflow is implied.
7. **About / proof:** original business information and genuine testimonials/gallery if already available and appropriate for public use.
8. **FAQ:** factual answers to common package, preparation, and consultation questions using verified content.
9. **Contact section:** validated consultation form or existing contact channel, followed by actual office/contact details.
10. **Footer:** brand, useful anchors, current legal/privacy links, contact details, and a discreet Admin Console shortcut.

The root remains a single landing experience. Reuse any existing package detail page when one is already supported. Otherwise show available details in a frontend drawer/modal or use a contextual consultation action; do not create a booking engine.

### Draft Indonesian hero copy

**Eyebrow:** Perjalanan Umroh Anda dimulai di sini

**Headline:** Langkah menuju Baitullah, dimulai dengan persiapan yang tenang.

**Supporting text:** Temukan informasi paket yang tersedia dan konsultasikan kebutuhan perjalanan Anda bersama tim kami.

**Primary CTA:** Konsultasi Umroh · **Secondary CTA:** Lihat Paket Umroh

This copy is newly drafted. Preserve existing business identity and supported service names. Do not transplant JEJAKIMANI's company history, licenses, phone numbers, prices, religious quotations, or testimonials into this site's claims.

## 5. Functional requirements

### FR-01 — Public first visit · P0

Root renders the public landing before sign-in. Public navigation, imagery, FAQ, and contact discovery work without an account. Landing-page rendering must not fetch protected jamaah, payment, passport, rooming, or account records.

### FR-02 — Header and mobile navigation · P0

Use JEJAKIMANI's image-overlay header hierarchy and DREAMTOUR's compact navigation as references. Retain the site's identity. On scroll, a sticky header can gain a solid background for contrast. On mobile, keep the logo and a clearly labeled Menu control; show Kontak and Admin Console inside the menu when both cannot fit comfortably. Preserve keyboard navigation and visible focus. Anchor targets must not be hidden behind the sticky header.

### FR-03 — Full-background hero imagery · P0

Use the identified homepage photo listed in Section 6. Cover the entire banner container edge to edge, with no unfilled bands or stretching. Use responsive focal positioning so the Kaaba/Makkah subject remains meaningful on narrow screens. “Full background” means complete container coverage, with deliberate crop; displaying every pixel of a landscape image on portrait screens is not required.

Provide a dark overlay strong enough for readable text. Suggested desktop height is 640–780 px; mobile uses a content-driven minimum around 560 px and must expand for large text. Do not force clipping through a fixed height. Begin with one static image; autoplay video and carousels are not needed for this release.

### FR-04 — Package discovery · P0

Use only original records already intended and authorized for public display. Each card may show title, image, departure, duration, price/currency/unit, airline, hotels, and availability, but only when those fields exist. Keep stored values unchanged. Date/currency formatting is presentation only.

Do not query a private table from an anonymous page, loosen policies, expose an internal dataset through a public server proxy, or copy private records into frontend assets. If an approved public data path already exists, reuse it. Otherwise use existing verified public editorial content, or display **“Informasi paket dapat dikonfirmasi melalui konsultasi.”** with a contact action. Do not introduce a new publication mechanism in this release.

Support loading, no-public-packages, and unavailable states without fake cards or prices. Existing records remain intact even when a card is omitted from public view. If package details are already visible, show each field exactly as supported rather than silently filling gaps.

### FR-05 — Existing login popup · P0

Reuse the current login component/form and submit handler. Change placement and styling only. Keep current email/password requirements, remember-session behavior, account activation, licensed-access rules, authorization, error handling, and workspace destination.

Modal includes a title, visible labels, password show/hide control if compatible, submit action, close button, loading state, and readable provider errors. Keep password entry unchanged; do not trim or transform passwords. Authenticate through the existing service and enter the console only after the existing success and authorization conditions pass.

Trap keyboard focus, support Escape, make background content inert, prevent background scrolling, and return focus to the trigger on close. An in-progress request must not be duplicated, and an async response after closing must not create a stale success/error overlay. Small screens use a comfortably scrollable near-full-screen dialog. Opening or closing the popup must not create a user or write a record.

Do not put a required phone field in sign-in or imply phone ownership has been verified. Keep existing agent/admin distinctions; the Admin Console label does not grant an admin role.

### FR-06 — Contact and consultation · P0

Kontak scrolls to the contact section. Consultation CTAs open or focus its form. Use the travel team's existing contact channel and verified contact destination, without introducing backend storage.

If an existing submission endpoint/integration exists, reuse its exact contract and display success only after its actual success response. Otherwise, after validation, prepare a WhatsApp draft through an existing configured business number. Label the action **“Lanjutkan ke WhatsApp”** and state **“Pesan belum terkirim. Silakan kirim melalui WhatsApp.”** Opening a draft is not evidence of delivery. Never automatically send a message or create a lead row through an invented integration.

If no contact destination is configured, show a truthful unavailable state; do not fabricate a destination or show success. If a popup is blocked, preserve the form and provide a user-initiated fallback link. Keep entered details in the current view after errors; do not add persistent storage of personal information. Do not request passports, NIK, or payment details in the public consultation form.

### FR-07 — Favicon and metadata · P0

Derive the favicon from the original SafarOps compass/brand symbol, with a simplified silhouette legible at small sizes. Do not use JEJAKIMANI's or DREAMTOUR's logo. Deliver SVG favicon, ICO with 16/32/48 px variants, 180 px Apple touch icon, and 192/512 px PNG icons. Reference them through the current framework's supported metadata/head mechanism. Icons do not imply adding PWA/offline behavior.

Use the existing public travel brand for page title, Indonesian description, canonical URL, and social preview metadata. Use the actual production origin when verified. Avoid search-engine indexing of protected screens using the site's existing supported method; this is supplementary metadata, not access control.

### FR-08 — Existing workspace visual refresh · P1

After P0, align existing workspace colors, spacing, typography, form labels, table readability, and responsive navigation with the new visual system. Preserve every available operation, field, value, calculation, permission, action, and record relationship. Do not redesign business workflows or add competitor features. Verify the actual module inventory before defining screen-level changes. No unseen dashboard capability is assumed by this document.

## 6. Design and asset specification

### Visual system

| Element | Proposed direction |
| --- | --- |
| Brand | Keep original SafarOps identity unless verified original travel-operator branding is already configured. |
| Colors | Deep green `#0B4036`, darker green `#062C25`, warm gold `#D4B24C`, ivory `#FAF8F2`, white `#FFFFFF`, body ink `#172E29`. Verify contrast for every combination; use dark text on gold. |
| Typography | A restrained serif for major travel headings and the existing readable sans-serif for navigation, body, and forms. Use local/system fonts where practical. |
| Spacing | Consistent 8 px scale, 20–24 px mobile gutters, readable content width around 1200 px, generous section spacing. |
| Surfaces | Clean cards, subtle borders/shadows, 12–20 px radii, limited decoration. Hero remains the principal visual. |
| Controls | Clear labels, minimum 44 × 44 px touch targets, obvious focus/disabled/loading/error states. |
| Motion | Restrained transitions; respect reduced-motion preference. No motion-dependent content. |

### Identified homepage image

The JEJAKIMANI homepage uses a large Makkah visual. Its observed image inventory includes this still poster:

[JEJAKIMANI homepage poster](https://www.jejakimani.com/assets/img/jejakimani/homepage/home-video-poster.webp)

An original copy is included at `assets/jejakimani-home-video-poster.webp` beside this PRD. It is a source reference for the requested hero, not a generated or upscaled image. Keep its source attribution in the asset manifest and confirm permitted publication use with the business's existing asset process. Preserve the original file; produce optimized derivatives only during implementation. Do not hotlink the live asset as the long-term production dependency.

Use any additional JEJAKIMANI homepage photography only after identifying the actual image and recording its source. No additional photo URLs have been verified here. Do not use its branded promotional banners, staff portraits, company badges, or partner marks as evidence about this business.

Hero derivatives should provide suitable landscape and portrait crops, explicit dimensions, modern formats, and a reliable fallback. Prioritize the hero image and lazy-load below-the-fold images. Decorative backgrounds need no repeated screen-reader description; informative package/gallery images need accurate alt text.

## 7. Form validation specification

These are new **client-side presentation rules** around existing submit paths. They prevent invalid input through the normal interface but do not prove phone ownership or secure direct requests. Keep existing server-side validation and errors intact. If backend enforcement is absent, report that limitation; do not claim it was added or change backend logic within this scope.

### Field rules

| Field / context | Rule | Indonesian error example |
| --- | --- | --- |
| Full name / consultation | Required; trim outer whitespace; 2–100 characters; at least one Unicode letter; allow single names, spaces, apostrophes, hyphens, and common name punctuation. Reject controls, emoji-only strings, and markup-like input. Do not demand two words. | Masukkan nama Anda, minimal 2 karakter. |
| Phone / contact, registration, profile where present | Required when the relevant form already requires it. Public consultation requires it. Apply normalization and the Indonesian mobile rule below. Use `type=tel`, mobile keyboard hints, and an example. | Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890. |
| Email / consultation | Optional unless the existing contract requires it. If supplied, trim outer whitespace, allow one normal email address, require a meaningful domain, and reject malformed input. Do not invent deliverability verification. | Masukkan alamat email yang valid. |
| Package interest / consultation | Optional; when offered, accept only an identifier from the displayed public-safe package list. Provide “Belum menentukan paket.” | Pilih paket yang tersedia atau belum menentukan paket. |
| Message / consultation | Optional; when supplied, 10–1000 characters after trimming. Render as text. Do not accept empty-looking or control-only content. | Isi pesan minimal 10 karakter atau kosongkan kolom ini. |
| Contact consent / consultation | Require an explicit unchecked-by-default agreement to be contacted for this inquiry. Treat as transient form intent unless an existing contract already stores it. No new consent database field. | Setujui agar tim kami dapat menghubungi Anda. |
| Login email | Preserve the current sign-in contract and validation; trim accidental outer whitespace only if already supported. Do not impose the consultation email rule on existing identities. | Masukkan email akun yang terdaftar. |
| Login password | Preserve the current minimum, maximum if any, and provider behavior; never trim, log, or auto-correct it. Current visible minimum is six characters. | Kata sandi minimal 6 karakter. |

Existing saved phone values must remain readable without automatic rewrites. If a user edits a phone field, validate the new value. Do not block an unrelated profile edit solely because an unchanged legacy phone value does not meet the new format rule, unless the current backend already does so.

### Indonesian mobile-number rule

This is a defined product-format rule, not a guarantee that a number is assigned or reachable.

1. Trim outer whitespace. Permit spaces, hyphens, and balanced parentheses as separators; a single leading `+` is allowed. Reject letters, extensions, multiple plus signs, unbalanced parentheses, and other punctuation. Do not silently strip arbitrary characters into a valid number.
2. Remove the allowed separators for validation.
3. Accept domestic `08…`, international `+628…`, or international digits `628…`.
4. Normalize a new value in memory to `+628…`. After `+62`, require `8` followed by **8–11 digits**: `^\+628\d{8,11}$`.
5. Reject obvious repeated-digit filler after the mobile prefix, such as all zeros or all the same digit. Do not claim to detect every fake number.
6. Pass the normalized value only if compatible with the existing payload/storage format. Otherwise adapt to its current expected representation without changing that contract. Never batch-normalize saved records.
7. Display helper text **“Nomor digunakan untuk konsultasi; kepemilikan nomor belum diverifikasi.”** No OTP, carrier lookup, or new third-party API is added.

### Required examples

| Input | Result |
| --- | --- |
| `081234567890` | Accept; in-memory normalized value `+6281234567890`. |
| `+62 812-3456-7890` | Accept; same normalized value. |
| `6281234567890` | Accept; same normalized value. |
| `(0812) 3456-7890` | Accept; same normalized value. |
| `0812345678` | Accept lower length boundary. |
| `0812345678901` | Accept upper length boundary. |
| Empty, `08123`, `08123456789012` | Reject required, too-short, or too-long value respectively. |
| `abc081234567890`, `+62+81234567890`, `08/1234567890`, `(0812 34567890` | Reject invalid characters/structure. |
| `+12025550123`, `02112345678`, `+628000000000` | Reject unsupported country, landline prefix, or repeated filler. |

### Interaction and submission rules

Validate on blur and again on submit; avoid showing errors before a field has been used. Show inline messages with `aria-describedby` and `aria-invalid`. On invalid submit, focus the first invalid field and provide a concise summary when multiple fields fail. Make no request and open no WhatsApp draft until required fields pass.

Enter-key and button submits share the same validation path. Disable duplicate submits while pending. Keep labels visible and entered values available after an error. Do not display a successful submission merely because a click or timeout happened. Never expose form values or credentials in analytics or console logs.

## 8. Preservation and integration contract

| Area | Mandatory invariant |
| --- | --- |
| Database | No DDL/DML, migrations, new seed data, resets, imports, or production test writes as part of this design release. |
| Supabase | Same project, client configuration, queries, payload contracts, functions, storage paths, and supported integration behavior. |
| Authentication | Same provider calls, session refresh/persistence/logout, activation, license checks, and role/permission decisions. Modal presentation adds no bypass. |
| Security | Existing RLS, grants, auth settings, route guards, storage policies, and key boundaries stay intact. Never expose privileged keys in frontend code. |
| Original records | Preserve identifiers, values, timestamps, relationships, attachments, prices, payments, account data, and histories. No example-site data is imported. |
| Public content | Anonymous visitors receive only already-approved public content. Rendering a landing page must not make operational records public. |
| Existing workflows | Existing URLs, deep links, CRUD capabilities, calculations, reports, and exports remain functional to the extent they exist in the repository. |
| Form changes | Add presentation validation before existing handlers. Do not replace the service layer or silently change stored phone formats. |

Keep marketing content/config separate from original operational records using existing frontend assets/configuration. Do not add a database-backed CMS. Resolve missing frontend content with truthful fallbacks rather than expanding backend scope.

### Stack decision

If the repository already uses Next.js, implement through its current router/layout conventions and reuse its Tailwind setup. If it uses another framework or plain HTML/JavaScript, keep that architecture; use existing styling or a scoped compiled Tailwind integration only when compatible with the current build. Node.js may support the existing build tooling; no new Node backend is required. Do not install unbounded “latest” dependencies or rewrite auth for SSR as part of this change.

## 9. Quality and measurement

### Release quality targets

| Dimension | Target / verification |
| --- | --- |
| Responsive layout | Check 360, 390, 768, 1024, and 1440 px widths. No horizontal scrolling; text, hero, nav, cards, and modal remain usable. |
| Accessibility | Aim for WCAG 2.2 AA on changed screens: keyboard access, meaningful heading order, form labels, status announcements, dialog focus management, sufficient contrast, and 200% text zoom. |
| Performance | Production-like mobile targets: LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms when field data exists. Lighthouse mobile Performance ≥90 is a lab target; record conditions and actual results. |
| Loading strategy | Prioritize only the hero media; lazy-load other media; avoid adding heavy animations, autoplay video, or unnecessary client bundles. |
| Robustness | No broken assets, dead anchors, duplicate event bindings, unhandled submission errors, or newly introduced console errors. |
| Preservation | Zero backend/security configuration changes and zero automatic changes to original data. Existing authentication and operational smoke checks pass. |

### Success measures

Usability goal: in a short mobile review, at least four of five representative users can find available package information and the correct contact action within 15 seconds, without opening admin sign-in by mistake. All tested staff can locate Admin Console and use their existing sign-in path.

If analytics already exists, compare package CTA clicks, consultation starts, valid submission success, and login outcomes before/after release. Do not invent conversion baselines or guaranteed improvements. For a WhatsApp draft, measure draft-open as an intent event, never as a delivered lead. Add no tracking service, database table, personal form values, or credential telemetry in this release. If no analytics exists, use the manual usability review and report metrics as unavailable.

## 10. Acceptance criteria and verification matrix

| ID | Scenario | Passing result |
| --- | --- | --- |
| AC-01 | Anonymous visitor opens root | Public hero, travel navigation, and useful contact/package content appear; no forced login popup or protected-data fetch. |
| AC-02 | Visitor chooses Kontak | Contact section opens; admin sign-in is not triggered. |
| AC-03 | Visitor chooses Admin Console | Original sign-in appears in a modal; correct email/password/remember-session/activation behaviors remain. |
| AC-04 | Keyboard or phone user operates modal | Focus stays inside, Escape/close work, focus returns, and all controls remain reachable while scrolling. |
| AC-05 | Invalid email, blank password, or five-character password is submitted | Existing validation blocks inappropriate input and no authenticated console is granted. The requested `admin` password is not silently permitted. |
| AC-06 | Existing valid credentials / invalid credentials / disallowed role | Existing service decides access; success goes to the authorized workspace, rejection stays outside it with a useful error. |
| AC-07 | Refresh, session expiry, direct workspace link, activation, logout | Existing persistence, access checks, activation, and logout outcomes are preserved. No sign-in bypass via URL or UI state. |
| AC-08 | Phone examples and boundary cases in Section 7 | Accept/reject results match the table; invalid input causes no submit or draft-opening action. |
| AC-09 | Valid inquiry, provider error, network error, double-click | Existing endpoint receives only valid contracted data; success requires its real success response; failures preserve values; duplicate request is prevented. |
| AC-10 | WhatsApp fallback is used | Correct configured business number and encoded draft; explicit user action; UI says draft prepared rather than message sent. No new lead record. |
| AC-11 | Public data source missing, empty, or private-only | Truthful fallback appears; no fake prices and no workaround that publishes protected records. |
| AC-12 | Hero at all specified widths | Edge-to-edge coverage, deliberate crop, readable text, intact layout, and no image stretching. |
| AC-13 | Browser tab / bookmark / mobile touch icon | Correct original-brand icons load and remain recognizable. Metadata describes the travel page accurately. |
| AC-14 | Existing record with a legacy phone format is viewed or edited | Viewing does not rewrite it; unrelated edits remain possible under existing backend behavior; edited phone validates before submit. |
| AC-15 | Original operational features are exercised | Their behavior/calculations/permissions and data match the baseline. Presentation changes have no record-side effects. |
| AC-16 | Implementation diff and before/after evidence reviewed | No migrations, account edits, seed/reset operations, public exposure changes, or security-policy changes; source manifest and quality results are included. |

Run validation tests against pure input helpers and meaningful interaction tests for modal/auth integration and submission gating. Reuse existing tests. Test writes, if essential to an existing operational smoke test, belong only in an already-configured disposable test environment with designated fixtures; never create or modify production records for this PRD's verification. Read-only evidence is sufficient for production preservation checks.

## 11. C.R.O.C. workflow for GPT-6.1 Sol Max

Here **C.R.O.C.** means **Context → Role → Objective → Constraints**, matching the structure provided by the user. It is a task framing and execution workflow, not an additional software framework. The coffee-shop example supplied the format; its coffee content and vanilla-only restriction do not apply to this Umroh project.

### C — Context

Read this PRD and inspect the existing application. Establish a baseline of routes/views, public and protected data paths, sign-in, activation, session behavior, form contracts, content, and visual identity. The confirmed customer is a jamaah browsing travel services. The existing admin workspace continues to serve staff.

**Output:** verified integration map, content availability, source/asset manifest, and a short list of facts that could not be verified. Do not invent missing routes, records, or contact details.

### R — Role

Act as a senior frontend developer and UX designer with responsibility for preservation and regression checking. Adapt the supplied travel references into the existing brand. Preserve backend boundaries. Make routine reversible design decisions independently; surface a conflict only when it cannot be resolved inside the constraints.

**Output:** responsive page structure, visual tokens, component/view plan, and a public/private boundary review grounded in the actual source.

### O — Objective

Implement P0: public landing, header, sourced full-background hero, public-safe package presentation/fallback, USP content, FAQ/contact, favicon/metadata, validated inquiry flow, and original-login modal. Then apply P1 workspace presentation changes without altering workflows. Validate the entire visitor-to-consultation and staff-to-console journeys.

**Output:** working frontend changes and preview, original-source asset manifest, screenshots at representative widths, targeted test results, preservation diff, and any narrowly excluded requirement.

### C — Constraints

Keep original data, Supabase logic, auth, security, account credentials, and service contracts unchanged. Retain the existing stack unless already compatible with the requested tooling. Do not implement `admin@admin / admin` through a workaround. Keep contact and admin controls separate, and phone validation outside sign-in. No fabricated business claims, public operational data, fake submission success, new database integrations, or production writes.

**Output:** constraint audit with concrete evidence. If a requirement needs backend/account changes, record that specific exception and continue the rest. Do not declare it implemented. Do not publish to production as part of the frontend handoff unless separately requested.

### Execution sequence

| Stage | Work | Exit condition |
| --- | --- | --- |
| 1. Discover | Inspect repo and current behavior; map handlers and content sources. | Integration points are verified; unknowns are documented. |
| 2. Design | Define page order, header, hero, cards, contact states, login modal, and responsive behavior. | Design follows confirmed audience and all constraints. |
| 3. Build P0 | Implement additive frontend changes using original handlers and assets. | Core visitor and staff journeys work in preview. |
| 4. Refine P1 | Apply limited visual consistency to existing workspace. | No workflow, business-rule, or data-contract change. |
| 5. Verify | Run acceptance matrix, targeted tests, visual/accessibility checks, and preservation review. | Evidence supports all implemented requirements; exceptions are explicit. |
| 6. Handoff | Provide changed files, preview, screenshots, asset sources, validation results, and exclusions. | Reviewable implementation is complete; production state remains unchanged. |

## 12. Handoff decisions and remaining dependencies

| Item | Status / implementation instruction |
| --- | --- |
| Audience, header split, phone placement | Confirmed by the user; do not ask again. |
| Repository access | Unverified/unavailable during research. Inspect source before implementing; never rebuild from assumed code. |
| Current framework and file paths | Unknown. Use actual repository evidence, not this PRD's illustrative component concepts. |
| Travel brand and contact destination | Reuse verified original configuration. If absent, retain SafarOps identity and show honest contact unavailability; obtain the actual destination before enabling inquiry delivery. |
| Public package feed | Reuse only an already-approved path. Otherwise use the specified editorial/contact fallback without changing database access. |
| Business proof and services | Reuse verified original information; omit unsupported claims or sections. Reference companies are not the source of SafarOps business facts. |
| Requested admin credentials | Recorded but excluded because they conflict with current visible validation and preservation constraints. No production account change is part of this release. |
| Phone ownership / direct-request protection | New UI format validation only. Existing backend enforcement is preserved; no new verification or security claim. |
| Hero asset | Original JEJAKIMANI homepage still identified and included with source manifest. Additional photography requires actual source identification. |

The accompanying `GPT-6.1-Sol-Max-Implementation-Prompt.txt` is a copy-ready handoff. Provide it together with this PRD and access to the existing repository.

--- END SAFAROPS PRD ---

## Your specific objective

Generate a **single engineering-ready review and blueprint** that answers all of the following:

1. What exactly is in the release, who is it for, and what user problem does it solve?
2. What does each requirement mean as an observable user or staff behavior?
3. How should the public landing, contact flow, and Admin Console login popup fit around the existing application without claiming knowledge of unavailable source code?
4. Which edge cases, validation rules, accessibility states, content dependencies, and regression risks need explicit handling?
5. Which requirements are ready to implement from the PRD, which depend on repository inspection or verified business content, and which are intentionally excluded?
6. What evidence will prove completion while preserving the original data and backend behavior?

## Non-negotiable analysis rules

1. **Tone and format:** Write in a professional, technical, engineering-ready tone. Use clean Markdown, numbered headings, concise prose, and tables only when they help engineers compare or trace items. Define abbreviations on first use.
2. **Source discipline:** Use the embedded PRD as the source of truth. Reference its sections, FR-01–FR-08, and AC-01–AC-16 by ID. Distinguish **Confirmed**, **Proposed**, **Observed**, **Conditional**, and **Unverified** information. Do not turn a proposal or a reference website's content into a verified SafarOps fact.
3. **No assumptions:** If the PRD does not explicitly state something and it cannot be logically derived, label it **Clarifying Question**. You may give a conditional recommendation, but state its prerequisite and never present it as current behavior or a decided requirement. Do not fabricate repository structure, route names, database tables, Supabase methods, package inventory, brand claims, contact numbers, performance results, or test outcomes.
4. **Preservation:** No new schema, migration, policy, authorization path, auth provider rule, account credential, data import, production write, or server-side contact mechanism is in scope. The landing page may use existing approved public content; otherwise specify the PRD's truthful fallback. Do not propose weakening a protected data boundary to fill the public page.
5. **Credential conflict:** Explicitly identify the requested admin@admin / admin pair as conflicting with the observed six-character password minimum and the no-credential-change constraint. Keep it in a separate **Excluded/Requires Decision** row. Do not claim that admin@admin is accepted or rejected by the provider without evidence; do not suggest a hardcoded bypass, test login in production, or silently change the PRD's release decision.
6. **Phone and contact:** Keep sign-in email + password. Apply the PRD's Indonesian phone-format rules to public consultation and existing registration/profile phone fields. State that UI validation does not verify phone ownership or enforce direct requests. Distinguish an actual successful endpoint response from a prepared WhatsApp draft; neither should be falsely reported as a delivered inquiry.
7. **References and imagery:** Use JEJAKIMANI and DREAMTOUR as design references only. Keep original branding and only verified business information. Cite the identified homepage poster and its source manifest. Do not import competitor prices, testimonials, contact details, licenses, or private records.
8. **Framework choice:** Tailwind, Next.js, and Node.js are options only where compatible with the actual stack. Do not require a migration, claim that the repository already uses them, or invent a Node backend.
9. **No premature questions:** Deliver the first substantive output now using known facts. Put unresolved questions near the end, prioritized by whether they block implementation, content publication, or neither. Do not halt the review merely because repository access was unavailable during PRD research.
10. **No false completion:** This is a review and blueprint. Do not state that the website, favicon, account, database, or deployment has already changed. Do not generate code or a change log in this first output.

## Required output structure

Use these sections in order:

1. **Executive assessment:** The product decision, primary audience, proposed unique selling proposition (USP), release scope, and the two or three highest-risk gaps. Keep this brief.
2. **Evidence and certainty ledger:** A table of the baseline facts, their PRD evidence, their certainty label, and what must be checked in the repository or with the business. Include the inaccessible GitHub source and the credential conflict.
3. **Requirements traceability:** Cover every FR-01–FR-08 in a table with priority, user-visible behavior, current dependency, relevant AC IDs, and release status. Mark P0 versus P1 correctly. Do not omit a requirement because its implementation is conditional.
4. **User journeys and stories:** Provide visitor package discovery, consultation, staff sign-in, returning staff, and a failed/invalid input journey. Use the format “As a [role], I want [goal], so that [benefit]” and add concise Given/When/Then acceptance examples for the critical paths.
5. **UX and frontend architecture blueprint:** Describe page hierarchy, header/mobile navigation, hero, verified package content or fallback, contact states, existing login modal integration, favicon/metadata, and responsive/accessibility behavior. Describe integration seams conditionally; do not invent components or file paths as existing facts.
6. **Validation and edge-case matrix:** Cover the Indonesian phone examples and boundaries in the PRD; email/name/message/consent; duplicate submit; provider/network errors; WhatsApp blocked or absent destination; empty/private-only packages; legacy saved phone values; modal keyboard behavior; session expiry; direct protected links; and image crop/failure. Distinguish UI checks from existing backend decisions.
7. **Data, authentication, and security preservation:** Show an explicit before/after contract matrix for public content exposure, original records, Supabase calls, sessions, activation, roles, storage, and operational workflows. Do **not** propose a new data model. Flag verification that requires source access.
8. **Acceptance and verification plan:** Trace AC-01–AC-16 to a manual check or targeted automated test, expected evidence, and any prerequisite. Include mobile widths, accessibility, performance conditions, and a review of diffs for backend/data/security changes. Separate planned tests from results already observed.
9. **Delivery sequence:** A dependency-aware P0/P1 sequence, with deliverables and a clear exit condition for each stage. Keep it aligned with the PRD's C.R.O.C. execution workflow.
10. **Scope gaps and clarifying questions:** Prioritize questions by **Blocking implementation**, **Blocking publication/content accuracy**, and **Non-blocking refinement**. Each question must say why it matters and what remains possible while unanswered. Include actual repository access, business brand/contact details, approved public package path, proof/claims, and image publication rights where relevant. Do not reopen choices the user already confirmed.
11. **Decision and exclusion log:** List confirmed decisions, conditional decisions, and explicitly excluded work, including the credential pair. End with a concise definition of done based on the PRD, without claiming implementation occurred.

## Final quality check before you answer

- Every requirement and acceptance criterion ID appears somewhere in the output.
- Every proposed design or architecture element is either grounded in the PRD or clearly conditional.
- Unverified information is never written as fact.
- The public landing does not imply public access to protected operational records.
- The credential conflict is visible and does not silently modify authentication.
- The output is an actionable review and blueprint, with clarifying questions at the end.

Begin the first output now.
