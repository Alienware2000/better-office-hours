# Existing drawing focus and speech completion

Date: September 20, 2026. Local voice-lane patch. Jev is deferred by David. No real provider calls, student exports, or live-session changes in this investigation.

## Reproduced defect

`boardProvenance` describes current rendered groups with IDs, status, text, and optional source JSON limited to 1,200 characters. Ordinary text groups have no source at all. Detailed curves can exceed that limit, leaving incomplete JSON. The trial adapter reconstructed its available drawing IDs by parsing only that optional source. Consequently, a valid highlight of an existing note or curve could raise `stale_drawing` and withhold the rest of a spoken explanation.

The regression uses the real board store, provenance serialization, and request adapter with a mocked provider. It creates a note and an 80-point curve. The old source-only inventory rejects each highlight. The new adapter accepts both, emits their full speech and final question, and makes one request with no recovery. These are synthetic protocol results, not acoustic or latency measurements.

## Change

Drawing identity now comes from current-page tutor items, excluding unresolved and animation-only items. Optional source supplies panel slot metadata, not proof of existence. Validation retains removal, clear, topic-change, format-change, and occupied-panel checks. Topic comparisons use rendered label normalization and whitespace, matching the store more closely. Current commands still pass the existing disclosure and geometry guards; there is no extra model call on the successful path.

## Validation and limits

- `node scripts/check-concept-lessons.mjs`: real store/serialization/mocked-stream regression passes, including full speech and one request. Missing, removed, old-topic, format-switched, replaced-panel, unresolved, and animation-only references remain rejected.
- `node scripts/check-concept-recovery.mjs`, `check-teaching-intent.mjs`, and `check-teaching-panels.mjs`: pass, including bounded continuation and disclosure protection.
- `npx tsc --noEmit --incremental false` and focused ESLint: pass.
- New isolated trial at localhost:3110, snapshot `.data/voice-trial-3110/run-1789879799663`. Existing 3109 and private data untouched. HTTP 200 verified. Browser/acoustic retest is pending.

The historical 3109 beat-3 rejected command was not retained. This fixes independently reproduced false rejections; it does not establish the cause of that recording or prove all speech endings are fixed. Other scene transitions, layout overflow, narration agreement, and actual audio playback still require review. Public Vercel remains paused.
