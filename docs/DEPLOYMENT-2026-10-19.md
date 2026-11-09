# Website deployment — 19 October 2026

Cloudflare Pages project: `eaglepower`. Production branch: `master`.

- Production site: https://eaglepower.pages.dev
- Deployment URL: https://79965ee9.eaglepower.pages.dev
- Deployment ID: `79965ee9-9526-46d0-bcef-c6badbaa7953`
- Previous production deployment: `98d530ef-15f6-4152-9091-3993404cea72`

Deployed the verified Next.js static export in `out/`, including the homepage/about/contact/news updates, six management profiles, principal studio portrait, seventeen gallery photos and five videos. The corrected Pages API proxy function was also bundled and uploaded. Wrangler reported successful compilation, all 128 assets uploaded or reused, and deployment complete; a subsequent Cloudflare production deployment listing confirmed the new ID on `master`.

Pre-upload checks confirmed the export contains the latest names and photographs, no database/environment-file paths, and no files over the Pages upload limit. Edge proxy regression tests passed (3/3). Both production builds passed before deployment.

The downloaded Cloudflare configuration did not contain `API_ORIGIN`. The proxy deliberately returns unavailable when no valid backend is configured. Portal access, admission submissions, and inquiry forms require an authoritative HTTPS backend and that environment setting. This deployment does not certify those workflows or the backend as production-ready.

The live URL could not be fetched by the verification tools (DNS/access errors), so this records Cloudflare-confirmed deployment rather than a successful browser/playback smoke test. No custom-domain or DNS changes were made. Source had uncommitted local edits; deployment used `--commit-dirty=true`.
