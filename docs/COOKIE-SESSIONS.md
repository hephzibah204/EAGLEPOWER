# Persistent portal sessions

The portal restores the authenticated account from `/api/auth/me` after refresh or returning to the site. No login token or user profile is saved to localStorage. A short loading message appears while the server verifies the cookie; the login form appears when the session is missing, expired, deactivated or revoked.

- Normal sessions expire seven days after login. Executive sessions expire after 24 hours. Refreshing does not extend that deadline.
- The `eagle_session` cookie is HttpOnly, host-only, scoped to `/api`, SameSite=Lax, and Secure when `NODE_ENV=production`.
- Login responses return `session: true` and a user profile, without a JWT. Existing independently provisioned Bearer clients remain supported by authentication middleware.
- Unsafe cookie-authenticated requests, including login and logout, require `X-Eagle-Request: 1` and an allowed Origin. Browser API requests use the shared helper, including executive/reporting modules.
- Logout clears the cookie and increments the user's token version, revoking other current sessions for that account too. Password changes and administrative resets also revoke sessions. A failed logout request tells the user to retry.
- Administrator provisioning does not replace the administrator's session with the new account.
- Session restoration bypasses the credential-attempt limiter but remains covered by the general API limit.

## Hosting

Deploy both the updated Express backend and updated frontend/Pages function. Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `CORS_ORIGIN` to the exact HTTPS website origins (for example `https://eaglepower.pages.dev`). Configure Pages `API_ORIGIN` to the private institutional API's HTTPS origin.

Use the website's same-origin `/api` proxy in production. Do not set the browser's build-time API URL to an unrelated backend site: SameSite cookies and the site's CSP deliberately do not support that arrangement. Pages forwards Cookie, Origin, and the CSRF header and preserves Set-Cookie responses without caching them. Preview origins require explicit production CORS configuration.

Development loopback origins are allowed outside production, including the existing preview on port 4174. The development API URL retains the browser hostname so localhost and 127.0.0.1 cookies are not mixed.

Existing users must log in once after moving from the earlier browser-token implementation. Browser settings must permit first-party cookies.

## Verification

Isolated tests exercise login, refresh restoration without an Authorization header, expiry, logout/revocation, password changes, account provisioning, CSRF rejection, production cookie flags, edge cookie forwarding and frontend credential handling. Tests use an in-memory database and fabricated users, without contacting institutional services.

References: [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Cloudflare response headers](https://developers.cloudflare.com/workers/runtime-apis/headers/).
