# Board consistency after the speech fix

September 20: David tested localhost:3110 and reports that everything seems to be working well. Treat this as encouraging human session feedback, not proof that every audio failure is resolved. Four supplied screenshots show variable diagram quality, crowded cumulative annotations, and distracting multicolored text. No private screenshots or assignment text are copied here.

## Observations and source evidence

- A spoken reference to a pulley is not matched by a clearly drawn pulley in the setup screenshot. The connection changes direction at a square corner instead. This is a semantic scene-quality issue, not just spacing.
- Subsequent pictures accumulate force arrows, motion arrows, and positive-axis directions around the same object. Labels and leaders compete. The last picture also shows upper content cropped; whether this is viewport, scroll, or layout behavior is unverified.
- Ordinary prose is visibly typeset as italic mathematics with lost word spacing and colors changing within words. The exact model command is not available from screenshots.
- `lib/whiteboard/text.ts` assigns colors by a symbol's character code modulo a three-color palette. `math-layout.ts` applies this to italic math glyphs. This is deterministic symbol coloring, not semantic assignment to physical roles. `math-source.ts` sends an entire label through math when it detects LaTeX syntax. Mixed prose/math handling is therefore the first bounded implementation target; do not claim the precise source string was recovered.

## Next bounded pass

1. Make ordinary prose readable and neutral; preserve proper equations. Use color deliberately for a relationship or current emphasis, not automatically for every variable. Verify actual SVG rendering, labels, equations, snapshots, and reveal order with synthetic examples.
2. Establish general rules for separate setup, force, motion, and coordinate views, plus removal/fading of superseded annotations. Avoid hardcoded topic scenes. Compare against the supplied failure patterns with synthetic fixtures, without revealing graded outcomes.
3. Check narration against scene contents and verify layout at compact and expanded board sizes. Schema validity alone does not establish diagram correctness.

Retain the current model while assessing this pass so model changes do not confound the result. Keep useful-audio latency and full speech endings as regression checks. Jev, new rendering engines, and cinematic expansion remain deferred. Preserve 3110 as a live user session; no source snapshot edits, restart, or rebuild there without verified recovery. Public Vercel remains paused.
