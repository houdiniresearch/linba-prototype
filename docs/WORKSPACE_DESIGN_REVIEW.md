# Workspace UI review — 19 October 2026

## Direction

Instructors prepare and find training in a focused workspace. Keep the established Inter typography, original folded LİNBA mark, quiet neutral surfaces, fuchsia primary actions and pale mint early access. The interface should make its next action clear without adding marketing decoration.

The previous implementation exposed group management as a form, used generic selects for primary navigation, repeated headings, and placed changing date fields into the page layout. Settings did not distinguish navigation, editable content and commit actions. These were information hierarchy and interaction problems, not missing artwork.

## Changes

- Training groups are directly selectable navigation with library counts. The active group uses a thin underline; long lists scroll horizontally. Group renaming edits only the selected row. Removing a group explains that training remains in the library and asks for confirmation within that row.
- New training and date filtering share one action row. Date presets apply immediately; a custom range remains a draft until Apply range. The popover is constrained to the viewport and does not shift the results. Filtering stays composed with search and groups.
- Training options reveal the group destination list only when needed. Moving training confirms its destination, offers View group, and restores keyboard focus. Following the group clears unrelated date/search filters so the moved item can be found.
- Cards preserve actual slide previews at 16:9, remove redundant Session 1 labels and use small neutral option buttons. Repeated sessions still show their number. Report timestamps place the date above a more prominent 24-hour time.
- Settings has stable navigation, a scrollable content area and a separate action footer. Tabs support arrow keys, Home and End; the active tab remains visible on mobile. Profile save is disabled when unchanged. Closing with unsaved changes asks whether to keep editing or discard the draft. Experience accounts no longer show an empty disabled email field.
- Theme choices show light, dark and device previews. Selection uses a neutral border rather than a purple fill. Preference changes save immediately. Billing continues to show the real Free state; no payment service was added.
- Sidebar integration marks form a compact strip, early access uses shared mint tokens, and instructor notes have an identifiable private writing surface under the slide. Mobile controls reflow without page overflow.

## Reference basis

- [Carbon data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines): keep global controls in a coherent toolbar, use consistent density, preserve distinct row action targets and use overflow for contextual actions.
- [NN/g: User intent affects filter design](https://www.nngroup.com/articles/applying-filters/): choose immediate or staged application to suit the task; avoid result updates and page shifts while the user is still configuring multiple criteria.
- [Atlassian modal dialog usage](https://atlassian.design/components/modal-dialog/usage/): retain page context, keep dialog content concise, and distinguish its header, body, dismissal and action footer.

These informed the interaction choices. They are not a replacement for LİNBA’s visual identity.

## Verification

Browser checks cover actual group renaming and reassignment, custom date selection and application, empty results, focus restoration, unsaved profile draft protection, keyboard tabs, light/dark preferences, sidebar navigation, private notes and report times. Desktop and 390 px layouts were inspected. Generated UI fixtures are removed after capture; existing training is unchanged. TypeScript, relevant product/workspace/session tests and the production build are checked separately from visual review.
