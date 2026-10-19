# Product home discovery rail

`components/home-updates.tsx` adds a secondary discovery rail to the instructor home. My training, reports, settings and participant pages retain their layouts. Existing LİNBA editorial artwork is reused in branded feature banners; no external artwork, release dates, ratings or rewards are invented.

The three carousel items describe implemented practice, activity and report features. They rotate every six seconds and wrap around; dots select an item directly. Rotation pauses on hover, keyboard focus, a hidden browser tab, open discovery dialogs or reduced motion. No arrows or numeric counter are shown. View all opens a keyboard-accessible overview. Feature actions open the first draft’s editor or practice room, or the reports list. Without a draft, preparation actions open Create training. At 1150 px the rail moves below the training area; at 650 px its sections stack. Loading skeletons follow the same structure. Copy is English in source with Turkish translations.

Social buttons use the colored LinkedIn, Instagram and YouTube marks and a theme-aware X mark, remaining inactive like the landing page buttons. Add verified destinations before enabling them.

## Feedback

`POST /api/feedback` requires the current authenticated account and same-origin validation. `lib/feedback.ts` validates category (`idea`, `issue`, `other`), a nonempty message up to 2000 characters and a client request ID. Ownership always comes from the session. Records are stored under SQLite kind `feedback`; the ID combines account ID and request ID, so retrying the same submission is idempotent and another account cannot collide with it. Success returns the saved ID. No feedback listing endpoint, external delivery, email or public review is created. Feedback can be read from the local records store for later product review.

The form preserves text after a failed save, prevents duplicate in-flight submits and shows confirmation only after a successful response. Modal closing restores focus to Share feedback.

## Validation

- `npm run test:feedback`: isolated database test for validation, ownership, persistence and retries.
- `npm run test:feedback:integration`: local HTTP test for authentication, saved data, retry, validation, cross-origin rejection and unsupported methods. Only its generated account, session and feedback are removed afterward.
- Browser verification covers carousel changes, all-updates and feedback forms, feature navigation, responsive layout, theme and locale.
