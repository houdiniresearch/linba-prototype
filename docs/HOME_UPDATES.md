# Product home discovery rail

`components/home-updates.tsx` adds a secondary discovery rail to the instructor home. My training, reports, settings and participant pages retain their layouts. Existing LİNBA editorial artwork is reused in branded feature banners; no external artwork, release dates, ratings or rewards are invented.

The three carousel items describe implemented practice, activity and report features. They rotate every six seconds and wrap around; dots select an item directly. Rotation pauses on hover, keyboard focus, a hidden browser tab, open discovery dialogs, the parent workspace’s modal workflows or reduced motion. The rotating article is not an ARIA live region: modal isolation must not expose its background controls. No arrows or numeric counter are shown. View all opens a keyboard-accessible overview. Feature actions open the sole draft directly, offer a searchable draft picker when several exist, or open the reports list. The picker preserves the selected destination (practice or editor). Actions wait for the training list to load. Without a draft, preparation actions open Create training. At 1150 px the rail moves below the training area; at 650 px its sections stack. Loading skeletons follow the same structure. Copy is English in source with Turkish translations.

Social buttons use the colored LinkedIn, Instagram and YouTube marks and a theme-aware X mark, remaining inactive like the landing page buttons. Add verified destinations before enabling them.

## Feedback

`POST /api/feedback` requires the current authenticated account and same-origin validation. `lib/feedback.ts` validates category (`idea`, `issue`, `other`), a nonempty message up to 2000 characters and a client request ID. Ownership always comes from the session. Records are stored under SQLite kind `feedback`; the ID combines account ID and request ID, so retrying the same submission is idempotent and another account cannot collide with it. Success returns the saved ID. No feedback listing endpoint, external delivery, email or public review is created. Feedback can be read from the local records store for later product review.

The form preserves text after a failed save, prevents duplicate in-flight submits and shows confirmation only after a successful response. Modal closing restores focus to Share feedback.

## Validation

- `npm run test:feedback`: isolated database test for validation, ownership, persistence and retries.
- `npm run test:feedback:integration`: local HTTP test for authentication, saved data, retry, validation, cross-origin rejection and unsupported methods. Only its generated account, session and feedback are removed afterward.
- Browser verification covers carousel changes, all-updates and feedback forms, feature navigation, responsive layout, theme and locale.

## Header and sidebar follow-up — 20 October 2026

The sidebar integration row shows only its centered logos; the visible title was removed at the user’s request. Accessible integration names and waitlist actions remain. A small theme-aware fuchsia dot marks unread report notifications on the bell, with an accessible unread label. Opening the notification panel marks its displayed reports as seen; later incoming reports restore the dot. Read state is stored per account in this browser, keyed by training ID and completion time, with cross-tab synchronization. If storage is unavailable, read state works for the current visit. No external notification delivery or cross-device read service is implied.

Browser verification: unread indicator appears for a completed session, clears when opened, remains cleared after reload, and returns when another report arrives through the existing course refresh. TypeScript and product checks pass. Proof: `output/notification-refinement/unread.png`.

## Product background trial — 20 October 2026

The product home reuses `/landing/isometric-grid.svg` as a static, softly fading mask. Following the visual trial, the user requested the pattern only on Home: My presentations, Reports, Trash and their empty states have no pattern. The grid is spaced at 176 × 203.23 px, with separate low-contrast light/dark colors. On mobile it fades within the first 420 px. Cards retain opaque backgrounds. The decorative layer ignores pointer events and is hidden in forced colors and print. Styles live in `components/workspace-pattern.css`.
