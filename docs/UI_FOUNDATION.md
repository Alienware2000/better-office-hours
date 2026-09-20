# Interaction design foundation

Updated September 20, 2026. David's direction: a modern AI interface with a light, warm, approachable education identity. Voice is the primary interface. References inform composition; the product should have its own coherent system.

## Defaults and hierarchy

The welcome question is “What do you want to work on?” It invites a spoken request directly.

- The plain orb is the visual anchor. Keep its original appearance and animations. No text or icons inside it.
- New and resumed desks start with typing closed. Open it only by an explicit Type a message action. Handoff previews in voice mode, not in an agent's composer test state.
- The orb is the sole voice-start button. Tap to speak beneath it is a noninteractive label, not a second button. Typing and mic mute are secondary. Homework, Explain a concept, and Something else are entry actions, not external navigation links.
- Sessions opens saved history; New session starts a fresh desk. Back to start saves the current desk and returns to entry. Canvas remains optional course context. Diagnostics stay in a separate collapsed disclosure.

## Shared visual rules

Use the same paper, surface, ink, border, and focus tokens across welcome, active desk, and session history. Use restrained text/icon controls beneath the orb. Reserve bounded surfaces for navigation, forms, and consequential controls. Interactive controls keep at least 44px height, hover/pressed states, and keyboard focus. Icons supplement accessible text, never replace names. Keep strong contrast for actions and primary content. Muted helper text remains secondary.

Maintain the existing font and plain orb. Rounded rectangular controls use 10–12px corners; composer uses 20px; the send action remains circular. David rejected a boxed welcome pass: green start fill, repeated borders, arrow suffixes, and idle instructions made every control compete with the orb. Keep the earlier sparse composition; improve affordance subtly rather than boxing every action. No dependency or large animated background is needed for this foundation.

## State language

| State | Visible cue | Interaction |
| --- | --- | --- |
| Ready / paused / deliberately muted | Quiet Tap to speak cue | Start voice, or explicitly open typing |
| Connecting | Connecting microphone | Wait for permission/device setup |
| Listening | Listening; gentle dot; orb reacts to input level | Speak, tap orb to finish sooner, or pause |
| Transcribing / thinking / preparing audio | Understanding your words / Thinking it through / Getting ready to speak; rotating indicator | Input gated; Interrupt/Stop remains separate |
| Speaking | Speaking; activity bars plus existing orb animation | Explicit Interrupt or Stop; mic-only mute does not cancel output |
| Microphone failure | Microphone unavailable; retry/typing guidance | Retry microphone or use typing |

Text communicates state even without color or animation. Status bars indicate activity, not a measured audio waveform. Motion stops under reduced-motion preferences. No new automatic microphone behavior, inference cancellation, or endpointing policy is introduced by presentation changes.

## Validation boundary

Rendered checks and synthetic state previews establish layout and affordance evidence. They do not establish human acoustic quality, endpoint timing, interruption reliability, or iPad hardware behavior. Keep those items on [the product checklist](PRODUCT_CHECKLIST.md).
