# Two authored showcase presentations — 21 October 2026

Every new demo account receives two presentation families in **Örnek sunumlar**. Existing demo accounts receive the pack on their next authenticated workspace read. Existing presentations, reports and account details are retained.

| Presentation | Material theme | Content pages | Native activities | Participants | Questions | Activity responses |
| --- | --- | --- | --- | --- | --- | --- |
| Müşteriyi Anlamak | Light | 8 | Poll, open question, scenario | 20 | 9 | 51 |
| Pazar Analizi | Dark | 8 | Poll, open question, scenario | 24 | 12 | 63 |

Each family has a working presentation and a separate completed report snapshot. The light presentation is editable in preparation; the dark presentation is live. Both use their own page images, extracted text, notes, sources, questions, participant records and varied written activity responses. Each has 11 items in its slide flow. The completed reports contain 42-minute and 51-minute example sessions respectively.

## Authored material

`lib/showcase-content.ts` defines the slide content, activity prompts, response distributions, written answers and curated report summaries. `scripts/build-showcase.ts` builds editable PowerPoint decks with native tables and charts, PDF exports and 2400px page images. Cover photography was generated for LİNBA and is kept in `public/showcase/`. Existing brand logos are used without alteration.

Content sources: [Y Combinator — Practical Design: User Observation](https://www.ycombinator.com/blog/practical-design-user-observation/) and [SBA — Market research and competitive analysis](https://www.sba.gov/counseling/plan-your-business/). Source links and image provenance are in slide notes. Market figures are explicitly fictional case assumptions, not claims about the actual Turkish market. The report summaries are curated from the synthetic source records and use `source: "showcase"`, `ai: false`; the UI does not label them as an application-generated AI report.

## Data boundaries and repeatability

`lib/showcase-install.ts` installs the pack from bundled `public/showcase/materials` assets. Demo sign-in waits for the complete installation before opening the workspace. Auth and presentation-list reads also backfill older demo accounts. A per-account installation marker and shared in-flight job prevent duplicates, and later edits or trashed examples are respected. File copying finishes before a synchronous transaction publishes the four presentation/report records; failures clean up unpublished files.

`scripts/install-showcase.ts` calls the same installer and requires an explicit existing teacher account ID. It writes an installation manifest with presentation and report IDs to `output/showcase/installed.json`. The builder updates the bundled material assets as well as the editable exports.

All synthetic participant/question/response IDs start with `showcase:<courseId>:`. No participant login accounts, emails or invitations are created. `seedShowcaseRecords` never replaces a real participant record. `showcase` metadata is assigned by the server installer, not accepted through presentation-editing requests.

Only these example presentations expose **Örnek oturum verileri · Yenile** in the live sidebar. This refreshes synthetic records and restarts the example timer, retaining the current slide and all real participant records. Starting a draft example also refreshes its sample timestamps. An example can therefore show its Confusion spike again before a presentation without weakening the real time window for ordinary sessions. Completed report records remain unchanged. Reopening a completed example creates the usual working copy and populates only its own sample records.

For examples, the results picker can initially select the first seeded activity even on the cover slide. Ordinary presentations retain the rule that results follow the current or preceding activity.

## Local commands

```sh
node --import tsx scripts/build-showcase.ts
node --import tsx scripts/install-showcase.ts <teacher-account-id>
node --import tsx --test tests/showcase.test.ts tests/live-insights.test.ts tests/presentation-workspace.test.ts
node --import tsx --test tests/showcase-install.test.ts tests/presentation-clock.test.ts
```

The material builder uses the Codex workspace Node/Python runtime, PptxGenJS, Sharp, LibreOffice and Poppler. `LINBA_WORKSPACE_NODE_MODULES` and `LINBA_PYTHON` can override the bundled dependency paths. No model API calls are made when installing or refreshing sample records.

## Verification

All sixteen content pages and the six activity pages were rendered and visually reviewed. Editable decks and full PDFs contain eleven pages each. The app uses 2400px material images and native activities. Browser QA covered the two-card folder, light preparation view, starting the light example with fresh sample signals, dark live view, Refresh, both report summaries and report activity records. The light example was returned to draft after QA; the market example remains live. Console showed no errors. Typecheck, production build and twelve targeted tests passed. Re-running installation retained the same four presentation/report IDs and record counts. Temporary local QA authentication was removed after verification.
