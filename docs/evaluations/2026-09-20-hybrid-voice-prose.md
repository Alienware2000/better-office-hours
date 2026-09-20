# Automatic follow-up listening and readable prose

David tested 3111 and requested automatic microphone reopening, clearer start cues, and a fix for a question rendered as colored, unspaced math. This supersedes tap-every-turn as the local candidate behavior.

## Changes

`runTurn` rearms listening only when the current playback epoch finishes its queued narration and the turn is neither paused nor aborted. Inter-clip silence and model-stream completion do not reopen the mic early. Errors still require an explicit tap; visibility/session switches remain paused. Background speech during open listening is still possible. Endpointing remains three seconds, not semantic completion detection.

The orb now carries a visible microphone icon and Tap to speak at start/resume. The listening status explicitly says the user can speak. TrialStatus describes actual automatic follow-up and explicit interruption rather than suggesting acoustic barge-in.

`isMathNotation` previously accepted any TeX script as proof that the entire string was mathematical. A question containing m_{2} therefore lost spaces in MathJax and colored its italic letters. It now checks surrounding prose first. `boardLabel` preserves numeric subscripts as Unicode within ordinary prose, and normalizes simple text wrappers/delimiters/spacing. Equations and compact standalone math labels retain typesetting. This is not arbitrary inline rich-math support, saved-board migration, or a complete diagram-layout fix.

## Verification

- All 16 offline checks pass: `.data/evaluation/consolidation/offline-1789890599875.json`.
- Voice regressions cover automatic reopening after final audio, input closed between beats and after model completion while audio remains, stale completion isolation, pause/error behavior, and follow-up capture without another tap.
- Math regressions include the reported question, numeric script variants and comparison prose; prior fraction, root, vector, matrix, equation and disclosure tests still pass.
- TypeScript and targeted ESLint pass.
- Actual Orb and BoardText components rendered in isolated static fixtures, inspected in-browser: visible initial mic action, readable spaced question in one ink color, retained LaTeX equation. Fixture `.data/evaluation/hybrid-voice/review.html` is synthetic and ignored.
- No provider calls or real-device microphone tests performed. All existing session origins retained. Human acoustic follow-up remains necessary.
