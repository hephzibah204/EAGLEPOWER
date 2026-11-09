# Deployment and optional bot audit — 17 October 2026

The project is not yet certified for production. Code changes in this audit are local and have not been deployed.

## Changes

- Replaced the Cloudflare Pages API mock with a backend proxy. The former implementation accepted hardcoded administrator credentials, issued unsigned tokens, returned private bundled data without enforcing authorization, and acknowledged writes held only in memory. The proxy requires `API_ORIGIN` set to the HTTPS origin of the real institutional API (for example, `https://api.example.org`, with no path). An absent or invalid setting returns HTTP 503. Origin outages and redirects return HTTP 502. Origin authentication and authorization responses pass through. API responses are not cached.
- Removed the fixed Docker Compose JWT signing key. Set a unique strong `JWT_SECRET` in the deployment environment before starting Compose. The API origin must also use the same intended identity configuration.
- Excluded local environments, database files, backups, WhatsApp session credentials, dependencies, and previous builds from Docker contexts. The main image runs as the unprivileged Node user on Node 24.
- Added CI installation, lint, isolated security regression tests, both frontend builds, and high-severity production dependency audit checks.
- Disabled the optional WhatsApp bot in production before its database modules load. Development command handling now ignores group/broadcast senders, avoids logging message contents, binds direct clock-in/out to the sender's registered staff profile, rejects inactive/empty-digit staff matches, and rejects invalid attendance and score values.
- Removed universal role passcodes and passwordless frontdesk login. Role login now requires both a registered staff phone and the linked user's password. Admission numbers alone no longer grant student sessions.

## Required before launch

1. Configure and deploy a persistent real API; set Pages `API_ORIGIN` to its HTTPS origin and perform end-to-end role tests against it. Pages alone no longer pretends to provide database persistence.
2. Remove private institutional database snapshots from all publicly served frontend assets and generated output. Review any previous deployments and repository access; database and backup files are already tracked in Git. Ignoring Docker copies does not remove Git history or previously published data.
3. Replace credentials exposed by historical source code, demo users, or institutional snapshots, including JWT secrets and privileged passwords. Confirm production bootstrap does not recreate known accounts.
4. Validate a fresh production database, migrations, persistent volumes, backup restoration, and the configured timezone. No real production infrastructure or restore exercise was available in this local audit.
5. Keep the WhatsApp integration disabled. It contains duplicated backend code and independent database snapshots, has no production-safe deployment contract to share authoritative data, and its container does not declare all imported backend dependencies. Remaining conversational authorization, account revocation/session handling, class-level teacher restrictions, homework submission ownership, payment atomicity, and third-party messaging consent/delivery must be audited and repaired before re-enabling it. Current score commands also default to an obsolete academic session and term. The guard is intentional and must not simply be removed.
6. Resolve all failed CI checks and dependency security findings before release. This audit does not claim that a successful syntax check proves production readiness.

## Verification

`node --test tests/edge-proxy.test.mjs`: 3 tests passed, covering invalid/missing API configuration, authenticated mutation forwarding, preservation of upstream authorization failures, stripped spoofed proxy headers, redirects, and upstream failures. All four modified bot modules passed Node syntax checks. The production bootstrap was executed and verified to exit before importing its database or connecting to WhatsApp. Container builds and real deployments were not performed.

The Pages function already had local edits before this audit. A temporary copy was attempted before replacement, but the tool's temporary location was not retained across calls. The replacement removes the insecure mock implementation; review its diff against the existing Git version before committing.
