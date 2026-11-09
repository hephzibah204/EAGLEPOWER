# Security checklist review — 21 October 2026

Verdict: **not ready for unrestricted production portal use**. Checkmarks supplied in a request are not verification evidence. Changes here are local and have not been deployed.

## Implemented in this pass

- Exact configured HTTPS origins in production CORS; arbitrary pages.dev sites, wildcards and local development origins are rejected. Missing production configuration permits no browser origins. Configure CORS_ORIGIN for the actual website.
- Browser sessions use HttpOnly cookies, with Secure enabled in production and SameSite=Lax. Refreshing and returning from a payment redirect restore the account through `/api/auth/me`. Legacy localStorage tokens and cached profiles are removed. Normal sessions last seven days; executive sessions last 24 hours. Logout and password changes revoke sessions. Cookies do not make successful XSS harmless, and cookie mutations enforce a custom request header plus exact origin checks.
- Production API endpoint overrides from localStorage/window globals are disabled to avoid redirecting credentials. Build-time API configuration remains supported.
- Environment variants are ignored with explicit example/sample exceptions. Git currently tracks only server/.env.example among environment files. Ignoring files does not remove historical secrets or institutional records from Git history.
- Runtime errors omit raw exception messages/provider payloads outside explicit development. Audit descriptions omit freeform PII and sensitive structured values; actor IDs and IPs remain restricted security records. WAF logs omit raw URLs and safely reject malformed percent encoding.
- Parents/students cannot read whole-class attendance or modify staff clocks. Teachers can clock only their own active linked staff record.
- Parent homework/progress queries no longer match unrelated children through blank guardian emails. Parent homework submission checks linked student access.
- Homework creation resolves active linked staff identity and rejects teacher impersonation; arbitrary staff fallback was removed.
- Production CSP removes unsafe-eval and local development connections; static hosting restricts connections to self and Cloudflare telemetry. Inline scripts remain necessary for the current static Next.js export, so CSP is not a complete XSS defense.

## Controls requiring more work or qualified status

1. **RLS:** SQLite has no native row-level security policy facility. Existing route-level checks are required; broad teacher access still needs explicit class/subject assignment enforcement. A database migration would be needed for native RLS.
2. **Email verification:** syntax validation exists; email ownership challenges/invitations and verified guardian relations are not implemented. Matching contact strings is not proof of identity.
3. **SQL:** inspected routes use bound parameters for values; this review is not proof that every dynamic identifier/query across maintenance and legacy code is safe.
4. **Permissions/admin:** backend role guards exist and several object access flaws were fixed. Teacher gradebook (`server/src/routes/exams.js`) and homework grading (`server/src/routes/homework.js`) still need assignment scoping; homework scores also need finite/range validation. UI guards alone are not authorization.
5. **Passwords/secrets:** bcrypt and server JWT secrets exist, with production secret validation and session revocation. Staff provisioning still permits a weaker six-character password policy than auth registration. Historical repository secrets/data need separate cleanup and credential rotation where applicable.
6. **Validation/uploads:** Zod and body-size validation cover many routes. No general upload security certification was completed; any future upload endpoint must enforce type, size, content and storage rules server-side.
7. **Debugging/logs:** runtime error details are masked outside development. Production must set NODE_ENV=production. Historical audit rows, maintenance scripts and retention/privacy policy still require review.
8. **Rate limits:** API/auth limits exist but are process-memory based; multi-instance deployments need shared limits and a verified proxy trust configuration.
9. **Webhooks:** forwarding x-paystack-signature is not verification. No complete signed Paystack webhook/reconciliation workflow was found. Payment/payroll settlement remains a release blocker.
10. **XSS:** React escaping, input validation and CSP reduce risk; no claim of complete prevention. Review rich HTML/report output separately.
11. **Dependencies:** production npm advisory checks for root and server reported zero known vulnerabilities on this date. This does not certify all development, optional bot or future dependencies.
12. **Claude review:** Claude Code/Anthropic Security Review is not available in this session. An independent agent reviewed the code; no Claude certification is claimed.

## Validation

All 29 isolated Node regression tests passed with an in-memory database; institutional database contents are not used. Coverage includes real HTTP cookie login/refresh/logout, CSRF, frontend session recovery, CORS, logging, access controls, session revocation, finance and edge proxy checks. Full frontend lint passed with existing warnings. See the session result for final production build status.

Existing deployment/backend configuration and the remaining issues in PRODUCTION_READINESS.md continue to apply. Do not publish a production-readiness claim from this checklist.
