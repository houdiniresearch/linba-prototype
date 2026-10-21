# Activity drafts and participant sources — 19 October 2026

## Activity editing

Question and answer fields lead the editor; the participant preview is an optional disclosure below them. The action footer sits outside the scrolling catalog/form body and remains visible on short mobile screens.

Closing through the header, Escape, Cancel or the backdrop protects unsaved activity content. An inline footer asks whether to keep editing or discard; the safe action receives focus. Escape from that confirmation returns to editing. A pristine draft, or a draft restored to its saved content, closes without confirmation. Saving bypasses the discard prompt only after the existing save promise succeeds; errors leave the draft in place. Reload/navigation protection uses the browser's beforeunload mechanism while the editor is dirty or processing. This is a warning, not persistent draft storage.

The dirty comparison follows persisted semantics: trimmed question/options, option order, activity type and AI provenance. Inactive poll options do not make an open response dirty. A generated suggestion stages a separate review when current question/options contain content. It cannot replace that content until Use this draft. Keep my activity rejects the suggestion; generation failure preserves the original. A fresh empty activity may receive a generated draft directly. The existing single-model API and persistence schema are unchanged.

## Participant sources

Citations select a question ID and page number together. The source appears beside the conversation above 1100 px, and in a focus-contained drawer at smaller sizes. The panel shows the actual cited slide, its associated question and optional extracted slide text. Multiple sources from that answer can be navigated without leaving the panel. Navigation moves focus to the newly selected source heading, including the unavailable-source state.

Escape, Close source and Back to answer restore focus to the original citation. Source changes and dismissal do not trigger chat auto-scroll; incoming updates also avoid moving the conversation while a source is being read. The composer draft stays mounted. Slide loading/error handling reuses SlideView. Authentication, membership and document access checks are unchanged.

## Reference basis

- [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): mobile focus containment, dismissal and returning focus to the caller. Desktop panels remain non-modal.
- [NN/g on preventing slips](https://www.nngroup.com/articles/slips/): prevent accidental loss instead of relying on a user to recover discarded work.
- Impeccable product guidance and the existing LİNBA workspace/settings interactions: restrained selection, progressive disclosure and explicit save/discard behavior.

## Verification

- Activity library tests: four pass, including persisted draft comparison; product tests: three pass. TypeScript and production build pass.
- Real browser with disposable records: Escape/Cancel/backdrop protection, Keep editing retaining text, successful save and restored trigger focus; 390 × 700 mobile footer remains visible.
- Participant browser session on a separate loopback origin: existing instructor cookies remain untouched. Long conversation, retained composer draft, exact scroll restoration (271 px in the desktop check), correct question for repeated page citations, multiple sources, missing page, mobile extracted text, Escape/Back to answer focus, dark and light themes.
- The AI generation request was not invoked during browser review; no paid model calls were made. The staged replacement path is implemented but real model output generation was not exercised.
- Review accounts, sessions, training, copied files and question records are temporary and removed after verification. Existing training and accounts remain intact.

## Available activity formats — 21 October 2026

The creation catalog exposes Multiple choice, True/false and Open question. True/false stores a distinct `true-false` type and two fixed True/False or Doğru/Yanlış options. It shares choice validation, participant submission, projection, live distribution and report aggregation with multiple choice. Fixed empty true/false options do not count as unsaved content before a question is written.

Scenario, Roleplay and Devil’s advocate appear as noninteractive **Yakında** entries. AI generation and new activity creation accept only the three available formats. Existing scenario slides remain readable and editable for compatibility with existing presentations and report history.
