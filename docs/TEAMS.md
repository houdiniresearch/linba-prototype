# Teams and workspace collaboration

The sidebar starts with **Create team** and changes to **My team** once the account creates or joins a team. Member avatars and the invitation plus appear in the presentation editor's top bar. The owner can rename the team, remove members and transfer ownership. Members can invite colleagues, leave and work on the team's content. One team per workspace account is supported.

## Access

- Joining a team gives every member access to presentations created by the other current members, including existing presentations. Members can edit slides, activities and instructor notes, practise, present, manage folders, and read completed reports. The invitation and team screens explain this scope.
- Creator attribution remains attached to the original creator when another member edits a presentation or folder. A copied presentation is attributed to the person who creates the copy.
- Reports automatically include completed presentations from current members. There is no separate report-sharing switch or read-only coordinator role.
- Removing a member or leaving immediately cuts off access to other members' content. The departing person's own content remains theirs and stops being visible to the former team. Previously accepted invitations are revoked on departure.
- Ask Linba can use authorized team reports. Conversations, retries and pending jobs remain scoped to each user and report. Access is checked again before storing a generated answer.
- Unrelated accounts and participant accounts do not receive workspace permissions. Owner-only team management remains separate from content collaboration.

## Invitations

A member enters an email and creates an invitation link to share manually. **No email is automatically sent.** The UI states this next to the action. Links expire after 7 days, are bound to the invited account email, and store only a SHA-256 digest of a random 32-byte token. Renewing a pending invitation revokes its previous link. Invitations can be revoked by their creator or the team owner. Up to 50 unexpired pending invitations are supported.

`/invite/[token]` supports existing workspace accounts and registration without losing the invitation. Wrong accounts can switch accounts; revoked or expired links give a retryable error. Accepting twice with the same account is idempotent. This change does not add an email delivery or verification provider.

## Implementation and validation

`lib/teams.ts` centralizes creator-based workspace access and membership. Course, folder, report and repeat-presentation operations use the same policy. No copy or migration of presentation ownership is required. Legacy `reportTeamId` fields no longer determine access.

Team tests cover invitation binding, expiry, revocation, ownership transfer, collaboration on drafts and completed presentations, instructor notes and practice access, shared folder editing, unrelated-account denial, per-user chat isolation, and removal cutting off access. Browser checks use disposable local accounts and presentation material; they do not send invitations or make paid model calls.
