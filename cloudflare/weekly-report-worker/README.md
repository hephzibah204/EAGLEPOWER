# Weekly report data worker (interim overlay)

`worker.js` serves `GET /api/executive/weekly-report-data` on
eaglepowerschools.com.ng (apex + www) from a Cloudflare Worker named
`eaglepower-weekly-report`, deployed 2026-11-26. It exists so the WhatsApp
bot could read production aggregates immediately, without waiting for a
full portal redeploy.

- Bindings: D1 `eaglepower-data` as `DB`; secret `WEEKLY_REPORT_KEY`
  (same value as the Fly secret on `eaglepower-whatsapp-bot`).
- The embedded baseline is a trimmed copy of `src/data/portalDbData.json`
  (students/staff/classes trimmed to the fields the report uses). If the
  roster changes materially, regenerate with
  `gen_worker.py` (kept in the goal workspace) and redeploy, or retire
  this overlay.
- RETIRE when the portal's own Pages deployment ships the equivalent
  endpoint from `functions/api/[[catchall]].js` (same branch): delete the
  two worker routes and the script, in that order.
