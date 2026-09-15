# Local voice trial

Updated September 14, 2026. David authorized a temporary Opus-low live trial and the necessary drawing-contract extension. This does not select a production model or lift the publication freeze.

## Try it

Open http://localhost:3107 and tap the orb. Say: "This is not homework. Explain simply how a star's light tells us what it is made of. Show me as you explain."

Listen and watch. Interrupt with "I don't understand. Make it simpler." Speak naturally, or tap the orb to interrupt. The top strip reports the last response delay after audio starts. Judge whether the first sentence helps, whether its picture agrees, and whether the smaller step helps after confusion. Escape pauses voice. Sessions and diagnostic exports work as before, within this separate browser origin.

## Restart it

Run `npm run trial:tutor` from the current checkout after installing dependencies. It requires the existing private OPENROUTER_API_KEY in `.env.benchmark.local` and ELEVENLABS_API_KEY/XAI_API_KEY in `.env.local`. Never copy keys into shared docs. The command refuses an occupied 3107 port and never stops another server. Ctrl-C stops this trial.

Each launch copies current tracked and nonignored source files into a fresh ignored `.data/voice-trial/run-*` directory. It shares only installed dependencies, and creates a separate Next build. Trial storage and its generated signing key persist under `.data/voice-trial`; `.data/voice-trial/latest.json` identifies the latest snapshot. Earlier snapshots remain for explicit cleanup after stopping them. Source edits do not automatically enter a running trial. Stop and relaunch to pick up changes. Preserve browser sessions and storage when cleaning old source snapshots.

The launcher copies only the needed provider credentials into the child environment. It does not copy production/cloud/auth configuration or old private sessions. Ports 3105 (original tutor) and 3106 (synthetic review) remain separate. Do not import private histories into this OpenRouter trial without authorization to transmit them.

## What changed

Substantive turns go directly to `anthropic/claude-opus-5` through OpenRouter, using low reasoning, an 8,000-token ceiling, latency-sorted providers, and no SDK retries/provider fallbacks. The ceiling includes reasoning and is not a desired response length. Normal tutor routing remains unchanged without the development-only trial flag. The local greeting remains the existing greeting. Missing-board repair, if invoked, uses the same trial model with one bounded silent call.

Additive trial guidance asks for one or two short everyday-language teaching steps, each with matching visuals. Human PROMPT/PEDAGOGY are unchanged. The shared drawing contract now accepts six literal colors, line labels, and generic `panel` commands. Panels have two page slots, each with reserved heading, figure, and caption rows; one to three circles, boxes, or continuous color bands; optional arrows; and explicit schematic gaps. The model chooses the content. No astronomy scene is hardcoded. Reused IDs revise and animate; a new ID in an occupied slot starts a page while preserving earlier work and student ink.

The trial parser requires valid panel/highlight commands for each spoken beat and rejects references to panels lost after pagination. It fails visibly before speaking an unsupported beat, rather than silently dropping its drawing. This catches structural failures, not all misleading diagrams or incorrect teaching. Graded-work protections remain; layout does not prove semantics.

This deliberately limited trial cannot yet draw detailed anatomy, arbitrary graphs, equations, or full animations. It is a test of understandable first responses, layout, and voice timing. A broader diagram language and production model selection remain open.

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
