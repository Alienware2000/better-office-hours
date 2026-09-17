# Local voice trial

Updated September 15, 2026. David authorized a temporary Opus-low live trial and the necessary drawing-contract extension. This does not select a production model or lift the publication freeze.

## Try it

Open http://localhost:3107 and tap the orb. Say: "This is not homework. Explain simply how a star's light tells us what it is made of. Show me as you explain."

Listen and watch. Interrupt with "I don't understand. Make it simpler." Speak naturally, or tap the orb to interrupt. The top strip reports the last response delay after audio starts. Judge whether the first sentence helps, whether its picture agrees, and whether the smaller step helps after confusion. Escape pauses voice. Sessions and diagnostic exports work as before, within this separate browser origin.

## Restart it

Run `npm run trial:tutor` from the current checkout after installing dependencies. It requires the existing private OPENROUTER_API_KEY in `.env.benchmark.local` and ELEVENLABS_API_KEY/XAI_API_KEY in `.env.local`. Never copy keys into shared docs. The command refuses an occupied 3107 port and never stops another server. Ctrl-C stops this trial.

Each launch copies current tracked and nonignored source files into a fresh ignored `.data/voice-trial/run-*` directory. It shares only installed dependencies, and creates a separate Next build. Trial storage and its generated signing key persist under `.data/voice-trial`; `.data/voice-trial/latest.json` identifies the latest snapshot. Earlier snapshots remain for explicit cleanup after stopping them. Source edits do not automatically enter a running trial. Stop and relaunch to pick up changes. Preserve browser sessions and storage when cleaning old source snapshots.

The launcher copies only the needed provider credentials into the child environment. It does not copy production/cloud/auth configuration or old private sessions. Ports 3105 (original tutor) and 3106 (synthetic review) remain separate. Do not import private histories into this OpenRouter trial without authorization to transmit them.

## What changed

Substantive turns go directly to `anthropic/claude-opus-5` through OpenRouter, using low reasoning, an 8,000-token ceiling, latency-sorted providers, and no SDK retries/provider fallbacks. The ceiling includes reasoning and is not a desired response length. Normal tutor routing remains unchanged without the development-only trial flag. The local greeting remains the existing greeting. Missing-board repair, if invoked, uses the same trial model with one bounded silent call.

Additive trial guidance asks for one to three short everyday-language teaching steps, each with matching visuals. Human PROMPT/PEDAGOGY are unchanged. The shared drawing contract now accepts six literal colors, line labels, and generic `panel` commands. Panels have two page slots, each with reserved heading, figure, and caption rows; one to three circles, boxes, or continuous color bands; optional arrows; and explicit schematic gaps. The model chooses the content. No astronomy scene is hardcoded. Reused IDs revise and animate; a new ID in an occupied slot starts a page while preserving earlier work and student ink.

The current trial accepts the full existing DRAW/ANIM vocabulary, including LaTeX equations, curves, axes, and motion. Panels are optional for suitable comparisons or processes. Requested ungraded mathematics should appear in the same turn, with symbols explained simply. Every spoken beat must have a renderable drawing, valid highlight, or animation. Missing, invalid, disallowed, and known stale visuals fail before their paired speech. This is structural validation, not proof of semantic agreement or scientific accuracy.

The initial panel-only restriction was an agent implementation decision, not David's product requirement. It has been removed. Switching between fixed panels and free geometry starts a fresh page and preserves earlier work/ink. A complete design language and production model selection remain open.

## Timing and evidence

The visible `response_latency` diagnostic starts at the last detected speech frame and ends at the browser audio `playing` event. It includes endpointing, transcription, model generation, synthesis, and playback preparation. It estimates speech ending; it cannot detect physical speaker output or judge usefulness. Existing `first_audio` remains request-to-playback. A microphone simulation verifies delayed STT/playback and duplicate-event handling. Real acoustics and interruptions still need David's test.

Five synthetic Opus requests and one short ElevenLabs synthesis were made during this slice. The first lesson mislabeled a color band as gas; guidance was tightened. A later confusion response silently lost its second drawing under the permissive parser; strict per-beat validation was added. An attempted provider-raw interceptor captured only accepted output, so the exact rejected command is unknown; do not infer it from the transcript. Subsequent accepted output used two schematic gap-pattern panels. No private session was transmitted. Reports/audio remain ignored under `.data/voice-trial/evaluation`.

A revised lesson before the final parser/provider settings had speech/board data at 6.314 seconds and full generation at 8.699 seconds. These are client HTTP observations, include local server overhead, and are not first audible response timings or a model ranking. The isolated TTS endpoint returned a 97,010-byte MP3 in 2.318 seconds, also not microphone-to-audio latency. With the final settings, the smoke test accepted both panel beats; speech and board data were ready at 5.700 seconds and generation ended at 8.466 seconds. The private `final-smoke.json` preserves the output. Actual rendered revised astronomy panels were inspected in the browser with separate captions and visible color gaps.

Validation: teaching-panel parser/layout/color/pagination/ink/disclosure checks; all stream prefixes withhold invalid-beat speech; existing concept, voice lifecycle, saved-session, diagram/motion, and review regressions; TypeScript and focused lint. Panel revisions retain writing reveal. The trial's grammar is still experimental, so a rejected drawing may end a turn with a retry message. Do not claim universally good diagrams, reliable pedagogy, or a measured latency improvement.

## September 15: live feedback and voice endings

David tested the trial and reports that explanations and diagrams feel good, though rendering still needs improvement. He reports an odd unfinished-sounding voice ending. The local browser showed a last-response delay of 8.2 seconds; this single observation is not a benchmark or proof of improvement.

Read-only inspection of the paused trial's visible transcript found complete written endings, including the standalone final sentence "These gaps are just schematic." Completed model turns had two drawing commands, while multiple sentence clips were synthesized. The previous client called takeSpeechChunks before honoring a completed structured speech boundary, isolating that short caveat in its own TTS request. It now honors the complete beat first. Legacy unstructured streams still release sentences early. This removes unnecessary within-beat voice restarts without holding the first completed beat for the rest of the response.

Trial guidance now asks for a complete plain-language takeaway, integrates caveats, and avoids tacked-on miniature disclaimers. Model, voice, and playback rate are unchanged. No filler closing, artificial silence, new model call, or speech-provider call was added. The human-written prompt is unchanged.

New local diagnostics record playback_end with ended/interrupted/error, request, clip number, media position, duration, and elapsed time from audio creation (including buffering). Duplicate/late events cannot overwrite the outcome. They do not prove that the synthesized audio included every phoneme or that the physical speaker played it. No old audio was retained, and past end events cannot be reconstructed. The session export UI was invoked, but no downloaded artifact was located; evidence came from rendered transcript text and local logs, not an assumed exported file.

The actual voice-hook simulation verifies two complete beats use two clips rather than four sentence clips, first playback starts before the second beat arrives, and natural ending/cancellation/error each produce exactly one diagnostic. Existing voice/saved-session regressions, TypeScript, and focused lint pass. The source changes were copied into the already paused isolated trial, preserving its origin and storage. David should retry to judge prosody; this is a targeted fix for fragmentation, not proof that the reported acoustic issue is fully resolved.

## September 15: broader session review and restored diagrams

David's later test supersedes the initial positive assessment. Read-only review of the paused trial's rendered transcript and board found repeated box flows across subjects. He explicitly requested an equation, agreed to the tutor's offer, and still received words. Trial guidance prohibited equations, geometry, and ANIM, and its validator accepted only panels/highlights. That trial cannot fairly establish the model's diagram capability.

Removed those restrictions while retaining novice language, graded-work protections, and complete speech beats. A shared requestAnimationFrame clock now controls glyph opacity for each active group, so labels reveal continuous prefixes rather than independent CSS animations. Delay metadata remains available to synthetic review playback. An incoming queued group no longer resets the current group's completion timer. The exact historical browser paint defect was not captured.

A synthetic wave response exposed oversized legends spilling onto another page and literal TeX spacing in prose. Diagram legends now use compact prose size/wrapping and normalize spacing commands; headings use the diagram heading size from the start. Pagination finalizes label layout before archiving a partially processed batch. Existing equations retain mathematical typesetting.

Two bounded synthetic Opus requests produced curves, wavelength markers, equations, and legends. No private transcript or microphone audio was sent, and no TTS was requested. Final client observations: first board data 6.941 seconds, first speech text 6.942 seconds, full response 11.083 seconds. These include local HTTP overhead, not speech-end-to-audio latency. Ignored rich-smoke.json and rich-smoke-initial.json retain accepted output. The final rendered sample was inspected with a one-page wave/equation/legend. Model semantics still need work: the response used a mass-times-speed expression without stating its applicability and an imprecise ripple analogy. Do not call this a scientifically validated lesson or a model ranking.

Browser fixture sampled 297 frames, including 165 partial-label observations, with zero prefix-order violations and complete final labels during repeated renders. Offline checks cover graphemes, repeated renders, equation completion, compact legends, label separation, streamed rich visuals, disclosure/stale-target rejection, and page/ink preservation. Existing concept, voice, motion, math, review, and saved-session checks pass, as do TypeScript and focused lint. The separate check-board script expected port 3100 and failed before reaching a provider; it was not retried as another paid probe.

Changed source was copied into paused 3107. The transcript and session identity remain, but the update incident below lost its board history. Temporary browser fixtures were isolated from David's session. Next human check: request an equation and a spatial explanation, then judge relevance, simplicity, rendering order, and complete voice endings. Arbitrary model layouts, semantic mistakes, and actual acoustics remain open.

### Development-refresh incident

Final verification found the original paused board blank after store.ts was replaced. A fresh tab also loaded an empty board, confirming autosave persisted the reset. The transcript remained intact. A temporary local recovery inspection found no board in the initial or parked snapshots; it was removed. Old drawings were not recovered, and this was disclosed to David. Do not claim the session was fully preserved or fabricate reconstructed originals.

The board store now belongs to a development-only window object across module replacement, preserving state, revision, and subscriptions, including old callbacks. It is per tab, not persistent or cross-user storage; production remains module-local. check-board-refresh.mjs verifies reload preservation, student ink, old callbacks, listeners, and tab isolation. This prevents recurrence of the observed reset, but cannot recover the old lost state. Future live-runtime changes should begin with a verified recovery export, not just a paused orb.

## September 17: incomplete responses

The patched trial is on **http://localhost:3108**, with independent sessions/storage. Start it with `npm run trial:tutor -- --port 3108`; the default remains 3107. The old 3107 was deliberately left unchanged because recovery export could not be verified. A late generation error now lets already accepted audio finish, while incomplete output remains withheld. Pause and barge-in still stop playback. Precise visual failure codes help diagnose future incomplete diagrams. See [investigation](evaluations/2026-09-17-incomplete-responses.md) for tests and the limits of the single synthetic provider sample. Human acoustic and full-diagram quality verification remain pending.
