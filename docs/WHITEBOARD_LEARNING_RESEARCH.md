# Drawing, cinema, and remembering an explanation

September 16, 2026. Companion to [the board architecture research](WHITEBOARD_RESEARCH.md), following David's request to study Manim, cinema, YouTube explainers, short videos, notes, and retention. These are sourced findings and proposed applications, not implemented tutor behavior or measured BOH learning gains.

## The design opportunity

The board can combine the clarity of a carefully directed explainer with a conversation that responds to the learner. Its job is to make the important relationship easy to see, give the learner time to understand it, and leave something useful to revisit.

There are three different outcomes to measure: attention, understanding, and later retention. A viewer can enjoy a polished explanation without being able to apply it. A student may understand while watching but struggle a week later. The research below helps separate these questions.

## What the literature actually supports

**Watching a diagram develop can help, but the presentation matters.** Fiorella and Mayer studied a narrated Doppler-effect lesson in four experiments. Benefits varied with prior knowledge and the instructor's visible presence. Drawing with a visible hand improved transfer in one experiment; drawing without the hand did not significantly improve transfer in another. The authors discuss social and attentional cues and caution against interpreting the null finding as proof that a hand is always necessary. This does not establish that our typewriter effect, an animated cursor, or a simulated hand improves learning. [Original paper, online 2015, journal issue 2016](https://bootcampmilitaryfitnessinstitute.com/wp-content/uploads/2015/11/effects-of-observing-the-instructor-draw-diagrams-on-learning-from-multimedia-messages-fiorella-meyer-2015.pdf).

**Explainer-video craft has evidence for engagement.** Guo, Kim, and Rubin analyzed 6.9 million viewing sessions across four edX courses. Shorter videos and Khan-style tablet drawing were associated with higher engagement. Their outcomes included viewing duration and assessment attempts, not a controlled measure of long-term learning. Their recommendation for sub-six-minute chunks is not evidence for a universal 30-second explanation or a benefit from rapid cuts. [Original study, 2014](https://eddatax.fed.cuhk.edu.hk/wp-content/uploads/2016/06/How-Video-Production-Affects-Student-Engagement-An-Empirical-Study-of-MOOC-Videos.pdf).

**Modern short explainers can help, with uneven results.** Adler and colleagues tested course-matched physics videos with 139 college students and an online replication with 215 participants. The classroom sample showed quiz benefits, larger among students with higher GPA; the online sample showed a benefit for only one of four videos. Overt attention did not consistently explain performance. This supports studying when particular videos help particular learners. It does not validate Shorts-style editing as a general retention technique. [Original study, 2025](https://link.springer.com/article/10.1007/s10639-024-13292-9).

**Cinema has a relevant theory of visual continuity.** Tim Smith's attentional theory explains how editing guides attention and preserves perceptual expectations across changes of view. It addresses film perception, not a direct test of learning on whiteboards. [Paper, 2012; repository manuscript dated 2011](https://ualresearchonline.arts.ac.uk/id/eprint/21187/2/6679.pdf). Our application is an inference: preserve the object a learner is following, cue the next focus, and make a change of view understandable. An equation appearing far away while the diagram jumps to another page works against that goal.

**Drawing something yourself is a different learning activity from watching it appear.** Wammes, Meade, and Fernandes found a recall advantage for drawing over writing words across seven experiments. These were memory experiments, not demonstrations that drawing any advanced concept guarantees understanding. [Original research record, 2016](https://uwspace.uwaterloo.ca/items/a8b52734-18f3-4527-8be2-008a105c85f2). For BOH, this motivates testing small learner-generated marks or sketches when helpful. Tutor-generated ink must never count as evidence that the student can produce the idea.

**Remembering requires opportunities to retrieve.** Roediger and Karpicke compared recall practice with restudying prose. Restudy could look better on an immediate test, while prior retrieval produced better delayed recall after two days or a week. [Original paper, 2006](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf). This supports checking what the learner can explain later rather than relying on an immediate feeling of clarity. It does not require a quiz after every sentence or withholding an explanation of an unfamiliar concept.

The earlier report also covers multimedia signaling, spatial/temporal alignment, segmentation, and the limits of animation. [Read that evidence and its caveats](WHITEBOARD_RESEARCH.md#what-learning-research-changes-about-the-design). A further mini-lesson experiment reported segmentation benefits conditioned on learning preference, another reason to avoid claiming a single ideal pacing formula. [Richardson, 2023](https://journal.alt.ac.uk/index.php/rlt/article/view/2900).

## How to borrow from cinema and Manim

The following are BOH design hypotheses informed by those sources and Manim's animation model. They are not experimentally established rules for this product.

| Technique | Proposed board behavior | What to watch for |
| --- | --- | --- |
| Establish the scene | Begin with the small set of objects needed to orient the learner. | First speech must be useful; do not wait silently for a whole scene plan. |
| Direct attention | Emphasize one relevant feature as it is named; keep context subdued and readable. | A pointer should identify something specific, not wander for decoration. |
| Preserve continuity | Keep the same object, symbol, and quantity identity across revisions and representations. | Avoid unrelated page changes, label teleportation, or changing color meanings. |
| Motivate a transition | Transform or connect a diagram quantity into its equation term when that connection is being explained. | A smooth morph must not imply an invalid mathematical equivalence. |
| Prepare, change, then hold | Tell the learner what to notice, show the meaningful change, and leave a stable frame. | Holding time follows the content and learner; no universal millisecond rule. |
| Use visual contrast | Compare before/after states when the difference is the concept. | Keep shared scale and orientation unless a change is explicit. |
| End a small explanation coherently | Leave a readable diagram, needed equation, and concise takeaway. | Do not let all annotations pile up or end with an isolated technical fragment. |

Manim Voiceover's bookmarks demonstrate how an animation action can attach to a particular spoken word. That is useful inspiration for narration-aware events. Our current clip-start synchronization is coarser; accurate word events would need alignment data. Manim itself stays outside the live conversation runtime. [Official documentation](https://voiceover.manim.community/en/stable/quickstart.html).

Mathematical or physical motion also needs its own rules. Easing an emphasis ring can be pleasant; applying the same easing to a supposedly constant-speed object changes the demonstrated relationship. Reveal speed, attention transitions, and simulation time should be independently controlled.

## Notes and playback should serve different moments

During an explanation, the board directs attention in time. Afterward, it must remain understandable as a static note. A frame that made sense for one spoken second may be a poor revision page.

Proposed design: preserve a few meaningful settled states with their explanation links, using the existing page/history/replay foundation. A useful note should identify the question, label the important relationship, show any necessary equation and assumptions, and retain the student's own contributions distinctly. Temporary pointer halos and transitional clutter should not become permanent notes. Preserve the original session; do not destructively rewrite it into a summary.

This is a proposal for organizing existing board history, not evidence that generated notes alone improve retention. The student still needs opportunities to explain, sketch, or apply the idea. A narrow clarification can receive a direct answer; participation should follow the learner's need, not an enforced performance ritual.

## What to take from Shorts

Study clear openings, immediate visual orientation, concise wording, a recognizable visual style, and a satisfying explanation of one idea. Those are promising craft choices. The studies reviewed here do not establish that frequent cuts, constant motion, high narration speed, or an arbitrary short duration improve retention in a live tutor.

A useful opening can reveal the puzzle or the relevant object without becoming a clickbait hook. A concise explanation still needs the causal link the student is missing. Rich diagrams and breathing room can coexist with quick first audio.

## How we can test this without confusing polish with learning

Start with the isolated playback prototype proposed in the architecture report. Use matched content so that a visual comparison is not also a model comparison. Test one substantial change at a time, such as purposeful attention cues or stable representation transitions.

Record preference and ease of following, but also ask the learner to explain the relationship unaided and handle a small changed example. For a later learning study, include a delayed check with agreed participation and timing. No reminder or study schedule is created by this document. A few successful demonstrations would guide design, not prove a learning effect.

Keep exposure time, narration content, prior knowledge, and topic difficulty visible in comparisons. Counterbalance order or use equivalent cases to reduce the advantage of seeing the same explanation twice. Have correctness reviewed independently of animation polish. Preserve quick first useful audio, voice interruption, readable resting states, and separately authored student ink throughout.

The next prototype should therefore demonstrate three things together: a well-directed explanation, a useful settled note, and a natural opportunity for the learner to use the idea. That gives us something concrete to judge before choosing a larger architecture change.
