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
