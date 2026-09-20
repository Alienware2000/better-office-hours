# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: 3b3dceb85eed13bb9a0668423f18ba962365927e

## Objective

Refine the voice/typing interface after David rejected its cluttered, piecemeal appearance. Keep the plain orb. References: ElevenLabs, Nube, Atalanta, and the supplied compact navigation example.

## Scope and constraints

Local voice UI only. Preserve all existing origins, saves, PDFs, provider/voice behavior, independent mute and draft retention. No deployment or frozen-contract changes. Groundtrack unavailable. Prior human acoustic/iPad review remains open.

## Progress

Unified typing/mic controls, compact composer with one focus treatment, quiet entry links, welcome hierarchy, and collapsed trial diagnostics implemented. Typecheck passed; lint and browser inspection underway.

## Decisions

Interpret references through spacing, typography, hierarchy, and integrated controls. Keep paper-board identity and original orb. No scenic background, added dependencies, model changes, or decorative animation. Trial model and speech-to-audio timing remain accessible in a disclosure. Typed output still includes narration.

## Validation

Pending desktop/mobile visual and draft interaction checks. Prior 16-check offline logic baseline remains in evaluations/2026-09-20-typed-input.md.

## Next action

Inspect isolated 3114 preview, refine layout, verify composer and diagnostics without provider calls, then checkpoint for David's review.

## Blockers

Existing live sessions lack verified backups; do not reload/restart them. Real acoustic/iPad review remains pending.
