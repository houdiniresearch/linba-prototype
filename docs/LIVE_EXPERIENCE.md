# Live training reliability — 19 October 2026

## Presentation agents and instructor layout — 21 October 2026

The editor Agents panel lists Learning, Engagement and Assessment, in that order. The live instructor sidebar uses the same roster as a read-only information tab; it has no agent picker, commands, result widgets or activity controls. The roster contains only agent names and clear role descriptions; learning-agent settings are available through the editor’s general Settings action below Practice. Team avatars and invitations remain in preparation and are omitted from the live header; live mode also skips the team resource polling.

The live sidebar separates Live overview, Questions and Agents with accessible tabs. Live overview is the initial view, showing Confusion spike and live activity results. The Questions badge counts only unaddressed escalated/manual questions. Addressing a question clears it from that count. Panels stay mounted so switching tabs preserves filters and disclosures. Arrow keys, Home and End follow the [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

Confusion spike is a density signal over existing semantic question groups: at least three distinct live question records from at least two participants in the preceding five minutes, scoped to this presentation and its start. Direct-to-instructor manual questions, addressed records, follow-up questions and invalid/future timestamps are excluded. The initial threshold is kept in `lib/live-insights.ts` for later product tuning. It indicates concentration, not a measured learning failure. Review opens the matching question group; clearing the topic restores all questions and panel focus. An active warning remains accessible from other tabs through a compact strip. Its status announcement follows [WCAG status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) without stealing focus.

Assessment displays the current or preceding activity, with a picker for reviewing another activity. Polls show the saved response distribution; open questions/scenarios show participant responses. Counts use the latest saved submission per participant for the selected slide and presentation. These are live recorded results, not fabricated accuracy scores or a new semantic grading model. Agent descriptions are confined to the read-only Agents tab. Topic review stays in Questions and result inspection stays in Live overview.

The view uses the existing live reader; incoming records update without navigation or reload. Connection failures show the last confirmed state and pause slide actions, retaining the interruption notice. No new model calls or agent orchestration were introduced.

The live header is 64px on desktop. Elapsed time comes from the actual presentation start timestamp; participant totals retain their existing live resource. On phones, previous/next controls retain slide navigation while the thumbnail rail is hidden, and the assistant follows the slide area. The projection action becomes an accessible icon button to keep the End presentation control visible.

Validation: typecheck and production build passed; 14 live-insights, live-sync and product UI tests passed. Disposable local browser QA covered the warning-to-question link and topic reset, persistent warning strip, agent selection, Engagement slide activation, result picker, keyboard tabs, no-data states, 390px/1280px/1440px layouts and light/dark themes. A fourth response updated the visible count and poll distribution without reload. Browser console had no errors. QA records and browser cookies were removed.

## Scope

Instructor live controls, participant chat/activities and the token-scoped projection now share a live reader. Other resource consumers retain their existing loading behavior.

- Keep the last confirmed view on a failed refresh. Show a restrained inline interruption message with the time it was received, automatic retry and a manual Reconnect action. Healthy updates take no extra visual space.
- Only clear the interruption after a successful read. Going online and returning to the browser tab trigger a fresh read. Reads have an eight-second deadline and share an in-flight request; cancelled reads cannot overwrite newer state or a confirmed mutation.
- Keep typing available during an interruption. Pause participant submissions and instructor slide/end controls until state is confirmed again. Do not queue or automatically submit answers.
- Projection explicitly separates waiting, live slides and completion. A waiting session no longer projects its first slide as though it were live. Participant follow-up/expired access remains based on the real session access period.

## Participant answers

Each unsent answer belongs to its activity ID. Moving to another activity does not reset it. Returning restores the text or selected poll option. Closed activities appear as read-only, expandable Unsent answers; only the current live activity can be submitted. Successful submission clears only that activity's matching draft and immediately confirms the saved response. Failure keeps the draft and associates the error with the correct activity, even if the instructor has moved on.

Drafts are held in the open page's React state. They are not durable storage: leaving, reloading or closing the page clears them. The UI does not promise reload recovery. Submitted answers retain existing persistent storage and server-side active-slide validation. After completion, unsent answers are explicitly identified as excluded from the report.

## Validation

- `node --import tsx --test tests/live-sync.test.ts tests/activity-library.test.ts tests/product-ui.test.ts`: 12 tests covering single-flight refresh, cancellation, timeout/retry, draft identity, submitted answer exclusion, completion and existing product behaviors.
- TypeScript and production build.
- Browser checks use a disposable course, participant and responses: waiting → live → completion, text and poll restoration, successful submission, offline/recovery on participant/projection/instructor, disabled stale actions and responsive layouts. All disposable records/files are removed afterwards.
- No paid model call, microphone request or real training is needed for these checks. End-state testing sets only the disposable fixture status, rather than generating a report.

## Design references

- [NN/g — Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/): make the last confirmed state and interrupted updates distinguishable.
- [W3C — ARIA22 status messages](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22): announce connection changes without moving focus. This is a design/implementation reference, not a claim of WCAG certification.

## Presentation clock and breaks

The elapsed clock sits in the instructor top bar beside **Ara ver / Devam et**. Pausing retains the live presentation and its slide, and persists `pausedAt`; resuming adds the break to `pausedDurationMs`. Requests are idempotent. Reloads and teammates derive the same elapsed time from those timestamps. Completing a presentation during a break finalizes that break, and reports exclude paused time. Starting a presentation or refreshing the showcase resets the clock. These controls do not stop participant questions or end the presentation.

Green live dots were removed from shared Live badges, the instructor stage, participant stage and healthy connection markup. An interrupted connection still has its warning and recovery controls. Browser QA covered light/dark themes, 1024px and 390px layouts, pause → reload → unchanged timer, resume → advancing timer, and a new account created through the real demo button. Both 11-slide decks and their completed reports were visible; no console errors were recorded.


## Sidebar refinement — 21 October 2026

The quiet Confusion spike state is a compact section showing the five-minute window and one sentence. An actual concentration of questions receives the amber warning surface with its topic, factual counts and a direct link to that question group. The warning shortcut is shown on Questions; the Agents view remains informational.

Assessment separates the presentation-following mode, selected activity context, participant response coverage and answer distribution. The default **Sunumu takip et** follows the current/preceding activity. A manual selection persists across slide changes until the instructor chooses follow mode again. Participation uses saved responses per participant and displays a separate neutral progress track; poll option shares retain the brand color. The largest response group receives text emphasis, with no implication that it is correct. Written answers show participant initials, names and submission times, with a disclosure for the remaining response count.

Validation: 10 live-insights, product UI and showcase tests, TypeScript and production build passed. Disposable browser QA checked the warning → filtered questions → all questions route, manual result selection surviving slide navigation, all 21 written responses, zero-response state, keyboard tab navigation, no interactive controls in Agents, 1024px and 390px layouts, light/dark themes and no console errors. Screenshot evidence is under `output/live-panel/`.

Design references: [NN/g — Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [Carbon — Data visualization overview](https://www.carbondesignsystem.com/building-blocks/data-visualization/overview).
