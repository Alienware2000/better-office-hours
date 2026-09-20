# A STEM board learners can think on

September 20, 2026. Direction and acceptance framework for an open-ended STEM visual tutor. David clarified that projectiles, matrices, reactions and other named topics are examples, not the scope or a menu of supported scenes. This extends [the visual-board research](WHITEBOARD_EXPERIENCE_RESEARCH.md) and [DESIGN](DESIGN.md). It does not select a new model, approve live integration, or reopen public deployment.

## The experience

The vision is a tutor that can compose an explanation for an unfamiliar STEM question, choosing a useful visual representation and developing it with the learner. As in the 3Blue1Brown craft analysis, objects retain meaning through an operation or change, making the relationship behind the notation visible. This is an open-ended capability ambition, not evidence of universal coverage.

Voice leads. The board holds diagrams, necessary notation, labels, assumptions and key ideas. Typing supports the same experience. A student can point, write, ask about a feature and revise their own work without losing shared context. Humanities remains future scope; the foundation should not bake in physics-specific assumptions.

Choose the representation from the teaching relationship, independently of the subject label. A matrix, circuit and biological network may all need connectivity, but an arrow means something different in each. The model supplies semantic content and meaning. The application supplies a consistent visual language, layout constraints and supported interactions. Never retrieve a fixed topic scene as live teaching behavior.

Use a shared visual language: readable prose, real LaTeX for notation, consistent quantity colors, nearby labels, generous working space and stable object identities. A diagram and its equation should remain together when they explain the same relationship. Color supplements labels and position. Reveal in reading order, then hold the completed idea. Start a new page for a new reasoning context or genuine overflow, preserving earlier pages and ink.

David reaffirmed that teaching must always actively use the board. An explanation should draw, annotate, transform or visibly focus its relevant representation. Referring to an existing object can be enough; adding more content on every turn would create clutter. Diagrams, images, labels and LaTeX should have a clear teaching purpose and agree with the narration. This reinforces DESIGN's broader board-use requirement; it is not a claim that current coverage is complete.

Treat clutter prevention as a composition requirement. Keep one clear focal idea, group related objects, leave space for student work, and check labels and equations at the actual display size. When a page is full, continue on a preserved new page or deliberately refocus the existing content. Do not squeeze everything into smaller lettering, pile new labels onto old ones, or erase student work to make room. A numeric object limit alone cannot establish clarity.

The direction is defined enough to test. For the next iteration, prioritize failures that make an explanation wrong, hard to follow, slow or difficult to interact with. Test an unfamiliar topic and a learner follow-up in the complete experience, including whether the student can explain or apply the idea afterward. That is an observational learning check, not proof of lasting retention. Further aesthetic variation and broader canvas features should follow observed needs rather than extend this design study indefinitely.

## Capability families and coverage

Evaluate general representation families across unfamiliar topics and follow-up questions. Use ungraded synthetic examples first. A graded variant must preserve unknown answers across speech, equations, labels and animation. A family is not certified because one example renders well.

| Representation family | Acceptance checks | Coverage in this slice |
| --- | --- | --- |
| Coordinate and scaled geometry | Geometry matches coordinates, aspect ratio, units and stated scale. Objects preserve identity through transformations. | Sampled in authored geometry and projectile scenes; matrix and projectile model requests. Broader geometry is untested. |
| Symbols, equations, derivations and matrices | Correct notation, dimensions, assumptions and equivalent steps; terms link to their visual referents. | Matrices, component equations and reaction notation sampled. General proofs and multi-step symbolic transformation are untested. |
| Plots, data and probability | Axis meaning, scales, domains, units, plotted values and uncertainty agree. Distinguish a schematic from measured data. | One authored reaction-energy profile. Data plots, distributions and statistical uncertainty are untested. |
| Mechanisms, processes and causal graphs | Arrows declare their meaning; ordering, conservation and causal claims are justified. A summary relation must not masquerade as a mechanism. | Atom accounting and membrane diffusion sampled in fixtures and model requests. General causal graphs and mechanisms are untested. |
| Circuits, networks, computing and engineering | Connections meet the correct ports; component/state conventions are explicit; updates preserve topology and applicable constraints. | Untested in this slice. An electric-field example is not a circuit or network test. |
| Spatial fields and 3D projections | Coordinate orientation, vector directions, projection, depth cues and labels remain consistent. Distinguish field, force and trajectory. | Authored 2D electric and magnetic field samples. General fields and 3D projection are untested. |
| Image-grounded representations | Explanation and reconstruction agree with the supplied image; uncertainty and ambiguous markings remain explicit. | Untested in this slice. Prompt-only generation does not establish image understanding. |
| Dynamic models and simulations | State changes follow the declared relationship, preserve invariants and agree with time and narration. Pause, scrub and parameter changes remain coherent. | One authored projectile timeline and one model-generated motion request. General simulation and parameter manipulation are untested. |
| Student-authored revisions | The tutor refers to the correct page, author and revision, preserves editable ink, and responds to a meaningful change. | Existing snapshot plumbing inspected; recognition, correction and collaborative learning outcomes are untested here. |

The current evaluation envelope is eight authored gallery pages and four model requests. Those are diagnostic examples of the visual language, not eight supported topics or proof that STEM is solved. Actual outcomes belong in the [model evaluation](evaluations/2026-09-20-stem-models.md) and renderer evidence. Expand with held-out topics, composed representations and revisions, rather than growing a catalogue of scene presets. Image-grounded cases should use authored references or synthetic sketches, never private student uploads committed as fixtures.

## Three kinds of evidence

1. **Renderer fixtures:** deliberately authored scenes establish what the current SVG/MathJax system can express. Check actual rendered labels, notation, bounds, color correspondence and interaction at compact and expanded sizes. These are visual examples, not a model benchmark.
2. **Generated lessons:** run matched requests through the candidate's actual constraints. Inspect the complete returned lesson and rendered output. Record invalid output, repairs, missing requested representations, factual errors, clutter and narration/visual disagreement. A four-case smoke test finds failures; it cannot establish reliability across STEM.
3. **Live sessions:** verify useful audio, visible explanations, complete playback, interruptions, student annotations, history and recovery together. Human judgments of clarity and learning need their own evidence; passing code checks does not establish either.

For each result retain the case, model/effort, prompt/configuration, source revision, observed timings and review notes. Separate generation quality from renderer defects. Review scientific correctness before visual polish. Repeated cases and independent content review are required before generalizing from a successful example.

The existing document prototype allows up to 80 figure primitives. Live trial guidance permits up to six DRAW commands per beat and one to three beats. A rich hand-authored preview therefore does not demonstrate that the current live prompting can produce it. Test that gap directly before changing budgets or selecting a model.

## Helpful motion, bounded scope

Use motion to explain a change: a body moves while its vectors remain attached, a vector transforms while retaining identity, or a process advances through meaningful states. Construction replay and typewriter reveal are presentation effects; they are not simulations.

Use the existing validated declarative animation runtime. Keep physical time distinct from reveal time and decorative easing. Test initial, intermediate and final states, pause, scrubbing and replay. A smooth path-following animation alone does not prove correct kinematics. Reduced motion should retain the information in a settled diagram or comparison.

No new renderer, generated executable scripts, general-purpose simulator or Manim service is needed for this slice. More specialized notation or 3D representations should follow a demonstrated teaching need and an explicit capability test.

## Collaboration without a larger product

The first collaboration loop is small: **write, finish an idea, ask, inspect, revise**. Keep the student's marks editable and visually distinct from tutor additions. Capture the committed working page and revision when the student asks for help. Refer to a specific visible mark; ask when handwriting is ambiguous. Feedback should help the student compare relationships and revise their work, rather than silently replace it.

The current app already supplies combined and student-only images at reasoning-turn boundaries. This is not continuous visual understanding. Pen-down currently interrupts inference and speech; it does not automatically request feedback. Review that interruption policy separately before changing it. Test a pending stroke, erased notation, an earlier page and a stale response so the tutor does not critique the wrong revision. Tutor-created work is never evidence of student mastery.

Defer multiplayer, an infinite canvas, automatic feedback after every stroke, handwriting recognition claims and cross-device collaboration. Preserve page identity and ownership now so future work has a sound foundation.

## Latency is a release condition

Measure from the end of the student's utterance, including endpointing, to the first useful audible response. Also record first complete useful visual, complete playback, model streaming, synthesis and repair time. For typed input, start at submit and report it separately. Placeholder speech and an empty board do not satisfy these measures.

Compare the current candidate and proposed board path on the same requests and configuration. Report sample counts and individual observations; use percentile comparisons only after sufficient repeated runs. A small provider sample cannot establish acoustic latency or tail reliability.

Promote a change only when required scientific/layout cases pass, audio finishes, ink survives, and useful audio/visual timing meets the agreed baseline. Do not hide extra planner or repair calls outside the timing. The proposed architecture uses local deterministic composition and shared styles to reduce repetitive decisions, but its speed benefit remains a hypothesis until measured.

Next, review the sampled capabilities and generated failures, choose one reusable composition or validation improvement, and test it on both existing and unfamiliar topics. Then compare matched live turns. Expand capability coverage incrementally while keeping the open-ended vision, audio reliability, recovery and product checklist active. Evaluation reports record actual outcomes; this document defines the direction and gates.
