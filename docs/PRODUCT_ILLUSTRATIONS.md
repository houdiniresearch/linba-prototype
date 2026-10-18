# LİNBA product illustration family

Created 18 October 2026 using the built-in image_gen tool. No API/CLI fallback or external asset library was used. The supplied Yoodli screenshot established the human-scene approach; the illustrations were generated as original scenes for LİNBA.

## Assets and use

| Scene                 | Project asset                           | Placement                                      |
| --------------------- | --------------------------------------- | ---------------------------------------------- |
| Report review         | `public/agents/report-editorial.webp`   | Report-agent welcome                           |
| Voice practice        | `public/agents/practice-editorial.webp` | Audience/practice setup                        |
| Source-based learning | `public/agents/learning-editorial.webp` | Empty participant chat and participant preview |

All files are 800 × 600 WebP, quality 90, with the generated alpha preserved. Original outputs are 1448 × 1086 RGBA PNGs. Only proportional downscaling and format conversion were performed, with no recoloring, compositing or background extraction. The set totals approximately 230 KB.

These are conceptual illustrations, not real participant portraits, analytics or teaching resources. In particular, the biology sheet is an illustration motif, not an educational source. UI text remains real HTML and supports both languages. The illustration leaves the active conversation once the participant has questions; small authorship marks continue to use the original brand symbol.

The source-folio experiment has been replaced by this family. Actual uploaded pages remain unchanged in source previews and dashboard thumbnails. The landing's existing isometric images are unchanged. The small brand mark and functional navigation icons remain.

## Generation sources

- report: `/Users/houdini/.codex/generated_images/01a13585-b946-7a21-ba40-a0cf287402e1/exec-beea3776-591b-48af-80f4-6addff0f3c3e.png`
- practice: `/Users/houdini/.codex/generated_images/01a13585-b946-7a21-ba40-a0cf287402e1/exec-267e7d27-5859-4af9-8e6f-5b745f09aa6f.png`
- learning: `/Users/houdini/.codex/generated_images/01a13585-b946-7a21-ba40-a0cf287402e1/exec-f0935380-4520-4ba3-8f3f-dfbd541d2d52.png`

## Exact prompt set

Each final prompt is the common specification followed by its scene specification below. Each scene used a separate built-in image_gen call with `transparent_background: true`.

### Common specification

```text
Use case: illustration-story. Asset: one small editorial illustration for LINBA, an agentic AI training product, NOT a UI screenshot. Create an original, deliberately art-directed 2D human scene. Premium contemporary paper-cut editorial illustration with precise silhouettes, restrained fine charcoal line work and very subtle printed paper grain. Adult human proportions, natural small face detail, believable hands and restrained expressions. No exaggerated rubber limbs or generic faceless blob people. A signature motif: a thin white teaching sheet with a crisp folded lilac corner. Flat frontal/three-quarter elevation, not isometric, not 3D. Lilac #B28AE1, deep fuchsia #D60070 used sparingly, dark ink #23232F, warm-neutral skin tones and cool off-white. Tiny mint accent only if useful. Large, simple shapes read clearly at 200 pixels. Compact cohesive scene, 4:3 landscape composition, all objects fully inside the image, 10% breathing room. Absolutely transparent alpha background, no background panel, no white rectangle, no halo, no ground blob, no enclosing card. No text, letters, numerals, logos, magical stars, sparkles, robots, brains, stock clip-art plants, floating random UI cards, neon or gradients.
```

### report

```text
Scene: an adult woman educator with short dark hair, lilac blouse and tailored dark trousers sits on a low simple chair beside an oversized open training report folio. She carefully gathers two small participant response slips into one coherent grouping on the right-hand page, using her hand and a fuchsia paper clip. The open folio's left page has three short neutral lines and a subtle lilac section; right page has the grouped slips. A thin folded lilac backing echoes LINBA's folded-paper identity. Her pose and gaze show thoughtful review, not a celebratory pose. Exactly one human, one folio and two slips; no charts claiming scores or quantities. Clear readable silhouette and modest asymmetry.
```

### practice

```text
Scene: an adult woman instructor with a loose dark bun, charcoal trousers and lilac overshirt practices explaining a topic to two simplified participant profiles represented in one upright folded-paper practice panel. She stands naturally at the left, gesturing with one open hand while holding a small teaching note with the other. The two distinct adult profiles are drawn as small portrait silhouettes within the same panel, one listening and one asking with a restrained tiny fuchsia speech shape. Clear instructor-to-participant relationship. The practice panel has a folded lilac corner and very thin dark supports; exactly one full-body human instructor and the one panel. No real screen chrome, no microphone floating above, no numbers, no fantasy robot or confetti.
```

### learning

```text
Scene: an adult male learner with wavy dark hair, charcoal trousers and a soft gray-lilac sweater sits on a simple chair, leaning forward thoughtfully toward an open teaching folio on a slim small desk. One large folded-corner lesson sheet rises just behind the book, showing a simple lilac botanical cell-like teaching diagram with a small fuchsia center, no labels. The learner follows a fine lilac reference ribbon from a passage of the folio to a small answer note resting on the desk. This expresses learning grounded in the teaching material. Natural studying pose, attentive human expression. Exactly one learner, one restrained desk, folio, one source sheet and one answer note; cohesive scene without scattered UI objects.
```

## Verification

Generated outputs were inspected for subject, palette, anatomy and transparent background; alpha spans 0–255 in all three source PNGs and is retained in the project WebPs. Browser checks cover light/dark presentation, narrow-screen composition and the report composer remaining visible on short phones. No artificial agent responses or paid microphone session were needed for visual checks.
