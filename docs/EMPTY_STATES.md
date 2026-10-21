# Product empty states — 20 October 2026

## Implementation

The existing LİNBA palette, Inter, controls and navigation remain in place. The sidebar label is **Integrations / Entegrasyonlar**, centered over its tool logos. The authenticated workspace and report-agent top bars expose the existing Light / Dark / System menu. On narrow headers, early access remains in the profile menu; at 480 px and below language remains available in Settings, making room for appearance, notifications and profile controls.

Three new original illustrations share a folded-paper courier bird, ivory/lavender paper textures, magenta and mint details. They are static, decorative, locally served, alpha-transparent WebP assets (233–302 KiB each, lossless):

- `public/empty-states/reports-hq.webp`: report folio and bird; reports, report-agent first use and invoices.
- `public/empty-states/training-hq.webp`: document folder and bird; first training, empty folders, folder management and Trash.
- `public/empty-states/conversation-hq.webp`: paper speech bubbles and bird; waiting activities, instructor questions, report questions and notifications.

`components/empty-artwork.tsx` reserves image dimensions and uses `next/image`; the empty alt text avoids repeating the contextual heading. The shared Empty component selects the appropriate artwork, offers a compact form and allows illustrations to be disabled. No-data views have calm whitespace rather than a dashed container. Existing, contextual next actions remain wired to the actual workflow. Filtered search misses and unavailable reports retain their corrective messages and simple icons. Small inline counts and repeated missing-data rows stay textual to avoid a wall of illustrations. Existing training, participant, report and practice data are not altered.

Artwork was generated with the built-in **image_gen** tool, not the API/CLI fallback. The original PNGs remain in the generated-images directory; the project copies are resized to 1024 px width, encoded as lossless WebP with their alpha preserved, without background replacement or semantic editing.

## Generation prompts

### Reports

Use case: stylized-concept. Asset type: a bespoke empty-state illustration for LINBA, an AI training product, displayed only 150 px wide in a clean professional app. Create one charming, carefully art-directed folded-paper courier bird perched beside a small closed report folio with a single simple lavender bar-chart sheet tucked inside. Bird is an ORIGINAL sculptural origami companion, folded lavender paper wings, warm ivory body, a tiny magenta beak, two subtle dark ink dot eyes, no human limbs. Quiet friendly personality, restrained editorial illustration, soft tactile paper grain and crisp folded edges, nearly frontal three-quarter view, NOT a shiny 3D emoji, NOT a generic robot. Folio ivory and lilac, tiny mint index tab, one vivid fuchsia detail. Compact balanced silhouette; the entire subject centered with generous transparent padding, no scene backdrop, no text, no letters, no labels, no stars or sparkles, no confetti, no oversized ground shadow. Real transparent alpha background; attractive on white and near-black. Professional warmth, hand-crafted brand asset, clear and recognizable when small.

### Training

Use case: stylized-concept. Asset type: bespoke empty-state illustration for LINBA, an AI training product, displayed at 150 px wide in a professional app. One ORIGINAL small folded-paper courier bird beside an open lavender document folder containing two warm ivory blank sheets; bird gently holds a tiny mint paper tab in its magenta beak, suggesting starting something new. Bird design: sculptural origami companion with folded lavender paper wings, warm ivory body, tiny magenta beak, two subtle dark ink dot eyes, no human limbs. Quiet friendly personality, restrained editorial illustration, soft tactile paper grain and crisp folds; nearly frontal three-quarter view. Folder warm lavender with a single fuchsia bookmark detail; minimal readable shapes, no UI screenshot. Compact balanced centered silhouette, generous transparent padding, no scene, no text, no letters, no numbers, no labels, no stars, sparkles or confetti, no glossy plastic, no generic robot, NOT a 3D emoji. Truly transparent alpha background, no broad floor shadow. Warm bespoke paper craft should look good on white and near-black backgrounds and remain clear at small sizes.

### Conversation

Use case: stylized-concept. Asset type: bespoke empty-state illustration for LINBA, an AI training product, displayed at 130 px wide in a professional app. One ORIGINAL small folded-paper courier bird waiting attentively beside two small sculpted paper speech bubbles, one lavender and one warm ivory with a tiny mint inset. Bird design: a sculptural origami companion with folded lavender paper wings, warm ivory body, tiny magenta beak, two subtle dark ink dot eyes, no human limbs. Quiet friendly personality, restrained editorial illustration, soft tactile paper grain, crisp folded paper edges, nearly frontal three-quarter view, warm hand-crafted feel. One restrained fuchsia detail. Compact balanced centered silhouette, generous transparent padding, no scene backdrop. No text, no letters, no numbers, no icons within the speech bubbles, no stars or sparkles, no confetti, no shiny plastic, no generic robot, NOT a glossy 3D emoji. True transparent alpha background, no broad floor shadow. Charming but professional, clear small forms, suitable on white and near-black UI surfaces.

## Verification and sources

- TypeScript and product checks pass. Browser verification covers report first-use, training first-use, an empty folder and its preselected create action, Trash, notifications, filter misses, light/dark appearance, and 320/390/1150 px layouts without horizontal overflow.
- Screenshots: `output/empty-states/`. Synthetic accounts, records and copied materials are removed after review; the original localhost workspace is preserved.
- [Carbon empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states): distinguish no data, filtered results and errors; keep contextual next steps and scale imagery to the available space.
- Installed Next.js 16.4 image/component guides under `node_modules/next/dist/docs/`.

## Image-fidelity follow-up

The initial 512 px lossy WebP copies were being re-encoded by the default Next.js image optimizer at quality 75. The active assets now use the `-hq.webp` names above, are exported from the original PNGs, and bypass that second encoding through Image’s `unoptimized` option. Large empty states display the artwork at 224 × 150 px; compact areas use 144 × 96 px. Instructor question panels retain their compact 132 × 88 px layout. At an emulated 2× pixel density, the browser was verified to request the direct local 1024 px source rather than an optimizer URL. At 390 px width the page still has no horizontal overflow. Proof: `output/empty-states/reports-hq.png`. TypeScript and diff checks pass.
