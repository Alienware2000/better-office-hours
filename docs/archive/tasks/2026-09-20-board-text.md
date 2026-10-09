# Active task

Updated: 2026-09-20
State: complete
Branch: lane/post-hackathon-local
Base: 9bd4e0398876ca85d05559326d41b87defd3b905

## Objective

Board text consistency; keep model fixed and first-audio latency as guardrail.

## Scope and constraints

Renderer only. Preserve explicit emphasis, student ink, voice timing, frozen contracts and live 3114/3115. Vercel paused. Groundtrack unavailable.

## Progress

Removed arbitrary glyph coloring, including cached math in SVG/snapshot. Short connective prose keeps spaces. Details: evaluations/2026-09-20-board-text.md.

## Decisions

Authored mark color only. No label-placement change without a reproduced failure. UI foundation archived.

## Validation

Math, teaching-repairs, board-writing, diagrams, diagram-motion, typecheck/lint pass. Actual renderer inspected at 360/640px. No provider/audio benchmark.

## Next action

Review 3116 (1770053), then reproduce cumulative annotation clutter before changing placement/lifecycle. 3114/3115 untouched.

## Blockers

Acoustic/iPad review and verified session recovery remain open. Old baked prose geometry is not migrated.
