# Teaching interaction stress test

David and Hussein reported these issues while using the prototype. This is the next review checklist, not a claim that hardware checks have passed.

| Report | Repair in this branch | What to verify together |
|---|---|---|
| Upload picks problem one and starts teaching without an agenda | Attachments and marks update context silently; no automatic readiness or ink turn | Upload a pset before explaining why you came. Stay silent. No lesson should start. Name problem two and your goal. |
| Tutor jumps in during a thought | Endpoint uses about 1.1s of non-speech; tap can finish a recording sooner | Pause briefly mid-sentence, then continue. Check that your entire thought reaches one turn. Longer pauses may still end it. |
| Orb tap discards what was said | While recording, tap submits meaningful speech. The orb only starts/submits. Use the separate Pause button or Escape to stop | Speak, tap, and check student caption plus response. Tap just as listening changes to thinking: the pending response must survive. Use Pause or Escape to stop. |
| Cannot interrupt | Microphone remains active with echo cancellation; sustained local speech probability stops speech and queued visuals | Interrupt with headphones, then speakers. Try a quiet voice. Background noise should not cut off the tutor. Adjust thresholds only from observed failures. |
| Caption text is never spoken | Removed the three-chunk/70-word audio cap; captions/history follow sentence playback | Listen through an entire four-sentence response. Interrupt midway and verify cancelled future sentences do not appear as delivered history. |
| Choppy response | Prepare upcoming sentence audio during playback, with preceding text for continuity | Listen for gaps and repeated lead-ins. Network/model timing can still vary. |
| Awkward units and symbols | Speech-only expansion for common SI units, powers, Greek symbols, and simple LaTeX; original board notation stays intact | Ask about speed versus acceleration. Listen to meters per second versus meters per second squared, negative values, and decimals. Unsupported notation must not be presented as comprehensively solved. |
| Repetitive or inattentive replies | Runtime notes emphasize the latest request, avoid stock acknowledgements, and preserve only started speech in history | Correct the tutor, change topic, and ask what you previously said. Note exact repetitions for further tuning. |
| Board only used for graphs | Runtime hints support short general equations and unfinished examples; equations no longer truncate at six words | Ask for an ungraded symbolic relationship. Have the tutor invite you to complete a part, write, then say what you did. It should use the new snapshot and preserve your ink. |
| Drawings get ahead of speech | Visual tags share the speech queue after their introductory words | Ask for a small diagram, interrupt its introduction, and verify it does not continue drawing or animating afterward. |
| Pointer misses visible work or zoomed region | Send fuller question anchors; scroll only the PDF container to the target region, measured after zoom | Point at a problem, zoom to 200%, pan, and ask about a specific equation. Check page, position, and highlights. Model localization still needs evaluation. |

## Known remaining limits

- The microphone detector uses Silero v5 speech probabilities and timing, not meaning or speaker identity. Vocals and background conversation can still look like speech. Echo, music, quiet voices, and thinking pauses need real testing. Separate Pause and Escape remain available.
- Captions track sentences, not individual spoken words. A sentence interrupted midway can still be displayed in full.
- A model-only upload probe continued choosing problem one despite prompt changes. The app now prevents autonomous upload speech at the client boundary.
- One live general-equation probe produced `F = ma` and one question. It does not establish reliable visual teaching across all subjects.
- The current pointer is still the existing laser design. A cursor appearance redesign, freehand tutor annotation tools beyond existing DRAW/HIGHLIGHT, and verified Pencil/palm rejection remain follow-ups.
- No previous stress-test audio or complete historical transcript was recovered. Reports are based on David and Hussein's observations; automated checks use synthetic input. Nothing new records private audio persistently.
- Hussein's auth, course context, and recap lanes remain separate. The local prototype is not yet a production-isolated multi-user service.

## Recovery and setup

The pinned speech detector runs locally. Predev/prebuild copy its installed model, worklet, and WASM assets into an ignored public folder; run npm ci after pulling the package change. No detection audio is sent to a new service. A failed or stalled detector exposes Retry microphone. Recording finalization, STT, TTS, and reply generation have bounded waits instead of indefinite thinking. Test failures with the network offline and then retry.

A browser smoke test loaded the actual detector, rejected synthetic non-speech input, exercised Pause/Escape, and inspected the 768px layout. It does not establish real-world music rejection or iPad audio behavior. See the [detector's API documentation](https://docs.vad.ricky0123.com/user-guide/api/) for its speech-probability callbacks and local asset support.

## Checks

Run `node scripts/check-voice-lifecycle.mjs`, `node scripts/check-teaching-repairs.mjs`, `node scripts/check-workspace.mjs`, `node scripts/check-anim.mjs --unit`, and `npm run build`.

The lifecycle harness uses the real hook with simulated audio and deferred STT. It covers cancellation, meaningful tap submission, quiet readiness events, full audio delivery, history, visual timing, noise bursts, and audio errors. It cannot measure how a real microphone or voice sounds.

Pronunciation implementation follows the provider's advice to normalize text before synthesis and preserve preceding text across chunks: [ElevenLabs TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices). Normalization is bounded, not a general mathematical speech engine.

## Latest desk and voice follow-up

- Mention lecture one/two and ask what a variable means while a PDF is attached. The same homework PDF must remain visible. Explicitly switching topics can still park it.
- Scroll to the start of a long transcript while the tutor responds. Your reading position must hold. Latest returns to the end. Export downloads the active session captions as plain text. There is no server-side archive.
- Ask for the meaning of symbols in a general relationship. The tutor should write short definitions and explain them, not repeat the same recall question. The live probe wrote the equation plus four definitions; broader behavior still needs testing.
- Ask which lecture a relationship comes from. Without actual lecture content, the tutor must say it cannot verify the attribution. An assignment mentioning lectures is not evidence of their contents. Runtime instructions are not a deterministic factuality guarantee.

### Voice pipeline assessment

The installed path remains local speech detection, batch Scribe transcription, Grok with page/board context, and ElevenLabs TTS. Scribe was upgraded from v1 to v2 and verified with generated physics speech through the real endpoint. Flash v2.5 remains the low-latency TTS option. Transcription still follows recording; reasoning still takes several seconds.

[ElevenLabs model guidance](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model) distinguishes Flash v2.5 for low latency, v3 Conversational for expressive realtime speech, and Scribe v2 Realtime for streaming recognition. [Expressive mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode) combines v3 Conversational with turn-taking signals from Scribe v2 Realtime. That managed stack is a candidate for measured integration, not an installed feature or a proven winner for this desk. It must preserve Grok image context, graded-work boundaries, visual timing, interruption, and browser/iPad controls before replacing the current path. A provider change alone cannot repair desk routing or unsupported course claims.

## Visual teaching and conversational voice pass

The new default is conversational v3, verified with funded-account synthesis and an app/browser decode test. Flash remains an explicit environment rollback. Test perceived warmth, continuity across sentences, units, and interruption with real speakers and headphones. The existing batch transcription and local turn detector remain; expressive synthesis alone does not add managed turn-taking.

Test ordinary mentions of lectures/concepts during homework, model MODE tags during an active session, and explicit returns to homework. The attached paper must remain unless the student requests a session change or removal. Negated removal and a rocket taking off must not discard the PDF.

Compare written equations and their symbol colors across DRAW, ANIM, and the tutor snapshot. Ask for a given-value setup during homework; the board should open and the tutor should write one small beat. Check PDF highlights and cursor positions after zoom, pan, and viewport resize. Text anchors are measured PDF fragments; choosing the correct fragment is still a model task.

### Visual references and next capabilities

The design direction is a coordinated explanation, with stable symbol identity and deliberate reveals. References reviewed: [Desmos sliders](https://www.desmos.com/calculator/ejgsoybkjs), [Khan Academy graph/equation explanation](https://www.khanacademy.org/math/algebra-home/alg-linear-eq-func/alg-writing-slope-intercept-equations/v/graphs-using-slope-intercept-form), [3Blue1Brown's Manim demonstration](https://www.3blue1brown.com/lessons/manim-demo/), and [Manim matching equation transforms](https://docs.manim.community/en/stable/reference/manim.animation.transform_matching_parts.TransformMatchingTex.html). The present implementation adds typography, symbolic color consistency, and reveals to the existing SVG runtime. Linked parameter sliders, full mathematical typesetting, term-to-term transformations, and arbitrary image composition remain future implementation, not claimed features. Any new command contract needs an explicit shared-type review. The projectile fixture remains test-only.

## Listening and upload receipt retest

- Listen to the same v3 voice at the new pitch-preserving 1.08 playback rate.
- Speak, then stop with mild background sound. A confirmed turn should end after about 1s without clear speech. Try quiet speech too; lowering false continuation must not swallow a quiet student's explanation.
- Upload while idle: one short acknowledgement after 1.5s of quiet. Upload while speaking or while the tutor responds: no extra spoken receipt. No upload can start problem one or an unsolicited lesson.
- A suspended microphone audio context should recover or show Retry microphone, rather than silently remaining in listening state. The automated case covers a context that fails to resume; real browser interruptions remain a device check.
