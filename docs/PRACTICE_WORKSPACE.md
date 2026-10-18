# Practice workspace

The practice room keeps the actual training slides, AI participant identities, connected session time and audio controls together. The left brief shows the audience description and the selected agent's background, learning goal when available, approach and voice settings. Selecting an agent changes the profile panel; every agent still participates in the same practice. Source slides are contained at their original aspect ratio, without recoloring or redrawing.

## Identity and state

Six fictional adult portrait photographs were generated with the built-in image generation tool (six separate generation calls, no external CLI). They are a reusable product asset set, not real learner photos. Each card identifies its subject as an AI participant. The synthetic nature of the full group is also disclosed in the brief.

New sessions persist a local portrait ID on every persona. Legacy sessions receive deterministic IDs; their first voice edit or completion persists those IDs. Explicit initial voice styles can suggest the first portrait pool; names and behavior are never used to infer identity. A persisted portrait survives voice changes and persona reordering. IDs are allowlisted and cannot resolve to arbitrary remote URLs. Six distinct portraits are used before reuse within a session.

Speaking status starts on actual audio playback, rather than when the audio request returns. Preparing a line and speaking are distinct states. The speaking indicator is an animation of turn state, not an audio amplitude meter. Other agents have connection-based listening/ready states.

Emotion is intentionally unconfigured. Cards show an em dash and the selected profile says “Not available yet.” No facial-expression inference, fabricated emotion score, sentiment service or mood behavior has been added. The user will specify how this feature should work later.

## Time and controls

The monotonic clock starts when the voice data channel opens. Setup time is excluded. Disconnection stops the clock; reconnecting in the same mounted workspace resumes the accumulated time. Muting disables the existing microphone track without requesting another stream; connected time continues. Ending practice stops time before feedback generation and saves integer durationSeconds alongside remarks and feedback. An earlier completed practice with no recorded duration displays an em dash; creation dates are never treated as speaking duration. This is connected session time, not billable usage or instructor speaking time.

The microphone remains off until Start practice. Start/end, microphone mute, slide navigation, voice selection/preview and browser full screen retain real actions. Full-screen rejection is shown as an inline error. The connection/voice engine remains in rehearsal.tsx; the new workspace is its view. Feedback remains about the instructor’s practice, with actual remarks and measured technical usage available below the room.

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

- npm run test:practice-workspace: clock boundaries, reconnect/reset, portrait reuse and stable identity.
- npm run test:practice-workspace:integration: local authentication, voice edits preserving identity, duration validation, persisted duration/feedback and reload. Creates and removes its own fixtures; makes no model calls.
- npm test, npm run test:product, npm run typecheck, npm run build.
- Browser review: desktop/mobile, light/dark, agent profile selection, voice settings, slide navigation, full-screen behavior and disabled pre-session controls.
