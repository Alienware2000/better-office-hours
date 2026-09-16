# Scene direction review

September 16, 2026. Read-only review following David's latest trial feedback. No runtime changes, browser mutations, provider requests, or private-session uploads. The visible board, recent rendered transcript, runtime summary logs, and reveal/guidance source were inspected.

## User correction

David likes the improved drawings and perceives faster responses. Preserve that gain. He misses the intentional, cinematic presentation of the earlier 4.6 experience and finds the current explanations curt. This is qualitative user feedback, not a controlled model ranking or latency benchmark. Explanation-style work can follow the visual priority.

## Evidence

The current projectile page (7) contains note-2 from the preceding Brownian lesson above the new topic, flight curve, launch arrow, component arrows, and a final note. The leftover conclusion is larger and more prominent than the new topic. The scene lacks a clean visual beginning.

Runtime summary for the projectile response: six DRAW commands, animation=false, 74 spoken words. Brownian motion did generate an animation. The projectile narration names decomposition and then asserts that steady horizontal motion plus falling produces a parabola. The diagram labels the components but does not demonstrate their relation or the evolution of the flight.

Current reveal code draws paths using a generic 520ms CSS stroke animation. Text has a deterministic group clock. This orders appearance, but does not itself compose an explanatory sequence or ensure a reveal lands on the relevant phrase. Multiple marks in a group can start together.

Trial guidance targets 25 to 45 words, one to three beats, and one short sentence per beat. The observed response exceeds that word target yet still compresses several conceptual steps into three sentences. This restriction is a plausible contributor to the clipped rhythm, not a proven sole cause.

## Likely continuity failure

The prior takeaway is on a page without its old topic heading. The store starts a fresh topic page only if the current page contains a different reserved topic heading. A heading-free overflow page therefore allows an unrelated topic to append. The rendered group IDs and store condition support this explanation; no raw saved model commands were exported or historical playback reproduced. Topic ownership should survive pagination independently of heading presence.

## Recommended next bounded slice

Keep the current trial model while improving general scene direction and continuity. Begin with one coherent scene; choose sequential teaching beats that develop the relationship, guide attention, and use meaningful motion where it explains change. Separate the new topic from prior overflow notes without deleting earlier pages or student ink. Use short, subordinate captions and stable geometry.

Projectile motion can be a synthetic regression example: establish the launch, demonstrate the components, then show equal-time flight positions with their horizontal/vertical changes. This is an evaluation example, not a hardcoded tutor scene. Keep every graded-work disclosure boundary intact.

Measure first useful audible response separately from completion and animation duration. Compare the same request before/after for scene coherence and pacing. Do not assume a stronger model or longer initial wait is necessary. No implementation of this next slice was started during the review.
