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

Math, diagram/motion, review/speech checks, lint, and TypeScript passed. Browser bounds show no text collisions in both reported final astronomy boards. Model output/audio and frozen files are unchanged; local renderer files changed.

## Next action

Local fixes prioritize label separation, reserve server font slack, and keep prose out of math. Review warns on unsupported line labels. David also rejects complex language and narration about colors absent on screen. [Evidence and next proposal](evaluations/2026-09-14-visual-teaching-review.md): coordinate literal colors/line labels in the frozen drawing contract, then evaluate simpler teaching with matching visuals and fresh first-audio timing. No new provider calls or model switch.

## Blockers

Groundtrack tools remain unavailable. Chrome session inventory and reported stars-related mismatch are unverified. Latency, all-turn board coverage, and provider/parser compatibility remain unresolved. Private reports/config need explicit transfer in a different checkout.
