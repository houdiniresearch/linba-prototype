# Demo performance — 21 October 2026

Supabase remains authoritative for accounts, presentations, participation and reports. Switching back to the stale SQLite migration snapshot would lose recent changes. No schema or environment changes are needed for these improvements.

## Removed waits

- Database queries filter questions, responses, rehearsals, folders and presentations to their actual course/workspace. Workspace permissions resolve once instead of checking unrelated accounts' decks individually.
- Request-local reads share pending promises, clone results and retain record versions. Writes invalidate affected reads. Authorization is never cached between server requests.
- Course state loads independent resources in parallel. Index status no longer delays starting other reads.
- Public example PNGs ship with the app and bypass Storage/auth round trips. New demo accounts no longer copy the same images to Supabase. Uploaded presentations retain private media routes; authorized binary reads use a bounded 64 MB cache, coalesce downloads, and invalidate on storage writes.
- Example participant/activity seeding commits one atomic batch, rather than hundreds of sequential remote writes. Reusing a bundled example needs no remote image copy.
- Slide selection renders immediately and serializes/coalesces remote updates. Compact acknowledgements avoid fetching the full question/response/history state after each click. Failed saves surface an error and reload confirmed state.
- Non-live resource reads share a subscribed tab-local store. Stale snapshots remain visible during revalidation; freshness varies by resource. Mutations invalidate their dependencies and commit successful response data immediately. Login, logout and account identity changes clear all snapshots; late reads cannot overwrite newer writes or repopulate a previous account. Live data keeps its fresh polling path; hidden tabs suspend polling.
- Editor and dashboard use one account-scoped team key and share the same full team snapshot. This prevents summary/detail key changes from blanking the team on navigation; the full payload is reused rather than fetched on each view change.

## Waiting and dialog UI

Existing layout skeletons remain during initial loads, with an added team skeleton. Slide images expose busy state; current data remains visible during background refresh. Route transitions display a thin animated progress line. Creating teams/invitation links and entering the demo use spinner icons; reduced-motion preferences are respected. Invitation links become usable immediately without waiting for a full team refresh.

Team dialogs now share a compact 480px layout, 44px fields, 40px actions, restrained focus styling, aligned permission details and shorter invitation instructions. Existing focus containment, Escape behavior, return focus and backdrop blur remain.

## Verification

- TypeScript and production build pass. LibreOffice's system binary is explicitly excluded from Turbopack tracing; the container supplies that binary.
- 50 targeted tests pass, covering workspace isolation, revocation, reports, reuse, remote read coalescing/invalidation, asset bounds, cache/account boundaries and demo seeding. The mocked Supabase test verifies four example decks commit in one RPC with no Storage request; refreshing sample records also uses one RPC.
- Browser: both sample decks open; rapid next-slide clicks update immediately, with saved state retained on revisit. Invitation dialog checked at desktop and 390px width.
- Development server logs: course GET previously about 3–4.3 seconds, observed at 1.44 seconds after the query changes. This is one local observation, not a deployed benchmark. Public example images do not wait for Supabase. First server requests still depend on network distance to the Singapore database; AI generation also retains provider latency.

References used: [web.dev LCP optimization](https://web.dev/articles/optimize-lcp) (resource delays and caching), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) (focus and modal behavior), local Next.js 16.4 route/link documentation, Impeccable product register.

## Final navigation refinement

Draft slide selection now stays in sessionStorage per presentation. It does not perform database writes, clear resource caches or display a saving label. Live slide selection still synchronizes with participants, while actual content edits retain saving/error feedback. Adding an activity selects the new slide; deleted selections fall back to a valid slide.

Presentation cards prefetch their Next.js route on pointer hover or keyboard focus, following the official [manual prefetch guidance](https://nextjs.org/docs/app/guides/prefetching#manual-prefetch). Draft course data uses the existing short-lived, account-invalidated resource cache to coalesce the prefetch with opening the editor. Live data continues through its fresh polling path.

Rehearsal preparation, the create button and rehearsal agent region consistently use “prova ajanları”. Final verification was limited to TypeScript, four focused performance tests and a browser check of draft slide navigation (zero saving labels) and rehearsal copy.

## Shared workspace cache

The common useResource hook subscribes to the shared store using React useSyncExternalStore, so successful creation/edit responses propagate across mounted surfaces. Enabling a resource after auth resolves and changing URL now reads the existing cache directly, rather than relying on a useState initializer that ran before the account was known.

Freshness: team/folders/account/waitlist 30 seconds, auth/presentation lists/report-assistant list 10 seconds, changing report details/chat and presentation states 3 seconds. Stale snapshots remain available during revalidation (team 30 minutes, other resources 5 minutes) within the open tab. This is an in-memory cache, not an offline database or persistent copy across a full browser reload. API authorization failures remove the affected snapshot. Auth identity changes and login/logout clear all private data.

Creating/renaming teams, updating profiles and creating/editing presentations publish returned data immediately. Course cards are updated without a second GET, then reconciled in the background. Unrelated writes do not flush team, settings or folder snapshots. Focus/visibility refreshes auth; ordinary polling remains scoped to each resource.

Nine focused cache/performance checks verify navigation reuse, stale revalidation, mutation/late-read races, account separation, independent invalidation and immediate update propagation. Reference: [React external-store subscription](https://react.dev/reference/react/useSyncExternalStore).
