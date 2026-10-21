# Training library and account settings

Completed training can create another session through **Use training again**. Source material, activities and instructor notes are copied into a fresh draft with a new participation code, display key and slide IDs. Participants, answers, reports, rehearsals and report conversations remain with the original session. Concurrent retries use the same request ID; separate requests produce separate sessions. The library shows active sessions, or the latest completed session when none are active. Reports list every completed session with session number and Istanbul start/completion times.

Training folders belong to the signed-in instructor. Create, rename and remove them through **Manage folders**; removing a folder keeps its training. A training card menu assigns the whole session family to a folder or moves it to recoverable Trash. New training offers a folder selector and defaults to the folder currently open in My training; the server validates ownership before processing materials and again before saving. Live families must be ended first. Restore returns the complete family, including its reports and original folder. There is no permanent-delete control.

The library lists All training and the named folders only. Unfiled training stays in All training without a separate No folder category or heading; an older saved unfiled filter returns to All training. The creation and move controls retain their explicit unfiled option.

My training and Reports support all time, recent seven days, this month, this year and inclusive custom calendar dates. Calendar boundaries use Europe/Istanbul. My training filters the displayed session date; Reports filters the completed date. Search and date/folder filters compose. Existing `groupId`, group endpoints and SQLite records remain compatible; only the interface vocabulary changes to folder/klasör.

## Editor

Click the training heading to rename it. Enter saves, Escape cancels and blur saves a changed value. Slide notes autosave after a short typing pause or blur, preserve drafts across slide selection, and show retry on failure. Pending notes are flushed before starting or repeating a training. Notes are included in the next session's preparation but stripped from participant state and public presentation JSON. They are not supplied as report or model context.

## Account and navigation

Settings opens one responsive dialog with My profile, Security, Billing & payments and General preferences. Profile changes persist to the account. Registered users can change a password by verifying the current password; this rotates the current session and invalidates other sessions. Experience accounts cannot change email or password. Language and light/dark/system preferences use the shared providers and cookies.

Billing shows the current Free plan and empty invoice state. No payment provider or paid subscription is connected. Early access and sidebar integration marks open the existing account waitlist; they do not activate integrations or send an email. Logout is only in the profile menu. Help opens a short product guide. The lower sidebar contains Settings, Trash and Help.

## Validation

- `npm run test:training-sessions`: isolated material copying, fresh session keys, retry idempotency, ownership, numbering and failure cleanup.
- `npm run test:workspace`: Istanbul time filters, group ownership, family-wide assignment, recoverable Trash, notes privacy, profile validation and account-scoped password changes.
- `npm run test:workspace:integration`: temporary local HTTP accounts exercise notes and concurrent slide selection, rename, participant/projection privacy, groups, repeated sessions, reports, Trash, profile and password/session rotation. Fixtures are removed afterward. Completion timestamps are generated in owned fixtures without paid model requests.
- Browser verification covers actual repeat, rename, saved notes after reload, group reassignment, Trash restore, integration waitlist, session timestamps and custom date filtering, settings, 390 px layout, theme and search alignment. UI proof fixtures are separate from existing training and removed after capture.

Final activation and modal review: [ACTIVATION_QUALITY.md](ACTIVATION_QUALITY.md).

## Presentation card and filter refinement — 20 October 2026

Presentation cards keep the source cover clear, put their options menu beside the title, and show the creator's shared profile avatar beside attribution. Completed cards omit the redundant completion badge; draft and live states remain visible. The title button extends across the card while the separate menu retains its own keyboard and pointer action.

The clear-filters action appears to the left of the fixed-width date control in both presentations and reports. Its layout footprint is reserved while inactive, without being focusable or announced, so selections and clearing do not shift the dropdown. Narrow screens keep both controls together with a smaller date trigger. Browser checks compare trigger rectangles before and after selection/clearing, cover/menu interaction, TR/EN and light/dark layouts, including 320 px screens.
