# Active task

Updated: 2026-09-14
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 5da2a99671551813d11db0dc542288a813e1f242

## Objective

Trial a strong teaching model with simple explanations, readable matching diagrams, and visible first-audio delay. David authorized the Opus-low local trial and necessary drawing-contract extension.

## Scope and constraints

Local only. Preserve tutor 3105, review 3106, Chrome histories, private exports, and submitted baseline. No production model selection or publication. Human PROMPT/PEDAGOGY remain unchanged. Contract extension is limited to panels, literal colors, and line labels. No private-session transmission.

## Progress

`npm run trial:tutor` launches an isolated source/build/storage snapshot at 3107. Opus low bypasses the extra routing pass. The model supplies generic panels with reserved text/figure regions and meaningful colors. Each spoken beat must have valid panel commands or an existing-panel highlight. Rejected drawings fail visibly before their speech. Existing audio-synchronized writing and interruption remain. A visible timer records detected speech ending to audio playback.

## Decisions

Use one temporary flagship baseline and generic panels. Keep raw model quality, accepted drawings, and measured audio timing distinct. Human judgment decides the next iteration.

## Validation

Five synthetic Opus requests and one TTS request; browser-inspected actual revised board. Panel/layout/stream/disclosure, voice lifecycle/timing, concept, saved-session, diagram, and review checks pass, with TypeScript and focused lint. Raw reports stay private. [Trial guide](TUTOR_TRIAL.md) records observed failures and limitations. Real microphone timing and teaching quality need David's judgment. Panels are a limited trial, not a complete diagram language.

## Next action

David opens 3107, taps the orb, asks a simple concept question, then interrupts with "I don't understand. Make it simpler." Review audible delay, clarity, and matching board together. Keep the running snapshot stable during this test. Do not broaden the model comparison or migrate production yet.

## Blockers

Groundtrack tools remain unavailable. Saved Chrome session review is still queued. A different checkout needs explicit private configuration/report transfer. Live hardware behavior is unverified.
