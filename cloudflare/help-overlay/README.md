# EaglePower Help Overlay (live since 2026-11-26)

Cloudflare Worker `eaglepower-help-overlay` on routes
`eaglepowerschools.com.ng/help*` and `www.eaglepowerschools.com.ng/help*`.

It injects two help sections (form-teacher reassignment when the form
teacher has no phone; admin password reset when a teacher forgets her
password), a short FAQ, and mobile legibility CSS into the live /help/
page at the edge. The Pages deployment itself is untouched.

Why: the help update was needed immediately and the working source on
the PC was ahead of this repo, so rebuilding from here would have
rolled the live site backwards.

To retire it: merge `docs/help-page-additions-2026-11-26.md` into
`src/app/help`, deploy from the up-to-date tree, then delete the Worker
and its two routes in the Cloudflare dashboard (zone
eaglepowerschools.com.ng). The Worker passes pages through unchanged
if the served HTML ever contains its `eph-help-v1` marker.
