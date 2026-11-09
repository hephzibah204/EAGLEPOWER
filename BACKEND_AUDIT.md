# Backend audit — 17 October 2026

Release remains blocked. This source audit and isolated regression suite do not prove all backend workflows or production integrations.

## Confirmed repairs

- Fee checkout rejects unauthorized roles and enforces invoice ownership. Payment verification validates provider success, reference, NGN currency, amount and invoice metadata, then checks idempotency and updates balances atomically after the provider request. Invalid money and overpayments cannot alter the ledger.
- Missing payment credentials and provider failures no longer become simulated success. Simulation requires explicit nonproduction configuration. Payroll claims batches before awaiting the gateway, preventing concurrent double submission, and records real submissions as Processing/Queued rather than settled.
- Payslips deny student/parent access and teachers without the matching staff identity. Empty guardian emails no longer link unrelated families; phone inference requires stronger matching.
- Environment loading occurs before modules capture secrets or open SQLite. Password changes and administrator resets increment token versions, invalidating earlier sessions.
- Lesson ownership now resolves active staff identity through staff number. Coinciding login/staff IDs and duplicated staff names no longer confer ownership of draft notes.
- New application tracking tokens use cryptographic randomness. Admission status/enrollment changes are atomic, reject nonexistent classes, and use configured academic session/term for enrollment and invoices. Automatic new portal credentials are random secrets instead of shared published passwords; administrators must provision usable credentials through the managed reset workflow.
- Build-time private data export is disabled. Backup failures are explicit, and destructive maintenance/testing paths require deliberate isolated-test configuration.

## Unfinished workflows and required proof

1. **Payroll settlement:** no complete webhook/status reconciliation handles pending, failed, partial, reversed or uncertain transfers. Do not treat queued items as paid. Salary defaults and bank recipient validation require institutional approval before real disbursement.
2. **Family and faculty authorization:** parent relationships still rely partly on inferred phone/email identifiers rather than an explicit verified parent-child relation. Faculty permissions are broad across classes. Define and test the intended per-class and per-family policy across all routes.
3. **Lesson review:** reviewer privilege is inferred from free-text staff job titles, and the academic review/approval lifecycle needs role-based browser tests. Legacy draft notes with missing or incorrect staff links need administrator repair; ownership is deliberately not guessed from names.
4. **Admissions and onboarding:** random initial secrets prevent common-password takeover but do not implement invitation delivery or verified password setup. Review existing users created with historical shared credentials. Repeat enrollment matching still depends on guardian/name fields; an explicit application-to-student relationship would make idempotency robust across later profile edits.
5. **Academic lifecycle:** verify marks validation, class subject membership, grading scales, report publication/access, annual promotion, term locks and configured period against real school policy. Academic session defaults now point to 2026/2027; confirm this remains aligned with the school calendar.
6. **AI/homework:** external provider consent, data minimization, provider access, fallback quality, assignment/student ownership and teacher approval require integration tests and product review. Deterministic fallback is not equivalent to externally generated evaluation.
7. **Operational safety:** validate fresh installation/migration, SQLite persistence/concurrency, restore procedures, audit durability, request limits, CORS and trusted-proxy settings in the actual host environment. Known historical passwords/secrets and tracked private database files require separate cleanup and rotation.
8. **Front desk:** UI references a dedicated role that is not supported by the database constraint. Choose a dedicated permission policy and migration or remove that UI role; do not grant unrelated financial permissions as a shortcut.

## Verification

`node --test tests/edge-proxy.test.mjs server/test/*.test.js` runs without the institutional database or real gateway requests. The added enrollment/lesson tests cover ID-domain collisions, password token revocation, unpredictable application references, rejected unknown-class admission, configured academic periods and repeat admission. Financial regressions cover unauthorized access, invalid amounts, provider failure, payment races and concurrent payroll submission. Gateway responses are mocked; real transfer settlement is not verified.

No production data was deliberately changed by these tests. The checkout already contained modified institutional databases before the audit began.
