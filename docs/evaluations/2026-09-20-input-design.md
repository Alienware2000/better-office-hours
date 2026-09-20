# Voice and typing interface refinement

David rejected the piecemeal input interface and supplied ElevenLabs, Nube, Atalanta, and a compact navigation example as visual references. This local slice addresses hierarchy and controls; it does not claim the full product/board design pass is finished.

## Direction

Reviewed the [ElevenLabs homepage](https://elevenlabs.io/), [Atalanta](https://www.atalanta.tech/), and [Nube on Awwwards](https://www.awwwards.com/sites/nube). The useful interpretation for this tutor is restrained surfaces, consistent control scale, deliberate spacing, and fewer competing elements. No reference assets were copied.

- Plain orb and existing animation are retained.
- Welcome hierarchy and a quieter neutral paper surface replace scattered controls.
- Type a message and mic control share one row. In typing mode, mute/close/send sit within the composer.
- One form-level focus treatment replaces the orange textarea rectangle. All icon controls have accessible names and visible keyboard focus. Closing typing restores focus to its trigger.
- Mic state appears in its control; the general idle caption does not repeat it.
- Diagnostic details are collapsed by default. Trial identity and first-audio timing remain available, with existing event handling unchanged.
- No dependency, provider, microphone, cancellation, speech queue, board, or storage behavior changes. Typed replies still include audio.

## Validation

Source candidate `d618709` in isolated localhost:3114. TypeScript, focused ESLint, and diff checks pass. Browser reviewed at desktop and 390 x 844: plain orb, welcome hierarchy, integrated composer, disclosure, and controls fit. Multiline input via Shift+Enter retained after hide/reopen; empty Send disabled; draft cleared without sending. Final revision verified opening focus on textarea and closing focus back on Type a message. No provider call or microphone permission was triggered. Prior voice-loop synthetic evidence remains in [typed input](2026-09-20-typed-input.md); this UI source was not rerun through the entire offline suite.

Existing user origins through 3113 were not reloaded/restarted. Only the fresh agent-owned 3114 draft preview was refreshed during this pass. Human aesthetic approval and physical iPad/keyboard/acoustic review remain pending.
