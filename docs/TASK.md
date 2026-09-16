# Active task

Updated: 2026-09-16
State: complete
Branch: lane/post-hackathon-local
Base: f3b85edcce071056ab8eb467adcd0685fd6457f4

## Objective

Research a robust, intentional teaching board, with relevant systems, learning research, and a concrete direction grounded in the current implementation.

## Scope and constraints

Research and local docs only. Preserve 3105/3106/3107 and private history. No publication, migration, dependency install, or runtime change. Human prompts and shared types remain frozen.

## Progress

[WHITEBOARD_RESEARCH](WHITEBOARD_RESEARCH.md) compares systems and proposes a prototype. David's follow-up is covered in [learning research](WHITEBOARD_LEARNING_RESEARCH.md): instructor drawing, cinema, short videos, learner drawing, and retention. Evidence is separated from design hypotheses.

David's correction: quality includes composition, meaningful color, linked mathematics, and richness, beyond reveal timing. Grok screenshots are a reference, not proof of accuracy or a model ranking. Audit found existing constraint/layout capabilities; symbol-based math colors do not establish quantity-to-diagram identity. Prior trial checkpoint archived.

## Decisions

Recommend extending current SVG/math/voice runtime with explicit scene relationships, visual roles, measured layout, and narrated events. No full rewrite or serial multi-model pipeline. Proposal only, not an implementation decision.

## Validation

Primary sources and current code reviewed. Context and diff checks pass after compacting startup notes. No provider calls, acoustic tests, competitor trials, or performance gains claimed.

## Next action

Review research with David. Proposed slice: isolated synthetic playback comparison with stable scene identity, quantity-linked styling, measured layout, and purposeful events. Do not silently start a migration. Chrome-session review remains queued.

## Blockers

Groundtrack unavailable. Earlier live update lost trial drawings; transcript survived and refresh safeguard is tested. Verify recovery export before live edits. Word-level synchronization requires alignment data absent from the MP3 TTS route.
