# Approved-email activation — 4 November 2026

This flow supersedes the private-link requirement for ordinary first activation in ACCOUNT-SECURITY.md and the confirmation/save-password fields described in AUTH-UPDATE.md.

1. An authenticated, active Super Admin adds an email and role. The `add-account` server action saves it to `safarops_licenses`.
2. The user opens the regular site, chooses first-time password activation, and enters that approved email and one password (6–128 characters). No invitation token, password confirmation, or save-password checkbox is required.
3. The server checks the saved license and active status before creating a confirmed Supabase Auth user. The password is stored by Supabase Auth as a hash. No password is stored in the license table or browser application data.
4. Creation rejects duplicate Auth emails atomically. Activating again cannot replace an existing password. Existing users sign in normally or ask an administrator to use Reset Password.
5. Error messages have a keyboard-accessible close button at the upper right. Dismissing an error preserves form input.

First activation intentionally relies on knowing an approved email; it does not prove ownership of the mailbox. Anyone knowing a not-yet-activated approved email can claim its first password. Super Admin role checks, blocked/frozen status checks, data isolation, and private administrator password-reset setup remain enforced.

No database migration is needed: the existing Auth insert guard accepts the server-controlled `safarops_invited` metadata. The service role key stays in the Edge Function environment. Gateway JWT verification remains disabled as before because activation happens before login; management actions independently verify the user's bearer token and active Super Admin license.

Verification includes provider-double endpoint tests, frontend handler tests, source checks, static build, and local HTTP checks. Browser visual verification was unavailable because Computer Use could not determine the browser URL safely. Live deployment checks must distinguish non-mutating denial paths from actual first-account activation; no real user's password is chosen or replaced as a test.
