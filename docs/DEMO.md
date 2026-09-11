# Demo, README, and Submission

## The video: 90 seconds, one take

The video shows a student using Better Office Hours. Nothing else. No slides, no narration over the product, no explanation of the course being archived. A judge should feel like they are watching a real night before a pset is due.

Record on a quiet machine with a good mic, the live Vercel deployment, the judge account preloaded with PHYS 180 and pset 3. Rehearse the full take five times before recording. Keep a recorded backup of the best rehearsal.

### Script

0 to 10s. App opens on the orb alone. Orb: "Hey David. What do you want to work on?" Student: "Pset 3 for physics, I'm stuck on question 2." Orb: "Pset 3 for PHYS 180, due Friday. Drop it in." The screen splits, the student drags the PDF in, it renders on the left.

10 to 20s. Orb: "Okay, question 2. Tell me what you already know about the setup." Student gives a half-right answer (knows the initial speed, unsure about the angle). Orb: "You've got the speed. What about the angle?" Pointer glides to the given angle in the PDF, highlight ring. "The problem gives it right here."

20 to 45s. Student: "I don't get why we split it into components." Whiteboard slides in. Orb draws axes, the velocity vector, then the horizontal and vertical components one stroke at a time while narrating each. "This is the launch velocity. This part is horizontal. This part is vertical."

45 to 60s. Student circles the vertical component on the board: "This one is the confusing one." Orb: "Good, that's the one gravity acts on. What do you think happens to it as the ball rises?" Student: "It gets smaller?" Orb: "Let's watch." The tutor composes an animation with the pset's numbers, the velocity arrow riding the arc, the vertical component shrinking to zero at the peak while the horizontal one stays the same. Orb: "And at the very top?" Student: "Zero." Orb: "And the horizontal part?" Student: "Oh. It's still the same."

60 to 75s. Student states the approach: use the vertical part to get time, then horizontal times time for range. Orb: "That's it. Go write that up. I'm not going to give you the number."

75 to 90s. Orb: "Quick recap. You were stuck because you had the speed but skipped the components. The idea that unlocked it is that gravity only touches the vertical part. Review lecture 4, slides 10 to 14, and try problem 3 from pset 2 after a day. Nice work catching that horizontal speed does not change." Recap card drops in. Cut.

### Optional second clip, 10 to 15 seconds, only if the main take is solid
Student: "Actually, can you just teach me relative motion?" Workspace becomes the full whiteboard, orb starts drawing. Cut after the first stroke.

### Do not include
The Grok Bot running. The login screen. Do not tap the chips in the main take; the student talks. Any settings. Any explanation of what the product is. Let the product explain itself.

## README structure

1. Title and one line: "A voice tutor that knows your course and talks you to the answer instead of handing it to you."
2. Demo video link, first thing under the title.
3. The problem, four sentences: office hours are crowded and intimidating; chat tutors have no course context and just solve the problem; unguarded AI help reduced later exam scores by 17 percent in a field study (Bastani et al., PNAS 2025) while a hint-only version removed the harm; we built the hint-only version with the course loaded in and a voice.
4. What it does, short list: sees your pset, knows your lecture notes and syllabus, points at the document, draws on a whiteboard, never gives the answer, spoken recap.
5. "It has the answer key and will not give it to you." One paragraph on the pedagogy: hint ladder, predict-then-explain, student summarizes first. Link to docs/PEDAGOGY.md.
6. Built in Cursor: screenshot of the Cursor window with the repo open. Take this early.
7. Grok Bot: one paragraph on the Course Pack Collector, the share link, and a GIF of it pulling the course from Canvas.
8. Stack: Grok (grok-4.6 via api.x.ai), Grok Bot, ElevenLabs Conversational AI, Cursor, Next.js, tldraw, Supabase.
9. Try it: live URL, judge account credentials, what is preloaded. Note: demo course is PHYS 180 from a past term; the same flow works on any current Canvas course.
10. Run locally: clone, `.env.example`, `npm run dev`.
11. Roadmap: professor console, lecture transcription, live screen share for coding courses, iPad handwriting, spaced review reminders.
12. Team: David Antwi and Hussein, Yale.

## Submission checklist

- Repo public.
- README complete with all twelve sections.
- Cursor screenshot in the README.
- Demo video uploaded (YouTube unlisted is fine), link works logged out.
- Judge account works from a fresh browser.
- Grok Bot share link works.
- Live URL loads in under three seconds.
- Submit the GitHub link at yale-ai.org/win before Friday, September 11, 11:59 PM.

## Timeline

Thursday night: repo, docs, prompt tested on a real problem, six lanes started, Cursor screenshot.
Friday morning checkpoint: voice loop, PDF pointer, one whiteboard drawing working end to end on the live URL. If not, cut in this order: pointer overlay, Grok Bot, style presets. Never cut voice, PDF, whiteboard, or recap.
Friday afternoon: integration, recap, presets, Grok Bot run with Duo rehearsed, GIF recorded.
Friday evening: README, five demo rehearsals, record, submit with an hour to spare.
