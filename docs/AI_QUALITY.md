# AI quality baseline — 21 October 2026

This work improves the existing product flows. It does not add autonomous activity launching, an answer-key/scoring system or a new database. The informational Agents panel retains its existing scope.

## Task routing

| Workload                                 | Transport / configuration                                   | Validation                                                                               |
| ---------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Practice conversation + closing feedback | Realtime WebRTC; `OPENAI_VOICE_MODEL=gpt-realtime-2.1`      | One participant tool call, identity bounds, role guards, separate feedback response      |
| Participant voice rendering              | Realtime audio; `OPENAI_SPEECH_MODEL=gpt-realtime-2.1-mini` | Text role check before generation; transcript drift check before audio is returned       |
| Learning answers                         | Responses API; `OPENAI_TEXT_MODEL=gpt-5.4-mini-2026-03-17`  | Strict schema, actual source quotations, independent answer-support check                |
| Question groups / personas / activities  | Responses API                                               | Task-specific strict schemas and application invariants                                  |
| Report summary / Ask Linba               | Responses API                                               | Strict schemas, exact aggregates, separate evidence audit and at most one audited repair |

Text task overrides use `OPENAI_ANSWER_MODEL`, `OPENAI_VERIFY_MODEL`, `OPENAI_AUDIT_MODEL`, `OPENAI_GROUP_MODEL`, `OPENAI_PERSONAS_MODEL`, `OPENAI_ACTIVITY_MODEL`, `OPENAI_REPORT_MODEL`, `OPENAI_REPORT_CHAT_MODEL` and `OPENAI_PARTICIPANT_CHECK_MODEL`. Legacy `OPENAI_MODEL` remains a fallback for voice/speech only. The local configuration explicitly sets the three workload models; deployments should copy the non-secret settings from `.env.example`.

The larger voice model was selected after the same rehearsal dialogue set exposed recurring method-coaching drift in the mini model and the larger model passed all ten cases. This is a measured improvement on these fixtures, not a claim that any model is universally best or error-free. Speech rendering stays on the smaller model. The existing internal 90-second practice budget remains in place. The cost estimator records each usage entry's actual model and supports both Realtime rates plus the pinned text model; unrecognized rates remain unknown.

## Shared runtime

`lib/ai-runtime.ts` sends `store:false` Responses requests with strict JSON Schemas. `lib/ai-contracts.ts` checks the same schema locally, including object keys, types, lengths, item limits and task-specific invariants. A malformed persona list, duplicate choice labels or truncated/refused response cannot become a successful product result.

There are at most two provider attempts per structured request, with jitter and bounded Retry-After handling. Authentication, refusal and incomplete-output errors do not trigger retry storms. A request has one deadline across attempts (55 seconds by default); report generation plus auditing/repair has a shared 70-second budget, below the 90-second report recovery threshold. Participant role checking has a 12-second budget. Output budgets are task-specific. Oversized context is rejected rather than cutting a serialized JSON object in half.

Every structured call emits metadata: task, configured model, policy/schema version, attempts, elapsed time, token totals, provider request id and error code. The last 200 events are available through `recentAIRuns()` in server code. Neither this trace nor its ring buffer records prompts, user names, presentation text, answers or credentials. This is process-local diagnostic history, not a durable observability service.

## Learning agent

- Length-normalized lexical retrieval weights rare terms and titles, normalizes Turkish spelling variants and searches overlapping chunks throughout a page. Late-page content is no longer lost to the first 6,000 characters.
- Only the asking participant's own history from the current presentation enters answer context. Referential follow-ups may reuse that participant's last cited context. Unrelated questions do not silently inherit an earlier topic.
- The model must cite original page numbers and quote the submitted source exactly. Missing/invented quotations or page numbers fail closed.
- A separate stateless check assesses whether the answer follows from its evidence and addresses the content question. Correct applications of an explicit source formula to user-provided numbers are allowed. Instructions embedded in the question are not treated as part of the factual question.
- Unsupported answers go to instructor review. A process-interrupted pending question recovers after two minutes so it cannot permanently block the learner.
- Question grouping retains the most recent examples and canonical group titles, merging only the same explanation need. Confusion spike remains a concentration signal over real questions, not a learning score.

Retrieval now combines pgvector semantic search, SQL full-text search and local lexical context, scoped to the current presentation and content hash. See SUPABASE.md for indexing and retry behavior. The independent answer verifier receives the exact quoted anchors and the cited source sections; an unsupported candidate gets one bounded repair and a fresh verification. An unverified repair is never delivered. Source fidelity and model-based verification reduce errors; they do not prove every natural-language claim.

Short greetings, thanks and polite chat receive private conversational replies without invented citations. A bounded intent router distinguishes presentation questions (including relevant questions the source cannot answer) from unrelated requests. Unrelated requests receive a role/scope explanation, not an instructor escalation. Conversation-only messages remain visible to that participant, while instructor question lists, question counts, confusion signals and report evidence exclude them. The intent router and answer model only receive the current participant's own history.

## Engagement / assessment

Instructor-requested activity generation uses the selected or nearest preceding document. An invalid explicit source id is rejected instead of silently using the first slide. The active types remain multiple choice, true/false and open question. Fixed true/false labels, distinct choice options and empty options for written questions are enforced. The prompt asks for one focused application of the source and avoids unsupported distractor definitions or repeated questions.

Actual response counts/distributions remain deterministic. Neither a popular option nor a written answer is automatically treated as a correct response or learning-success measurement without an answer key/rubric. Live autonomous intervention and semantic grading are separate product work, not implied by this quality upgrade.

## Practice

Exactly three distinct personas are validated before voice/portrait assignment. Their context samples the whole deck rather than only its opening pages. The existing concise, single-paragraph public description remains unchanged.

Participant utterances pass identity/role validation before speech. A semantic role check also catches general teaching-method advice disguised as personal learning preferences. The client may request one repaired turn; a repeatedly invalid turn is not spoken. The explicit repair request distinguishes the last real instructor message from APP_PLAYBACK/APP_CONTEXT notifications. Speech transcripts are compared to the requested line, allowing minor transcription variation while rejecting gross drift.

Closing feedback stays out of participant conversation history. It follows a bounded schema and focuses on recorded dialogue instead of generic praise or invented performance scores. Questions shown in feedback must match a completed participant playback; interrupted or unplayed lines are excluded. The browser microphone was not used by automated tests.

## Reports and Ask Linba

Both use the same evidence builder: exact full-record aggregates plus bounded, diverse detail samples. Ask Linba prioritizes query-relevant records before filling the context with diverse topics/activities. Coverage explicitly describes sampling and truncation. Duration excludes presentation breaks. Review reasons remain available so a provider failure or unrelated question cannot be mistaken for a learning gap.

The independent audit checks numbers, denominators, evidence coverage and unsupported claims about understanding/success. An invalid candidate is repaired once and audited again. Failure preserves the previous report/records and uses the existing retry UI; it does not save a reassuring canned answer. Ask Linba source identifiers are restricted to the actual report sections.

A report records a fingerprint of the evidence it summarized. If follow-up questions or members arrive during generation, the next report read schedules a refresh rather than leaving the old summary indefinitely. Existing generation ids prevent stale jobs overwriting newer ones.

## Evaluation and operations

- `npm run test:ai`: offline runtime, grounding, audit/repair, evidence, state-recovery and report-isolation tests. No provider call.
- `npm run eval:ai`: opt-in paid provider tests using synthetic fixtures only. Output: `output/ai-quality/text-eval.json`.
- `npm run test:rehearsal`: actual Realtime dialogue cases plus the production role check and a separate structured text judge. Output: `output/voice-tests/dialogue-eval.json`.
- `npm run test:rehearsal:audio`: synthetic Turkish audio input, speaker routing and speech rendering. Output is under `output/voice-tests/`.

Use the stored case outputs and human review alongside pass/fail checks. These small regression sets cover the observed failures and representative flows; they are not a statistical production reliability guarantee. The JSON eval files contain synthetic material, not product records.

Final validation for this change: **58 offline checks passed**, **16/16 live text/role scenarios passed**, and **10/10 live rehearsal dialogue scenarios passed** with the selected larger voice model and the final role classifier. Synthetic Turkish audio input/speaker routing also passed. The running application's report-assistant integration passed real answers, a follow-up question, access boundaries, persistence and idempotent retry; its temporary accounts and records were removed. TypeScript, production build and scoped whitespace checks passed. Earlier failures drove the role-classifier and evidence-audit changes; the final artifacts contain the resulting passing runs.

Database migration is now implemented with Supabase Postgres, private Storage and pgvector (SUPABASE.md). Reports, conversations and indexing status are durable. In-flight jobs and diagnostic rings remain process-local; recoverable database states do not constitute a continuously running multi-worker queue.

## Official sources used

- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): strict output contracts and handling refusals/incomplete responses.
- [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices): task-specific, adversarial and regression cases, with human judgment.
- [Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations): conversation and tool-call lifecycle.
- [Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices): operational limits and failure handling.
- [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini) and [GPT-Realtime-2.1](https://developers.openai.com/api/docs/models/gpt-realtime-2.1): supported interfaces, versioning and current rates.
