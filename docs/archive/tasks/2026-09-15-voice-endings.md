# Active task

Updated: 2026-09-15
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 747c5b352024260d08f7d7eb3190ac651fcf3547

## Objective

Preserve the improved Opus-low teaching trial and make its spoken endings feel complete. David tested 3107: explanations and diagrams felt good, rendering can improve, but the voice sounded unfinished at the end.

## Scope and constraints

Local only. Preserve 3105/3106, the paused 3107 session, Chrome histories, and private data. No production model selection or publication. Human PROMPT/PEDAGOGY remain frozen. No private-session transmission.

## Progress

Structured speech boundaries now queue each complete teaching beat as one audio clip, instead of splitting its sentences into isolated fragments. The saved visible transcript ended with a five-word caveat; existing logs showed separate TTS requests. Trial guidance asks for a complete takeaway and integrated caveats. Playback diagnostics now distinguish natural ending, interruption, and failure, with clip position/duration.

## Decisions

Keep the model, voice, playback speed, and diagram design stable. Do not add arbitrary silence or claim proven acoustic truncation. The previous session has no retained audio or end-event diagnostics; the exact audible fault remains unconfirmed.

## Validation

Simulated streaming checks preserve whole beats and early first playback; natural, interrupted, and failed clips record one ending each. Existing voice lifecycle and saved-session checks, TypeScript, and focused lint pass. No new provider calls. See [trial guide](TUTOR_TRIAL.md).

## Next action

David retries a response in the updated 3107 trial. Judge whether the ending sounds complete. If it still cuts off, inspect playback_end events alongside the spoken words before changing TTS. Preserve the successful teaching style; broader rendering work follows this check.

## Blockers

Groundtrack tools unavailable. Physical audio/prosody remains a human check. Earlier Chrome session review remains queued. New checkouts need explicit private configuration/report transfer.
