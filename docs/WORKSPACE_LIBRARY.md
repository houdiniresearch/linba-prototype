# Training library and account settings

Completed training can create another session through **Use training again**. Source material, activities and instructor notes are copied into a fresh draft with a new participation code, display key and slide IDs. Participants, answers, reports, rehearsals and report conversations remain with the original session. Concurrent retries use the same request ID; separate requests produce separate sessions. The library shows active sessions, or the latest completed session when none are active. Reports list every completed session with session number and Istanbul start/completion times.

Training groups belong to the signed-in instructor. Create, rename and remove them through **Manage groups**; removing a group keeps its training. A training card menu assigns the whole session family to a group or moves it to recoverable Trash. Live families must be ended first. Restore returns the complete family, including its reports and original group. There is no permanent-delete control.

My training and Reports support all time, recent seven days, this month, this year and inclusive custom calendar dates. Calendar boundaries use Europe/Istanbul. My training filters the displayed session date; Reports filters the completed date. Search and date/group filters compose.

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
