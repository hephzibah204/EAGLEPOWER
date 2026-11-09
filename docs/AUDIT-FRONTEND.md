# Frontend workflow audit — 17 October 2026

Scope: Next portal route wrappers; PortalDashboard authentication, student/parent reporting, gradebook, attendance, finance and front desk API integrations; public contact/admission/newsletter handlers; report broadsheets and sharing. This is a source audit with focused lint verification, not an assertion that every workflow has passed browser E2E tests.

## Confirmed defects addressed

- Failed class-sheet loads fabricated roster rows with zero scores; saving could overwrite real marks. Removed fallback, cleared stale rows/class metadata and accepted valid empty responses.
- Attendance and score saving ignored non-success HTTP responses. These now report the server error instead of silently finishing.
- Switching classes/dates/students could allow a slower earlier response to replace newer data. Added request sequencing for gradebook, attendance and individual reports; abort obsolete terminal/annual broadsheet requests and clear stale print/report selections.
- Demo admission number ESE2009012 was the initial report selection and parent-registration child field. Removed both defaults; restore the authenticated student's/parent's reference before URL-tab early returns.
- Seed lesson-note examples were displayed as approved/reviewable real records before API data loaded. Initial state is now empty.
- Signing out left school/financial data in component state for a subsequent account. Signing out reloads the page after clearing credentials.
- Share buttons claimed to transmit verified report cards, but linked to an unsupported `adm` query parameter. Sharing now links to the report portal and tells recipients to sign in to their own account. Clipboard failure no longer reports success.
- Newsletter success claimed an active subscription although the server only stores a front-desk enquiry. Success now confirms receipt of the request.
- Gradebook, broadsheet and executive report controls now read the configured session/term from system settings. The configured database values must still be checked by the school administrator.

## Outstanding production gaps

1. Frontdesk role is offered in UI conditions, but the backend user role constraint does not support it and frontdesk APIs do not authorize it. Product decision required: introduce and migrate a dedicated role, or remove the unsupported frontend role and use an existing authorized role. Do not simply grant unrelated finance/teacher permissions.
2. Parent accounts are administrator-provisioned by backend policy. Unused registration handler/state remain in the frontend; do not present public self-registration without a verified child-linking and invitation workflow.
3. Newsletter collection has no subscription list, double opt-in, unsubscribe or delivery integration. It is currently an interest enquiry only.
4. Frontend list loading caps the pupil roster at 100 and invoices at 50/100 without user pagination. Large schools can see incomplete records, search results and pickers. Implement pagination/search backed by the API and test larger fixtures.
5. The dashboard fetches many unauthorized modules for every role and mostly catches failures silently. Add role-aware data loading and explicit unavailable/error states; expired credentials need a consistent session-expiry flow.
6. Session defaults and selectors now point to 2026/2027. Verify current institution configuration; legacy class/form defaults still require review.
7. Executive requests now sequence responses and clear prior module data on refresh. Browser tests must still verify partial failures, empty states and all term/session transitions.
8. Bulk/single report generation, print layouts, report access by each role, payment checkout cancellation/verification, payroll disbursement and homework submission need real browser E2E evidence with isolated test data. No live payments, messages or production records were mutated for this audit.
9. Local-storage reads are not consistently protected against storage-denied environments; authentication/user hydration can fail in restrictive browsers. Stored user claims are UI hints and must never replace server authorization.
10. Existing lint warnings include unused registration UI state, effect state synchronization, render-time dates and a setter captured before declaration. Lint exits successfully but warnings are not a production certification.

## Verification

Focused oxlint checks passed with warnings on the edited portal/report/public components. Main task owns full production build and backend/security checks. Existing user changes in PortalDashboard and BroadsheetView were preserved. No client import of src/data/portalDbData.json was found; build-time database export remains a separate deployment concern owned by the main audit.
