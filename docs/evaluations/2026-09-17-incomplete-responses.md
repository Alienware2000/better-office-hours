# Incomplete trial responses, September 17

## Report and evidence

David reports sparse diagrams compared with Grok and speech ending as though the thought is unfinished. The paused 3107 session shows a first-stage setup, with ground and one vertical arrow, and only opening narration. This does not establish complete model capability.

Read-only local server review found two deep requests ending with `Tutor visual incomplete`, after first visual delivery. The requests were not cancelled. Visual readiness was 6,491 ms and 10,091 ms; failure occurred at 9,779 ms and 13,035 ms. Those are server-request timings, not speech-end-to-audio latency. Historical logs recorded only `request_failed`, so the exact validation/provider cause is unknown. No old playback positions or retained audio were recovered. Private transcript/PDF content is not copied here.

Source inspection found that a late SSE error escaped runPass immediately. sendUtterance then aborted the active playback controller, even if an earlier validated beat was still speaking. This is a reproducible mechanism for mid-sentence audio cutoff. It does not prove every reported cutoff had that cause.

## Local correction

A generation failure now lets already accepted speech/visual beats finish before reporting the error. It does not flush unfinished speech, apply trailing unpaired drawings, synthesize a filler ending, or run silent diagram repair after failure. Pause, learner speech, and a new turn retain cancellation. A superseded error cannot cancel a newer turn. Returning the pending audio failure separately ends the model deadline immediately, so that deadline cannot interrupt the audio drain.

Failure diagnostics correlate generation_error with the request and playback_end. Strict visual validation now identifies missing visuals, excess commands, invalid drawings, disclosure rejection, stale targets, and invalid animation, with the failing beat number. Server logs include a numeric provider status when available. Rejected commands and provider content are not logged. Disclosure rules remain in force; the human prompt and shared types are unchanged.

This fixes the demonstrated playback mechanism, not arbitrary model composition or the unknown historical generation error. No board redesign, prompt tightening, or model switch was introduced.

## Validation

The actual voice-hook simulation verifies a late stream error during playback: accepted audio finishes naturally, incomplete trailing speech/visuals stay withheld, and error presentation follows playback. Pause and a new turn cancel the old queue without leaking its error or stopping new audio. Existing voice lifecycle, concept streaming, and teaching-panel checks pass. New validation tests assert safe failure codes/beat indices. TypeScript, focused ESLint, and diff checks pass.

One bounded real Opus-low request used a synthetic graded-orientation example with different givens, no private history/PDF and no TTS. It completed normally with two visual beats: object/support, then a path and stated event marker. First speech/board text was ready at 5,321 ms; full generation was 9,063 ms. The provider reported $0.108265 usage. This one sample did not reproduce the failure and is not a latency benchmark, acoustic test, model ranking, or proof of good rendering. Raw synthetic evidence stays ignored at `.data/voice-trial/evaluation/incomplete-diagnosis.json`.

## Runtime and next observation

Two attempts at the existing UI JSON export yielded no accessible artifact; the download wait timed out. No claim of a verified recovery export. 3107 and its data/source are unchanged.

The launcher now accepts `--port`, using independent storage/signing for each alternate port. `npm run trial:tutor -- --port 3108` starts the patched snapshot. The new 3108 landing UI was checked; microphone was not activated. Its log is `.data/voice-trial-3108/server-2026-09-17.log`, and latest.json identifies its runtime. 3105/3106 were not changed. No provider call through the new UI or acoustic verification yet.

Next: David tests a fresh session on 3108. If generation fails again, correlate the error code/beat with playback_end before changing validation or models. If a complete response is still too sparse, compare complete outputs with equivalent visual capabilities. Keep first useful audio, quality, and cost together; the larger board research prototype remains deferred.
