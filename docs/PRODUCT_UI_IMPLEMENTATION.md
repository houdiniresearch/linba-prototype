# Product UI implementation

Implemented on 18 October 2026. This applies the existing landing brand to working product screens through shared controls, typography, spacing, quieter surfaces and consistent agent terminology. Training documents and participant conversations remain separate from interface translations.

## English route and source policy

| Purpose                       | Canonical URL                                         |
| ----------------------------- | ----------------------------------------------------- |
| Marketing preview             | `/explore`                                            |
| Waitlist and agent experience | `/login`                                              |
| Beta tester sign-in           | `/login?mode=signin`                                  |
| Participant access            | `/join?code=123456` or `/join?training=<id>`          |
| Training preparation          | `/training/<id>`                                      |
| Practice                      | `/training/<id>/practice`                             |
| Preview and report citations  | `/training/<id>/preview?slide=<original-page-number>` |
| Instructor live controls      | `/training/<id>/live`                                 |
| Scoped projection             | `/present/<id>?key=<token>`                           |
| Report agent                  | `/report-agent?report=<id>`                           |

Old Turkish paths permanently redirect. Legacy `mod`, `egitim`, `kod` and `rapor` query parameters normalize to English equivalents. Existing saved links remain usable, including projection tokens. New links and QR codes use canonical URLs.

UI source messages are English. Turkish translations live in `lib/locales/tr.ts` and `lib/locales/tr-product.ts`; legacy message keys support stored responses. Training content and language-specific AI conversation fixtures are intentionally not translated. API names such as `rehearsal` and `report-assistant` are already English and remain compatible.

## Applied changes

- **Shared system:** `app/product.css` uses the existing theme tokens, focus states, readable type, 44 px primary controls, consistent modals, and responsive layouts. Work surfaces keep decoration restrained.
- **Dashboard:** real first-page thumbnails with an authenticated image endpoint and a fallback. A lightweight `coverPage` field preserves the compact course list. Cards use status-appropriate destinations; duplicate promotion and onboarding blocks are removed from returning-user views.
- **Creation:** file and training name come first. Learning-agent access and automatic answers are secondary settings. Drop handling, validation, selected-file details and replacement are supported without losing valid form input on errors.
- **Editor:** one primary and one contextual activity entry. The activity library provides localized search across the three supported types, a live participant preview, editable questions/options and a persistent save footer with the insertion position. Bespoke miniature response diagrams distinguish poll, written question and scenario. The activity agent drafts from the selected slide for instructor review. Poll answers have separate rows and add/remove controls. Narrow screens expose the tools panel with initial focus, Escape, focus return and keyboard containment. Original document ordering is preserved.
- **Practice:** audience, practice and feedback phases; six reusable fictional portraits with persistent agent identities; connected session time, microphone mute, actual playback state and full-screen source slides. Selected profile and voice controls stay in the audience brief, while all agents participate. Emotion is explicitly unconfigured pending the user’s behavior specification. Technical usage is collapsed by default. Feedback remains about the instructor’s performance. See `docs/PRACTICE_WORKSPACE.md` for asset provenance, exact prompts and timer boundaries.
- **Live controls:** the actual training state controls the view. Draft and ended trainings cannot display a false live state from a URL alone. Existing participant, projection and end-session controls remain distinct.
- **Participant:** waiting, live, follow-up and expired access are distinct. The exact access boundary and 0-day setting are tested. Conversations remain private, source slides can be opened, and activity arrival explains the switch without clearing the conversation draft.
- **Reports:** sourced questions produce topic signals. Unsupported/unanswered questions remain in a review area; addressed records no longer count as pending review. Topics open their underlying question group. Each citation links to the original source page. Access labels use the remaining period rather than the configured total.
- **Report generation:** future reports separate grounded questions from records requiring review. The prompt forbids invented learning scores and recommendations derived solely from unrelated questions. Historical generated report text is preserved; it is not silently regenerated. Recommendations are expandable with their review context.
- **Report agent:** consistent naming, student-support and future-training prompts, selected-report context and evidence links. No changes to conversation isolation, retry semantics or persistence.
- **Settings and states:** profile/account information is separate from agent availability; model details are collapsed. Existing loading and error infrastructure is retained and styled consistently.

## Validation

- TypeScript and production build pass.
- Practice clock/portrait tests: 4; activity search/localization tests: 3. Practice API integration verifies stable portraits through voice edits and persisted duration/feedback without model calls.
- Activity browser check on a disposable training: added a poll, changed it to a written question, saved and reloaded; data persisted and the fixture was removed. Desktop/mobile library search, preview updates, keyboard focus and the mobile tools-panel handoff were checked.
- Domain tests: 14; product access/insight/localization tests: 3; report conversation tests: 7.
- Landing, header, public waitlist and canonical/legacy route tests pass.
- Report-agent API integration passes with model calls disabled, covering authentication, ownership, report isolation, validation and origin checks.
- Route tests verify thumbnails remain authenticated, compact course lists do not expose display keys, and scoped projection images still work.
- Browser checks: dashboard and settings in English/light and Turkish/dark; editor and practice at 390 px; report agent at 768 and 390 px; adding poll options; Escape/focus return; report-topic disclosure and citation selecting the correct original page. No horizontal overflow in the inspected responsive views.

A new microphone session, paid voice generation, a physical phone keyboard and the full document conversion workflow were not rerun for this UI pass. Existing records were not edited during visual inspection. Screenshots are local review artifacts under `output/product-ui/`.
