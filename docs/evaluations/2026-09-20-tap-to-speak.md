# Tap-to-speak and deliberate interruption

David first requested muting input during tutor generation/playback, then clarified that every new learner turn should start with a tap. Background conversation has made the experience unreliable. This local change takes priority over board typography and preserves the model/profile.

## Interaction

1. Idle: microphone muted, Tap to speak. The first tap opens listening without speaking an unsolicited greeting.
2. Listening: local detection records speech. The learner may pause for up to three seconds; a longer silence submits the utterance. Tapping Done speaking submits sooner. Before speech begins, silence alone does not submit anything.
3. Transcribing, thinking, preparing audio, speaking: microphone disabled and incoming PCM discarded. Busy audio is not saved for a later turn.
4. Complete response or recoverable failure: return to muted Tap to speak. No automatic listening afterward.
5. Escape or Interrupt during a response: abort current generation/transcription/playback, pause its animation, discard pending input, and open listening for a replacement/addition. While listening, Escape/Pause suspends input instead. Repeated keydown events are ignored. Session switches and visibility changes still fully suspend voice.

The existing orb starts/submits; it does not become a cancel button if automatic endpointing races a finish tap. Student writing still cancels tutor activity but does not silently open the mic. No student ink or saved transcript is removed.

## Why this design

Explicit microphone ownership prevents background speech taking a turn while the mic is closed. It does not identify the intended speaker while listening is explicitly open. Browser echo/noise processing remains configured. The browser may retain microphone permission/device access while its track is disabled; muted does not mean permission revoked.

Three seconds is a starting hypothesis, not a scientifically established endpoint. It gives more room than the prior 1.5-second gap but adds roughly 1.5 seconds to automatic submission. Done speaking avoids that wait. Longer pauses can still be mistaken for completion. Assess this on real tutoring turns before considering a manual-only finish option or a semantic endpoint model.

[ElevenLabs conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow) separates interruption, silence, and turn-eagerness controls. [Google voice-activity timeouts](https://docs.cloud.google.com/speech-to-text/docs/voice-activity-events) likewise exposes a speech-end timeout. These are relevant control patterns, not evidence that either service uses this exact BOH interaction or that a particular timeout improves learning. No managed-agent SDK or STT/provider migration was introduced.

## Implementation and evidence

`useVoiceLoop.ts` uses explicit listening authorization and synchronous track/PCM gates. State transitions close input before another detector frame. Opening a new listening window clears previous pre-roll/probability state. The capture is finalized before closing input, so the submitted utterance is not accidentally erased. Epoch/cancellation guards reject late STT, generation, and prepared audio after interruption.

`Orb.tsx` labels the touch control Interrupt while busy and Pause while listening. `VoiceSession.tsx` routes Escape through the same action and shows mic-muted status. Human PROMPT/PEDAGOGY and shared types are unchanged.

- All 16 offline checks pass: ignored `.data/evaluation/consolidation/offline-1789889661554.json`.
- Lifecycle tests exercise sustained synthetic background speech during generation/playback/STT, late-result rejection, explicit interruption, muted natural completion, fresh-tap recovery, two-second thinking pauses, automatic finish, and tap-to-submit.
- TypeScript and focused lint pass. No real provider calls were made by these checks.
- Actual Orb markup was rendered in isolated static control fixtures and inspected visually at 360px card width. Labels and 44px touch controls fit. This is layout inspection, not a real iPad or microphone test. Fixture: ignored `.data/evaluation/tap-to-speak/controls.html`.

Human retest should cover a background conversation during thinking/speech and after completion, a normal spoken question, a two-second pause followed by more speech, Done speaking, and Escape/Interrupt. Verify audible endings and ensure the board does not continue changing after interruption. Compare first useful audio separately from the deliberate endpoint allowance. Do not claim noise suppression or real-device acoustic validation from synthetic tests.

## Follow-up: conversational friction

David questions mandatory tapping each turn. Treat tap-to-speak as a tested local candidate, not the final product default. 3111 runs commit bb74e32 in `.data/voice-trial-3111/run-1789889794550`; source fingerprint is in `.data/voice-trial-3111/latest.json`. Preserve the running preview. Its TrialStatus instruction still suggests natural interruption; correct that stale copy in the next snapshot.

Recommendation, not implemented: tap once to begin, automatically reopen listening after actual playback completion, retain explicit Escape/Interrupt during thinking/speaking, and keep tap-to-speak as an optional noisy-room mode. This reduces per-turn effort but can still capture other speakers during listening. Fixed three-second endpointing is provisional and adds latency; semantic completion needs its own evaluation and streaming integration.

Official documentation checked September 20:

- [OpenAI Realtime VAD](https://developers.openai.com/api/docs/guides/realtime-vad): semantic VAD considers utterance completion, can wait longer after hesitation, and exposes response creation separately from interruption. This documents API controls, not ChatGPT's private implementation.
- [ElevenLabs conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow): separate interruption and turn-eagerness settings; educational guidance favors patient turns with interruptions. Silence prompting timeout is distinct from speech endpointing.
- [LiveKit turn tuning](https://docs.livekit.io/agents/logic/turns/tuning/): adaptive interruption classification distinguishes genuine interjections from backchannels, supports false-interruption recovery, and separates competing-voice isolation from non-speech noise suppression.

These managed-platform features are not automatically provided by BOH's use of ElevenLabs STT/TTS. No SDK/provider migration was made. Longer term, coordinate listening, narration, board animation, and cancellable work with a shared turn lifecycle. Measure false interruptions, missed real interruptions, premature endpoints, and speech-end-to-useful-audio separately. This proposal needs real acoustic comparison; no new provider or hardware tests were performed for the research follow-up.
