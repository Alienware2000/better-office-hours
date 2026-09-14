# Active task

Updated: 2026-09-14
State: in_progress
Branch: lane/post-hackathon-local
Base: 189cc7f5028ca8d2a18c9762d8dea8371fabf3cf

## Objective

Find a strong, fast teaching model with accurate whiteboard use. Quality first, then latency. Give David direct visibility and his own review controls.

## Scope and constraints

Local only. Preserve the tutor at 3105, Chrome sessions, private exports, and submitted baseline. No model-default change without comparison and David's choice. PROMPT/PEDAGOGY and lib/types.ts stay frozen. No private-session transmission to new providers.

## Progress

Local review server at 3106 shows thirteen synthetic reports, raw/accepted output, reconstructed boards, timings, live tests, and saved human ratings. Start with npm run review:tutor; see [walkthrough](TUTOR_REVIEW.md). Eleven earlier pilot requests plus two visible biology requests completed. Opus/Astra/Fable remain candidates; no model selected. The board policy is recorded, not implemented.

## Decisions

Keep raw output, parser acceptance, rendered layout, and audio timing distinct. Same prompt/schema; explicit budgets/effort/provider settings; no hidden retries/fallbacks. Provider selection is recorded, not pinned. Human quality review is required. New progress snapshots contain synthetic speech/board data, not hidden reasoning or audio.

## Validation

Offline benchmark and review-server checks cover parsing, isolation, persistence, rendering, request bounds, live progress, and cancellation. Browser verified board stages and a paid two-request biology batch. [Biology results](evaluations/2026-09-14-visible-biology.md) record timings, costs, and animation/page separation. Speech cache checks and browser playback passed; listening feedback remains pending. No runtime/frozen file changes.

## Next action

David authorized testing Opus/Astra/Fable aloud. The review page now plays their saved astronomy answers using 12 cached same-voice clips, with board stages tied to clip playback. Next: David judges listening quality, then test fresh end-to-end latency. Replay does not simulate model waiting. No runtime switch; diagram styling remains deferred.

## Blockers

Groundtrack tools remain unavailable. Chrome session inventory and reported stars-related mismatch are unverified. Latency, all-turn board coverage, and provider/parser compatibility remain unresolved. Private reports/config need explicit transfer in a different checkout.
