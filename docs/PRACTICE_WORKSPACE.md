# Practice workspace

The practice room keeps the actual training slides, AI participant identities, connected session time and audio controls together. One participant strip opens a secondary right-hand panel for the selected agent's background, learning goal when available, approach, voice settings and audience brief. The panel starts closed so the slide has the main working area. Selecting a profile never changes which agents participate. At 850 px and below, details use a modal drawer with Escape dismissal, focus containment and focus restoration to the triggering button. All three agents remain visible on mobile without horizontal scrolling. Source slides are contained at their original aspect ratio, without recoloring or redrawing.

## Identity and state

Six fictional adult portrait photographs were generated with the built-in image generation tool (six separate generation calls, no external CLI). They are a reusable product asset set, not real learner photos. The room labels the group as AI participants; the selected profile and audience disclosure also identify them as fictional AI participants.

New sessions persist a local portrait ID on every persona. Legacy sessions receive deterministic IDs; their first voice edit or completion persists those IDs. Explicit initial voice styles can suggest the first portrait pool; names and behavior are never used to infer identity. A persisted portrait survives voice changes and persona reordering. IDs are allowlisted and cannot resolve to arbitrary remote URLs. Six distinct portraits are used before reuse within a session.

Speaking status starts on actual audio playback, rather than when the audio request returns. Preparing a line and speaking are distinct states. The speaking indicator is an animation of turn state, not an audio amplitude meter. Other agents show Waiting during a turn, Thinking during generation, Listening when the session is listening, and Offline after a disconnection. The state vocabulary lives in lib/practice-state.ts and does not infer emotion. Connection errors and replay actions appear next to the room controls. Connecting can be cancelled; late results from cancelled attempts cannot close or overwrite a newer connection.

Emotion is intentionally unconfigured. Repeated empty emotion fields are hidden until the user specifies the model. No facial-expression inference, fabricated emotion score, sentiment service or mood behavior has been added.

## Time and controls

The monotonic clock starts when the voice data channel opens. Setup time is excluded. Disconnection stops the clock; reconnecting in the same mounted workspace resumes the accumulated time. Muting disables the existing microphone track without requesting another stream; connected time continues. Ending practice stops time before feedback generation and saves integer durationSeconds alongside remarks and feedback. An earlier completed practice with no recorded duration displays an em dash; creation dates are never treated as speaking duration. This is connected session time, not billable usage or instructor speaking time.

The microphone remains off until Start practice. Start/end, microphone mute, slide navigation, voice selection/preview and browser full screen retain real actions. Full-screen rejection is shown as an inline error. The connection/voice engine remains in rehearsal.tsx; the new workspace is its view. Feedback remains about the instructor’s practice, with actual remarks and measured technical usage available below the room.

Practice now uses sequential turns. `interrupt_response` stays false. From response generation through separate speech rendering and actual playback completion, the microphone track is disabled and automatic VAD responses are suspended. Late `speech_started` events cannot stop the clip; an already queued response arriving during playback is cancelled by its own response id. Before listening resumes, pending input is cleared so room noise and speaker echo cannot become the next turn. The short opening greeting follows the same rule. Manual mute survives the handoff; unmuting during an agent turn cannot enable the microphone early. Finish/disconnection wins over delayed playback callbacks, and playback/model failures release the turn safely.

This behavior follows the [OpenAI Realtime conversation guidance](https://developers.openai.com/api/docs/guides/realtime-conversations). `tests/practice-turn-taking.test.ts` exercises the physical track-enabled callback, input clearing order, manual mute, late events and reconnect/finish races with simulated media I/O. The 13 scoped practice checks, TypeScript and production build passed. No personal microphone recording or paid voice call was used for this change.

Preparation places the audience form alongside a dated practice history. Each history entry shows its creation date, 24-hour time and actual saved duration when available. Feedback opens in a responsive dialog with its session timestamp, saved duration, summary and suggested actions. A newly completed practice opens it automatically once, after feedback is saved. Closing it does not reopen it on timer ticks or other renders; View feedback opens it again. Loading a previous practice does not auto-open feedback. The dialog exits browser fullscreen before opening, traps focus, supports Escape and returns focus to View feedback when closed. Its body scrolls independently of the heading and close action. Sessions without model feedback link to and expand their recorded comments instead. Neither path invents scores or feedback. Technical usage remains a secondary disclosure.

A full page reload during an unfinished practice does not recover unsaved connected time. Real microphone, WebRTC and paid model/audio calls were not invoked for visual QA in this change. Existing voice engine tests remain separate.

## Portrait production

Consumed assets: public/agents/portraits/portrait-01.webp through portrait-06.webp, 384 × 384, WebP quality 89. Originals remain in /Users/houdini/.codex/generated_images/01a13585-b946-7a21-ba40-a0cf287402e1/. Preparation only resized and encoded each source; no retouching, expression edits or compositing. Portraits are decorative next to each explicit agent name, so their alt text is empty.

Common generation brief:

> Use case: photorealistic-natural. Asset: a reusable profile portrait of a COMPLETELY FICTIONAL adult participant agent for LINBA, an AI training product. Generate one single head-and-shoulders portrait, square 1:1 canvas. The person is not any real known individual. Consistent across the portrait collection: softly lit near-frontal professional editorial photograph, eye-level 85mm lens, subject centered, head fully inside the frame with generous crop-safe space, shoulders visible, eyes at about 40% of image height. Quiet light cool-gray seamless background with a very subtle lilac undertone. Natural neutral attentive expression, relaxed mouth, no exaggerated grin or emotion performance. Real skin texture, believable slight asymmetry, normal everyday adult appearance, no beauty retouch or plastic skin. Everyday smart-casual clothes in charcoal, gray, off-white or muted lilac; no corporate blue suit or tie. Restrained soft window light, no dramatic lighting, no vignette, no hard cast shadow. No text, badges, icons, collage, borders, logos or watermark. This must be a finished high-quality avatar photograph, not an illustration, 3D render or cartoon.

Individual subject instructions and source files:

- **portrait-01** — A fictional woman in her early thirties, olive complexion, shoulder-length softly wavy dark brown hair, brown eyes, plain muted lilac blouse.
  Original: `exec-59b6ce50-7a18-47bf-ab97-4c5b73fd2f8d.png`.

- **portrait-02** — A fictional woman in her late forties, light-medium complexion, short dark brown bob with a few natural gray strands, brown eyes, subtle thin round glasses, charcoal knit top.
  Original: `exec-7e045f3d-76ad-475c-9b13-4544ceb2445f.png`.

- **portrait-03** — A fictional woman in her late twenties, deep brown complexion, natural short curly hair, dark brown eyes, off-white crew-neck top under a soft gray overshirt.
  Original: `exec-d253a2e5-6a8d-439f-8076-f7aca9c362d1.png`.

- **portrait-04** — A fictional man in his mid-thirties, olive complexion, short softly wavy dark hair, very light natural stubble, brown eyes, charcoal polo shirt.
  Original: `exec-6549dde9-ce95-4605-ac03-22d2745cf7c3.png`.

- **portrait-05** — A fictional man in his early fifties, light-medium complexion, close-cropped salt-and-pepper hair, clean-shaven face, subtle rectangular glasses, muted gray-lilac knit crew-neck sweater.
  Original: `exec-a3ee2331-ca31-413a-b2f9-18d4a12e1862.png`.

- **portrait-06** — A fictional man in his early thirties, medium East Asian complexion, short straight black hair with a natural side part, dark brown eyes, clean-shaven face, off-white open-collar shirt.
  Original: `exec-dc6a0ef3-eee8-4086-9f1a-38fb92b688a4.png`.

## Verification

- npm run test:practice-workspace: clock boundaries, reconnect/reset, portrait reuse, stable identity and truthful connected/agent state labels.
- npm run test:practice-workspace:integration: local authentication, voice edits preserving identity, duration validation, persisted duration/feedback and reload. Creates and removes its own fixtures; makes no model calls.
- npm test, npm run test:product, npm run typecheck, npm run build.
- Browser review: desktop/mobile, light/dark, agent profile selection, voice settings, slide navigation, full-screen behavior and disabled pre-session controls.

### 19 October refinement

The single participant strip, optional details panel, compact controls and feedback hierarchy apply the product review. Reference basis: [Microsoft HAX](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) for legible system state and recovery, and [WAI disclosure guidance](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) for explicit expanded state and keyboard operation. Existing Radix dialog behavior is reused for the responsive profile panel. Temporary completed-session fixtures are removed after browser checks. No real-time model or microphone calls are part of these checks.

## Editor preparation shortcut — 20 October 2026

Draft training now has a “Practice with AI” action immediately beside Start training. The existing tool-dock Practice action stays available. Both use the same route and flush pending instructor notes before navigation; save failures remain visible in SlideNotes and keep the instructor in the editor. The new action uses LİNBA’s original folded symbol, a restrained four-second lilac/fuchsia border-light loop, and a normal button surface. The border is a masked pseudo-element with an animated registered CSS angle, so it cannot intercept clicks or cover the label. Unsupported masking falls back to a static border. Reduced motion disables the loop; disabled actions pause it. The requested English label is preserved in both locales.

Browser validation: editor-to-practice navigation, saved notes after returning, 1150 px desktop and 320 px layout without overflow, advancing border angle, and a static reduced-motion state. TypeScript and diff checks pass. Proof: `output/practice-button/editor.png`. No paid generation or voice session was started.

Implementation references: [MDN mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite), [MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property).

The same border-light treatment is shared by the report action through `components/ai-orbit-button.css`. The report-list and report-detail action now reads “Ask Linba” in both languages; its existing report route, selected-report parameter and new-tab indicator remain intact. Practice with AI retains its existing appearance and behavior. Browser checks confirm the shared animation, report-scoped URL, 320 px layout and reduced-motion fallback. Proof: `output/ask-ai-button/reports.png`.

## Concise participant profiles and internal practice budget — 21 October 2026

Participant information contains the portrait, name, current state and one background paragraph. Learning goals, prior-knowledge/approach disclosures, voice controls and the repeated fictional-participant footer are removed from this panel. Legacy leading simulation labels are stripped, while the persona-generation prompt requests a natural paragraph. Other persona fields remain available to the dialogue model.

Creation feedback now says **Prova ajanların yaratılıyor…**. The conversation has an internal 90-second budget, with no limit label or countdown in the product. The connected clock and persisted `voiceExpiresAt` trigger the normal finish/feedback flow; the microphone and participant playback stop first. The server refuses new voice connections and participant speech after the persisted deadline and caps saved conversation duration at 90 seconds. Reconnecting does not issue a fresh deadline. Feedback generation is a separate closing step. This is a browser/session safeguard, not a claim of provider-enforced hangup in a suspended or modified client.

Budget boundary and persisted-expiry checks are unit-tested without a paid voice call. Browser QA verified the one-paragraph profile and absence of voice/approach controls.

## Short turns and an opening greeting — 21 October 2026

A fresh practice automatically starts with one participant saying: **“Merhabalar, seni dinliyoruz. Hazır olduğunda başlayabilirsin.”** It uses the participant's normal voice/playback path and is recorded as application playback context. The fixed application line bypasses model-based role classification. Reconnection within the page and sessions reloaded after their voice connection has started do not repeat the greeting. The instructor can interrupt naturally.

The dialogue prompt targets 8–14 words per question. Client and server reject turns above 18 words when they contain a question, above 24 words otherwise, multiple questions in one turn, or more than 320 characters. An overlong turn gets at most one length-specific rewrite before playback, preserving meaning instead of cutting the sentence. Prompt version: `participant-dialogue-v4`. `tests/practice-turns.test.ts` covers limits and greeting/reconnection behavior; the live dialogue and synthetic audio checks cover short replies and greeting speech generation.
