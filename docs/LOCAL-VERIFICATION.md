# SafarOps2 local verification

## Scope

The public landing, sourced Makkah hero, SafarOps icons, contact validation, and the existing login popup are in the local frontend. The original workspace remains in `index.html`; no database schema, policies, server functions, records, or Supabase auth logic were changed by this work.

## Connection

SafarOps2 now uses the separately supplied `ordxatirqolmduiferjk` Supabase project URL and its **publishable** client key. The service-role secret is not in the repository or build. A read-only check on 3 November 2026 found no tables in that project's `public` schema. The frontend can load, and the login popup can open, but license and workspace operations that expect original tables may fail until this separate project has the required schema and data. Existing SafarOps remains pointed at its own project.

The user explicitly required no Supabase schema or logic changes here. This implementation does not create tables or copy records. It does not claim that staff sign-in or data access on the new project is working.

## Local run

```text
npm test
npm run check
npm run build
npm run dev -- 4175
node scripts/verify-local.cjs 4175
```

The default port is 4173; the explicit alternate port is useful when 4173 is occupied. The app is static and needs no package installation. CDN libraries used by the existing staff workspace require an internet connection.

## Checks

| Check | Result |
| --- | --- |
| Public page and assets | Local browser preview loads the Makkah image, header, public sections, and favicon assets. Desktop and 390 px mobile views have no horizontal overflow. |
| Navigation and Admin Console | Desktop has separate Kontak and Admin Console controls; mobile menu exposes both. The modal opens with the original email/password fields, remember-session option, and activation action. |
| Input validation | Five focused tests cover Indonesian phone formats, invalid cases, required inquiry fields, and WhatsApp draft URL construction. |
| Build | `npm run build` copies only the public application files and seven declared assets to `dist/`. |
| Supabase | New project has no public tables. Authenticated workspace data flow is not verified. |

## Content still needed from the travel business

`public-config.js` intentionally leaves the WhatsApp destination blank. The form validates input but reports contact as unavailable until a verified business number is supplied. Public packages use the PRD's consultation fallback, since there is no approved public package source. Business license claims, prices, testimonials, and departure inventory are not invented. The source manifest records the requested JEJAKIMANI image and the publication-rights check still needed before production use.

The social preview image uses a local relative path because SafarOps2 has no confirmed production URL. Before publishing, replace it with the final absolute image URL and add the canonical page URL.
