# Presentations and report clarity — updated 20 October 2026

## Library

The library is named My presentations / Sunumlarım. It shows one card for each reusable presentation, prioritising a live use, then the latest draft, then the latest completed use. The separate Training sessions picker, card footer and session numbers have been removed. Completed uses remain independently accessible from Reports, distinguished by completion date and 24-hour time in Europe/Istanbul.

Opening a presentation after a completed use automatically resumes its editable workspace. No reuse or report button is shown in the editor. An existing draft or live use is resumed; otherwise the latest completed version prepares one draft automatically. Reports, participants, questions and practice records are never merged.

Search/date filtering occurs before selecting a family's displayed record, so an older match can be found. Folder counters count presentation families rather than uses. Trash is excluded from the active library.

Search, group and date preferences survive opening an editor and returning in the same browser tab. These preferences use account-scoped sessionStorage; no course records, documents or credentials are stored there. Unsupported/blocked storage falls back to normal in-memory controls. This is not cross-device preference synchronisation.

## Reports

- Desktop retains a table. Mobile uses a flat list. Both show creator attribution, completion date and 24-hour time, learning-agent access and a direct opening action; start dates and session numbers are removed.
- The report agent header and sidebar identify a report by its presentation name and completion timestamp. Switching reports switches that identity; the existing chat/report-panel behavior remains.
- Report details start with duration (for example, 1 hour 35 minutes / 1 saat 35 dakika) and completion date. Missing or invalid timestamps show Not recorded rather than an invented duration. A record-grounded summary follows, then real counts, learning signals and source records. Section navigation supports the full report and its embedded panel.
- No success scores or inferred learning outcomes are added. Unsupported questions remain distinct from evidence of a learning gap. Suggested prompts use participant terminology.

## Validation

- New session-library tests cover family aggregation/current-session priority, all-session reachability, legacy records, Trash exclusion, older date matches, non-mutating sorting and malformed saved view preferences.
- Existing training-session and report-assistant tests cover ownership, separate records, retry idempotency and real aggregate calculations.
- TypeScript, production build and browser checks: a disposable family with two same-day reports plus live/draft sessions, session selection, repeat creation, editor/back filter restoration, mobile report action access, report switching, embedded section navigation/focus and preserved unsent report-chat text. TR/EN and theme layouts are checked with disposable records.
- Test records, their material copies, group and repeat-request records are removed afterwards. No paid model request or real training mutation is needed.

## References

- [GOV.UK summary lists](https://design-system.service.gov.uk/components/summary-list/): keep session metadata visibly associated with its label; retain a table for comparable desktop records.
- [Carbon data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines): keep row actions discoverable on touch devices; responsive behavior should preserve usable actions.

## Report list visual refinement — 20 October 2026

The report list shows the creator's shared profile avatar beside their name. Completion date and 24-hour time appear on one line with a quiet separator. The desktop table uses a distinct content surface, balanced column widths, compact rows, visible keyboard focus and a subdued access state (mint while access is active). At 960 px and below it becomes a flat list preserving avatar, creator, inline date/time and access. Each row opens its report; the duplicate mobile opening action is removed.

Browser verification covers TR/EN, light/dark, desktop/tablet and 320 px mobile layouts, real navigation with disposable records, and checking date/time alignment and cell overflow. Existing report calculation and access behavior is unchanged.


## Report detail tabs and reusable workspace — 21 October 2026

Report detail now has actual Overview, Questions and answers, and Activity results tabs. Only the active panel is visible. Arrow keys, Home and End move and activate tabs, following [WAI-ARIA's tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Question topic links reveal and expand their evidence group; direct hash links and Ask Linba's embedded report navigation remain supported. Panels retain disclosure state across switches. The overview puts real record totals first, with summary and learning signals side by side where space allows. Reports without question/response records show the branded empty state instead of an AI paragraph unsupported by records. Metadata includes the creator avatar, completion timestamp and duration.

The presentation editor uses **Practice with AI** and **Present**, with no Completed, Use presentation again or Open report controls. Completed uses remain accessible through Reports. `POST /api/courses/[id]/workspace` resumes the current family workspace or creates one editable version from the latest completed version. A transaction checks again after material copying, preventing concurrent teammate opens from creating duplicate workspaces. Creator, original creation date, materials, activities and notes are retained; report content, participants, responses, practice and access credentials are independent. Finishing a live use opens its report automatically. Reopening the presentation from My presentations resumes its editable workspace.

Validation covers real tab visibility, keyboard switching, standalone and embedded evidence/source links, empty reports, mobile layout, material-copy failures/retries, concurrent owners/teammates, latest-version resumption, unrelated-account denial and report immutability. Browser checks add an activity to a previously completed presentation and open its practice setup. HTTP checks start its editable version without making paid model calls.

## AI report preparation and recovery — 21 October 2026

Completing a presentation publishes its report and immediately opens it. The AI summary is scheduled with Next.js `after`, rather than blocking the completion response. Follow-up questions schedule report preparation without delaying their own response for a second model call. Saved question/response totals and tabs are available throughout.

The persisted report state is pending, ready or error. Pending summary/recommendation placeholders explain that participant records can already be explored. The existing five-second report polling replaces them with the completed summary without a reload. Failures preserve source records and any previous summary, with a retry action; older count-only reports can request their first AI summary. Empty reports skip unnecessary model calls. A generation ID prevents superseded output overwriting a newer report, and repeated requests share one in-process job. A stale pending state becomes retryable after 90 seconds, including after a worker restart. The existing model request timeout is 45 seconds.

Tests use a controlled generator to check pending visibility, duplicate suppression, failure/retry, stale-worker recovery, source-record retention and late-response protection. Browser QA used only disposable records to verify pending → ready updates, accessible activity records during preparation and the enabled retry control. No paid model call was needed for these checks.
