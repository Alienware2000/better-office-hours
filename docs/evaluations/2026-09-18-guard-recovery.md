# September 18: interrupted lesson after drawing rejection

## Evidence

David clarified that audio finished the first sentence. The screenshot had shown only part of the caption. The 3108 log records `disclosure_boundary` at beat 2, elapsed 8.048 seconds, first visual 5.756 seconds, cancelled=false. The page displayed a generation error below the board. This identifies an application validation failure, not a demonstrated TTS truncation. The exact rejected command was not retained, so its correctness cannot be reconstructed.

Investigation reproduced a separate guard false positive: numeric givens written as `v = 12 m/s` passed while `v = 12\,\mathrm{m/s}` failed. The same mismatch affected TeX degrees. This is a proven formatting defect, not proof of what failed in David's session.

## Local changes

- Normalize a narrow set of unit/spacing/degree presentation macros before testing numeric givens. Symbolic relationships and unknown macros remain restricted. This does not establish whether a value was actually given; existing teaching/provenance rules still apply.
- Trial structured lessons now allow one continuation request after a visual validation failure. Keep only the accepted prefix, preserve its move and visual mode, and validate the combined lesson using the same rules and drawing context.
- Never emit the rejected drawing or its narration, repeat accepted speech, change the teaching move, exceed the three-beat limit, or retry a second rejection. Abort and transport failures are not retried. If recovery fails, existing error handling drains accepted audio.
- Successful responses use the existing first-beat streaming path with no extra call. A rejected response can cost one extra request and additional waiting. No model or voice switch, shared contract change, or board redesign.

Implementation: `lib/agent/concept-stream.ts`, `concept-response.ts`, `teaching-intent.ts`, and `grok.ts`.

## Checks and limits

Offline teaching-intent, concept-recovery, concept-lessons (including the actual trial adapter), and teaching-panels checks passed. Coverage includes early delivery, coalesced streams, rejected-content withholding, allowed numeric TeX givens, immutable teaching intent, no repeated opening, retry limit, cancellation, and downstream parsing. TypeScript, focused ESLint, and diff checks passed.

One real provider call with a synthetic slope problem completed two visual beats and its closing question without recovery. First speech text was ready at 6.760 seconds; generation finished at 10.897 seconds. This was not an audible-latency measurement, acoustic test, or replay of private student input. Provider usage cost was not returned by this probe. Ignored evidence: `.data/voice-trial-3108/evaluation/guard-smoke.json`.

## Runtime and next check

3108 export produced no usable backup; David confirmed no download appeared. Preserve 3107/3108 runtimes, origins, and data. Their code is unchanged by these source edits. Patched isolated trial: http://localhost:3109, launched with `npm run trial:tutor -- --port 3109`. Snapshot/log are under `.data/voice-trial-3109`; landing page loaded successfully without activating the microphone. Existing private history was not migrated.

Next: human test in a fresh 3109 session, checking whether the explanation continues through its closing thought. Correlate validation/recovery events with playback completion if it stops again. The original rejected payload and end-to-end acoustic quality remain unknown. Groundtrack tools unavailable; local checkpoint is authoritative.
