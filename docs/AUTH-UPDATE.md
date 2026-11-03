# Login and admin update — 3 November 2026

This change supersedes the landing-page entry behavior in the original PRD and LOCAL-VERIFICATION.md. The root now opens login. The green/gold/ivory design and Makkah photography continue in the login and workspace theme. No public contact page or return-to-home action remains.

Activation requires a registered email, a chosen password of at least six characters, and matching confirmation. Login requires the chosen password. Signup with no session asks for email confirmation. Provider failures, wrong passwords, rate limits, and local cached user objects cannot grant entry. Session restoration verifies the user with Supabase and checks account access. The misleading remember-session toggle was removed; the original persistent Supabase sessions remain enabled.

Admin visibility uses the exact configured owner email, a server-returned superadmin license, or trusted app metadata. An email merely containing “admin” no longer grants the role. Administrator actions have client guards; database authorization still depends on the project's RLS policies and grants.

## Live setup blocker

The configured owner email is `admin@ruangkarir.site`. A read-only lookup in the new project's `auth.users` returned no matching user. There is no existing owner password to report. The project's required public workspace/access tables are also absent. The owner account and schema must be provisioned before real successful login and workspace data operations can be verified. No tables, policies, users, passwords, or existing records were changed by this update. No privileged key was added to the application.

## Verification

- 13 tests pass, including rejected password mismatch, failed login, signup awaiting confirmation, rate limiting, blocked accounts, missing access tables, ordinary-user access, and role escalation checks.
- Source and inline-script syntax checks and static build pass.
- Browser: login opens directly; activation exposes confirmation and mismatches produce a field error. Desktop at 1280 px and mobile at 390 px have no horizontal overflow. No browser errors observed on login.
- Admin styling was inspected with an isolated static fixture, without authenticating or reading customer data. This verifies appearance, not successful live account access.

Read-only Supabase advisors also reported existing public execution grants on `public.rls_auto_enable()`. These were not altered. See [Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
