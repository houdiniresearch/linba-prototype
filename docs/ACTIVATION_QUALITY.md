# Entry, folders and shared UI quality — 19 October 2026

## Delivered behavior

- The accepted landing design is preserved. Its rejected redesign is not part of this package.
- Waitlist registration remains distinct from the free agent experience and existing beta-account sign-in. Experience access still uses the existing seven-day browser session; the UI now explains that signing out ends the ability to return to that workspace. Signing out acts directly, without a confirmation dialog, as requested on 20 October. No account-conversion, recovery or email service is simulated.
- The participant entry screen creates participant accounts only. Switching to sign-in preserves the training URL/code. Teacher sign-in points new visitors to the existing welcome/waitlist route. Forms keep real backend errors, disable edits while submitting and use a main landmark and task heading.
- Library organisation is named **Folder / Klasör** throughout creation, filters, management, movement, feedback and Help. Participant groups and similar-question grouping retain their distinct meaning. Existing `groupId`, `/api/groups` and `training-group` records stay compatible; no stored user organisation is migrated or lost.
- Creating training inside a folder preselects it. Both uploaded and sample materials submit the destination with the creation request. The server verifies ownership before processing, rechecks after asynchronous processing and removes newly prepared files if that recheck fails. An empty folder has a direct creation action. Creation opens the new editor; creation requested for practice opens its practice room.
- Home discovery opens a sole draft directly, shows a searchable picker for several drafts and waits for the list to load. It never silently selects the first of several drafts. Training names and real creation times identify the options.
- Training creation protects changed setup on dismissal, preserves manually edited names when replacing a file, and keeps its actions fixed while fields scroll. Empty report results provide an appropriate clear-filter or library action.

## Modal and navigation behavior

All modal backdrops share `backdrop-filter: blur(6px)` and the WebKit equivalent, retaining the existing tinted fallback. This includes Settings, creation, feedback, waitlists, session history and mobile source/report/profile drawers. Desktop report/source panels remain non-modal.

The shared Modal explicitly exposes modal semantics, uses unique description IDs, restores focus to a connected opener and blocks Escape/outside dismissal during a protected operation. Home's rotating article no longer uses a live region that would exempt its controls from Radix's background hiding. Rotation pauses during parent modal workflows, including the draft picker, so its opener survives dismissal.

Workspace navigation and the report list use the same responsive sidebar component: ordinary desktop navigation becomes a modal drawer on narrow screens, with focus trapping, background isolation, dismissal and trigger-focus restoration. Opening Settings from the drawer hands focus into Settings. Tabs keep the current preference visible after changing language.

## Verification

- 61 unit checks across domain behavior, activities, practice, live sync, reports, session/folder library, translations, Trash and account settings; all pass. The additional terminology check preserves the distinction between folders and participant groups.
- Six local HTTP checks for public welcome/sign-in, waitlists, account/header behavior, canonical English routes, legacy redirects and thumbnail privacy; all pass.
- `npm run test:activation:integration`: sample and real single-page PDF creation in a folder, persisted assignment, foreign-folder/type/account rejection, unfiled creation and repeat-session folder inheritance. Fixtures are created and removed by the test.
- `npm run test:workspace:integration`: private notes, rename, folder ownership, repeated sessions, report times, recoverable Trash and temporary-account profile/password rotation.
- TypeScript and production build pass.
- Browser review at 320, 390, 768, 1150 and 1300 px, using TR/EN and light/dark themes. Verified: folder-aware creation and editor/back continuity; guarded form dismissal; draft search; modal background blur and hiding; Shift+Tab wrap, Escape and return focus; mobile drawer-to-settings handoff; sign-in/participant context; non-modal desktop report versus modal mobile report; preserved report/source conversation drafts; reduced-motion overlay behavior; and no document-level horizontal overflow in the checked views.
- A disposable live participant scenario was disconnected using browser network emulation. The selected poll answer survived, last-confirmed state and Reconnect remained visible, submission stayed disabled offline, and reconnect restored submission with the answer intact. No answer or chat was sent to a model.
- Browser fixtures use a separate loopback-host session; the user's existing localhost workspace/session is preserved. Test accounts, sessions, folders, training records and copied materials are cleaned up after verification. Temporary viewport, motion and network overrides are cleared.

Proof images: `output/activation-quality/`. This is browser-emulated layout and interaction verification; physical-device and paid voice/model evaluation remain separate from this UI pass.

## References

- [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): modal isolation, focus containment and focus return.
- [Carbon empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states): provide an action appropriate to the missing content or current filter.
- Installed Next.js 16.4 component and client-boundary guides under `node_modules/next/dist/docs/`.
