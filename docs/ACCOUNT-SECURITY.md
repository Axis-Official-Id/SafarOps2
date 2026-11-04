# Account security — 4 November 2026

The Supabase database changes and `safarops-accounts` Edge Function are live in project `ordxatirqolmduiferjk`. Frontend changes are in this checkout and `dist/`; no frontend deployment or Git push was performed.

## Initial admin setup

The requested admin Auth account exists and password login was verified. Its initial password is temporary, stored by Supabase Auth as a password hash, and is absent from shipped browser assets. Data access is denied until a new password is chosen using the private setup link. The link is in the gitignored `.local/admin-setup-link.txt`; it is not served by the local web server or included in builds. Do not publish this file. Setup expires seven days after provisioning.

Open the private link, sign in with the requested temporary credential, choose a unique password of at least 12 characters, confirm it, and acknowledge the save-password reminder. Setup requires both the authenticated session and private setup token. Rotation invalidates refresh sessions; old initial access tokens remain denied even after setup completes. The new login is stored as a renewable Supabase browser session. F12 can inspect a browser's own session token; hiding files does not protect credentials.

## Approved users and admin workspaces

1. Admin adds an email and role in the control room.
2. The server creates an invitation; the admin copies its private link and shares it securely with that email's owner. The application does not send an email.
3. The user opens that link and chooses their own password. Only the token hash is stored in the database. Links expire after seven days, are claimed atomically once, and replacements invalidate previous links. Activation cannot overwrite an existing user's password.
4. The server creates a confirmed Auth account after validating the private link. Public signup cannot independently claim approved emails. Admin credentials, passwords, and service keys are not returned to the client.
5. After activation, users complete the profile wizard and log in normally. Only active licensed accounts can access data. Self profile updates cannot alter role, status, or email.
6. Admin can see all data or select a particular activated account. The signed-in identity remains the admin; new records belong to the selected account. In the all-accounts view new records belong to the admin. Related package/jamaah/payment records must belong to the same account.

Invitation links establish possession through secure manual delivery. They are bearer credentials: do not post them publicly. Custom SMTP is not configured by this change; standard Supabase email delivery/recovery still needs a suitable SMTP configuration before use.

Cloud-mode workspace datasets are not written into browser caches, and legacy SafarOps caches are cleared. Supabase session persistence and refresh remain enabled; explicit logout invalidates the session and clears workspace state.

## Reproducing backend setup

For a fresh database apply `schema.sql`, then `account-security.sql`. Deploy `supabase/functions/safarops-accounts/index.ts` as `safarops-accounts`. Gateway JWT verification is disabled because activation is anonymous; authenticated actions independently verify the bearer token through Supabase Auth and check the active admin license. Activation requires a random 256-bit private token. Privileged keys are read only from Supabase's Edge Function environment.

The initial admin bootstrap was executed once using a private hashed invitation. Its provisioning scripts and runtime token file were removed. Never commit a bootstrap credential or setup link. Do not rerun the original schema script after the security update because it restores obsolete activation permissions.

## Verification

- `npm test`: 25 passing tests for activation, password setup, role checks, stale initial tokens, and existing input validation. Server API tests use explicit provider doubles.
- `npm run check`, `npm run build`, `git diff --check`: passed.
- Real Supabase password login: passed. Temporary-session reads and account management are denied; missing setup token, anonymous account management, and invalid activation tokens are denied.
- `tests/permissions.sql`: passed against the real database in a transaction, with every fixture and metadata update rolled back. Covers account isolation, profile saving, privilege escalation, related-record ownership, blocked-user denial, admin visibility, and stale initial token denial.
- Local HTTP preview on port 4177 returned 200. Computer Use stopped because Chrome's current URL could not be determined safely; visual browser interaction, first password rotation, and browser reload auto-login were not verified. The first password rotation is intentionally left for the owner.

The security advisor flags the service-only invitation table as RLS-without-policies intentionally (clients have no privileges), and the authenticated profile RPC as SECURITY DEFINER intentionally (it validates the caller and updates only that account's profile fields). The existing `rls_auto_enable` warning and disabled leaked-password protection are outside this change.
