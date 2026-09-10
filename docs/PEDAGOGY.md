# Pedagogy: The Learning Science Behind Better Office Hours

This is the evidence base for how the tutor behaves. PROMPT.md is derived from it. When a behavior question comes up during the build, check here before guessing.

## The twelve principles

1. **Generation beats telling.** Chi and Wylie's ICAP framework (2014) ranks engagement Interactive > Constructive > Active > Passive; each step up improved learning by 8 to 10 percent in their studies. Student-generated explanations predict learning far more than tutor explanations. The student produces the reasoning; the tutor makes that happen.
2. **Be contingent.** Wood, Bruner and Ross (1976): raise support when the student fails, lower it when they succeed. This is the operational meaning of the zone of proximal development and the core control loop of the tutor.
3. **Ask before you tell.** Expert tutors are Socratic and indirect (Lepper's INSPIRE model). Surface misconceptions by asking for a prediction before giving an explanation.
4. **Use a graded hint ladder and do not skip to the bottom.** Prompt, pointing hint, teaching hint, bottom-out (Hume et al. 1996; VanLehn 2006). Bottom-out hints given too early are consistently associated with less learning.
5. **Never just give the answer, and never let the student flounder either.** In Bastani et al. (PNAS 2025), nearly 1,000 high-school students using an unguarded ChatGPT-style tutor did 48 percent better on practice and then 17 percent worse on an unaided exam than students with no AI. A guardrailed hint-only version matched the no-AI control. Guardrails are the product.
6. **Diagnose the type of stuck.** Concept-stuck, procedure-stuck, and confidence-stuck need different responses. Elicit the student's current understanding first.
7. **Prime for known physics misconceptions.** The Force Concept Inventory (Hestenes, Wells and Swackhamer 1992) catalogs them.
8. **Feedback about process, forward-looking; praise is the weakest form.** Hattie and Timperley (2007): feed up, feed back, feed forward. Dweck: praise the strategy, not the person.
9. **Talk in short chunks, then check in.** Cognitive load theory and Mayer's segmenting principle.
10. **Use the whiteboard when a picture carries information, and narrate it.** Mayer's modality principle: narration plus diagram beats on-screen text plus diagram. Point at the relevant part. Do not duplicate speech as on-screen text.
11. **Wait, and do not dominate.** Rowe's wait-time threshold is 2.7 seconds, versus the 0.7 to 1.5 seconds teachers actually wait. TeachLM (2025), trained on about 100,000 hours of real tutoring, found students speak only 5 to 15 percent of the time with LLM tutors versus about 30 percent with humans, and LLMs average 150 to 300 words per turn versus 72 for humans.
12. **Close with a student-generated recap and a concrete next step.** Retrieval practice (Roediger and Karpicke 2006) and self-explanation (Chi et al. 1994): the student summarizes, the tutor corrects and adds a specific, spaced review.

Honesty note: most of this evidence comes from text-based tutoring systems, human tutors, and classrooms. Very little was generated with voice-first LLM tutors. Some famous results (Bloom's two sigma) are weaker than their reputation. Flagged where it matters.

---

## 1. The science of one-on-one tutoring

**Bloom's two sigma (1984).** Bloom reported that tutored students with mastery learning performed about two standard deviations above classroom students. It has largely not replicated. VanLehn (2011) found no replication; realistic tutoring effects are 0.4 to 0.8 sigma. Do not design to the myth.

**VanLehn (2011), Educational Psychologist 46(4).** Against no tutoring: human tutoring about 0.79 sigma, step-based intelligent tutoring systems about 0.76, substep-based about 0.40, answer-based systems about 0.31. Good computer tutors are nearly as effective as human tutors, and what matters is working at the level of solution steps, not final answers.

**Chi's ICAP framework (Chi and Wylie 2014).** Interactive > Constructive > Active > Passive. The biggest jump is Active to Constructive: the moment the student generates something beyond the given material. Caveat: for true novices, heavy guidance can beat unguided construction (Kirschner, Sweller and Clark 2006).

**Graesser's five-step tutoring frame (Graesser, Person and Magliano 1995).** Tutor asks a question; student answers; tutor gives short feedback; tutor and student collaboratively improve the answer through hints and prompts; tutor checks understanding. Ordinary human tutors rarely use sophisticated strategies; their success comes from this collaborative-improvement dialogue. Experts let the student do more of the work.

**Lepper's INSPIRE model (Lepper, Drake and O'Donnell-Johnson 1997).** Intelligent, Nurturant, Socratic, Progressive, Indirect, Reflective, Encouraging. The best tutors provide almost no facts, solutions, or explanations; they elicit these through questions. They imply errors via questions rather than criticism, and have the student reflect aloud after solving.

**Wood, Bruner and Ross (1976) and the ZPD.** Scaffolding is temporary, contingent support: high when the task is new, withdrawn as competence grows. Caveat: the original study was 30 children on a block task; the robust claim is that contingent support helps, not a specific fading schedule (van de Pol et al. 2010).

**Behaviors.** Default to eliciting. Operate step by step. After a correct step reduce support; after a wrong or blank step increase it. Have the student explain back why a step works. Keep the student doing most of the cognitive work.

---

## 2. Retrieval, generation, and productive struggle

**Testing effect (Roediger and Karpicke 2006).** At a five-minute delay re-reading beat testing (83 vs 71 percent), but at one week repeated retrieval beat re-reading (61 vs 40 percent), even though re-reading increased students' confidence. Students systematically mispredict this.

**Generation effect.** Producing an answer yourself makes it more memorable than reading it.

**Desirable difficulties (Bjork 1994).** Spacing, interleaving, retrieval, generation, and varied practice slow acquisition but improve retention and transfer. Difficulty must be desirable: the student needs enough background to overcome it.

**Productive failure (Kapur 2008 to 2014).** Attempting a novel problem before instruction, even unsuccessfully, prepares students to learn more from the instruction that follows. Boundary: instruction must follow; unguided floundering is not productive failure.

**Worked examples and expertise reversal (Sweller; Kalyuga et al. 2003).** Novices learn more from studying a worked example than from solving. As expertise grows this reverses. The choice of worked example versus generation depends on the student's current level.

**Interleaving and spacing.** Mixing problem types beats blocking for discrimination and transfer (Kornell and Bjork 2008; Rohrer). Spacing beats massing (Cepeda et al. 2006).

**Behaviors.** Default to ask. Only tell after the student attempts and two hint rungs fail. If the student is a clear novice on a concept, show one worked example, then have them do a near-identical one; if they have partial competence, make them generate. Give a short productive-struggle window before teaching, capped at two or three unproductive minutes. Ask the student to recall a concept before re-explaining it. In review recommendations, suggest spacing and interleaving and say it will feel harder.

---

## 3. Diagnosing understanding

**Force Concept Inventory (Hestenes, Wells and Swackhamer 1992).** Wrong answers are engineered to match common misconceptions drawn from students' own responses. Students enter and often leave physics courses with pre-Newtonian ideas. Relevant clusters: velocity and acceleration confusion (zero velocity implies zero acceleration, especially at the peak); heavier objects fall faster; horizontal velocity decreases during flight; motion implies a force in its direction.

**Predict then observe.** Asking for a prediction before explaining exposes the underlying model. Explanation without a prior prediction gets absorbed into the existing misconception.

**Self-explanation (Chi et al. 1994).** Prompting students to explain each line produced larger gains than re-reading; all high explainers reached the correct mental model while many unprompted students did not. Caveat: time on task was not fully controlled.

**Three kinds of stuck.** Practitioner-derived rather than a validated instrument, but the signals are grounded. Concept-stuck students give answers consistent with a wrong model. Procedure-stuck students state the principle but botch the execution. Confidence-stuck students hedge or retract correct answers.

**Behaviors.** Open every problem by eliciting the student's understanding in their own words. Predict before explain. Ask "how did you get that" to separate concept from procedure errors. Branch: concept-stuck gets a prediction and contrast, not algebra; procedure-stuck gets a pointing hint at the step; confidence-stuck gets the correct reasoning named and less hinting. Track which misconceptions appeared and re-probe later.

---

## 4. Feedback and hinting

**Hattie and Timperley (2007).** Three questions: where am I going, how am I going, where next. Four levels: task, process, self-regulation, self. Process and self-regulation feedback are powerful; feedback about the self (praise) is the least effective and can distract. "Where next" is rarely given and highly valued.

**Dweck (Mueller and Dweck 1998).** Person praise makes success feel like a fixed trait and backfires on later setbacks. Process praise builds resilience.

**ITS hint ladders (Hume et al. 1996; Aleven and Koedinger).** Pointing hint, teaching hint, bottom-out hint. Students who click straight to the bottom learn less; a 2026 LAK study found consistent negative associations between unproductive hint use and outcomes. The ladder must be climbed.

**Interrupting errors.** Let a student finish a line of reasoning when the error is instructive and recoverable; interrupt when it would compound. Imply the error through a question.

**Rowe (1986).** Praise or criticism delivered immediately after an answer can reduce the quality of subsequent responses. Pause, then give process-specific feedback.

**Behaviors.** The four-rung ladder with an attempt required between rungs. Never open at the bottom. On graded work, never reach the bottom; walk a parallel example. Stop hinting and give the step when the student has made two or three genuine attempts, is frustrated, or is stuck on a trivial step that is not the target. Feedback is about process. Always feed forward. Flag errors indirectly.

---

## 5. Explanation quality and visuals

**Mayer's multimedia principles (2014).** Multimedia: words plus pictures beat words alone. Modality: narration plus graphic beats on-screen text plus graphic. Redundancy: do not add on-screen text identical to narration. Signaling: point at the essential part. Segmenting: learner-paced chunks. Contiguity: put words next to the graphic and sync narration with drawing. Coherence: cut extras.

**Cognitive load theory (Sweller).** Working memory is limited. Reduce split attention and redundancy; chunk; do not monologue.

**Multiple representations in physics.** Verbal description, vector diagrams, motion graphs, equations. Translating between them is the skill.

**Turn length.** No published figure for how long a voice tutor should speak before checking in. Segmenting and the TeachLM verbosity data (72 words per human turn) suggest two or three sentences. Treat it as a hypothesis to test.

**Behaviors.** Voice first; open the whiteboard only for a free-body diagram, a trajectory with components, a motion graph, or a coordinate setup. Narrate while drawing and point. Labels only on the board. Two or three sentences then a question. One conceptual step per turn. Refer to "this term here" while pointing. Move across representations deliberately.

---

## 6. Motivation, patience, and the emotional side

**Help-seeking.** Students avoid office hours because asking feels unsafe: fear of looking unintelligent, not wanting to bother the instructor, not knowing the norms. First-generation and underrepresented students carry the highest perceived cost and use more passive help-seeking (Kim and Sax 2009). The fix is lowering the felt cost of asking, not arguing the benefits. A private, always-available, non-judgmental tutor attacks that barrier directly.

**Self-efficacy and attribution.** Attributing outcomes to effort and strategy builds persistence; attributing them to fixed ability does not.

**Calibration and metacognition.** Confidence ratings diagnose and train calibration. Students are overconfident about material they have only re-read.

**Answer-seeking.** Khanmigo's experience: students used to instant answers get frustrated and some disengage. The move is to set expectations up front, acknowledge the feeling, and redirect to the next step. Frustration is a signal to raise support, not to abandon the method.

**Behaviors.** Open warmly and normalize confusion. Welcome basic questions explicitly. Process language for encouragement. On an answer request: acknowledge, explain briefly why not, offer the next rung; if genuinely stuck after real attempts, give the step and have them apply it. On frustration: narrow the question, give a pointing hint, acknowledge the emotion. Ask for confidence ratings at key points. Never shame an error.

---

## 7. Session arc and recap

**Structure.** Opening establishes the goal and elicits prior knowledge; main work runs the contingent loop; closing consolidates. Feed-up at the start improves how students use later feedback.

**Self-summary beats tutor summary.** Retrieval practice plus self-explanation plus the generation effect all point the same way: the student summarizes, the tutor corrects and completes.

**What belongs in the recap.** The key ideas in the student's words; the misconception that moved and the correct model; one specific, spaced, interleaved review recommendation; a confidence check.

**Behaviors.** Opening in one or two turns: what do you want to accomplish, what have you tried, here is how this works. Closing: student summarizes first; tutor corrects and names the fixed misconception; one specific next step with spacing; confidence check; process-focused encouragement. Keep the spoken recap short and structured.

---

## 8. What existing AI tutors do and get wrong

**Bastani et al. (PNAS 2025, "Generative AI without guardrails can harm learning").** Field experiment, nearly 1,000 students. GPT Base improved practice performance 48 percent; GPT Tutor (hints, not answers) improved it 127 percent. On the unaided exam, GPT Base students scored 17 percent lower than no-AI students; GPT Tutor students matched the control. Guardrails prevented harm but did not, in this study, beat no AI. The upside case rests on engagement, availability, and lowered help-seeking cost.

**Khanmigo.** Socratic, hints not answers, aligned to content. Critiques: relentless questioning frustrates students used to instant answers; guardrails sometimes too strict; weaker outside math and science. Lesson: Socratic is right, but set expectations and stay adaptive.

**OpenAI Study Mode (July 2025) and Anthropic Learning Mode (2025).** Both converge on the same principles: guide rather than answer, Socratic questioning, manage cognitive load, develop metacognition, check understanding, give actionable feedback.

**AutoTutor (Graesser).** Dialogue-based tutor with gains of roughly 0.3 to 0.8 sigma versus reading text; its physics version reached 0.6 to 1.2. Mechanism: Expectation and Misconception Tailored dialogue with a pump, hint, prompt, assertion cycle. Key finding for a voice product: learning was equivalent whether students typed or spoke. Voice is not the learning lever; the dialogue structure is.

**Wait time (Rowe 1972, 1986).** Teachers wait 0.7 to 1.5 seconds. Above 2.7 seconds, student responses grow 300 to 700 percent in length, become more evidence-based and more often correct, and previously silent students participate. Applies both after a question and after the student stops speaking.

**Talk ratio (TeachLM, Perczel, Chow and Demszky 2025).** With LLM tutors students speak 5 to 15 percent of the time versus about 30 percent with humans. LLMs use 150 to 300 words per turn versus 72, ask 3 to 4 questions per turn versus 1.5, and run much shorter sessions.

**Behaviors.** Guardrails are the core feature; the success metric is unaided later performance. Pre-load expected answers and likely misconceptions per step. Set expectations at the start. Build in about three seconds of wait time after questions and after the student stops. Tutor turns under about 70 words, one question per turn. No reflexive praise. Invest in dialogue quality, not voice novelty.

---

## Projectile-motion misconception watchlist

- Horizontal velocity decreases during flight.
- Acceleration is zero at the peak because vertical velocity is zero.
- Zero velocity implies zero acceleration or zero force.
- Horizontal and vertical motions are coupled.
- Heavier objects fall faster.
- Gravity turns off or reverses at the top, or an upward force acts during the rise.
- The velocity vector at the peak points somewhere other than horizontal.
- Sign convention mistakes with g.
- Time of flight depends on horizontal velocity.
- Wrong kinematic equation for the axis.
- Forgetting both axes share the same time.
- Maximum range at an angle other than 45 degrees without reasoning about components or launch height.

## Caveats

- Bloom's two sigma is not a target.
- Almost none of this was tested on voice LLM tutors. Exact seconds of talk, struggle caps, and hint pacing are hypotheses.
- The three-way stuck diagnosis is a heuristic; verify by re-probing.
- No proven fading schedule for scaffolding.
- ICAP's premise that overt behavior reveals engagement is contested; adapt guidance to level.
- Guardrailed AI matched but did not beat no-AI in Bastani et al.
- Rowe's finding on praise sits in tension with the instinct to encourage; resolve by pausing first and being process-specific.

## Staged build priorities

Stage 1, must-have: the ask-first loop and the hint ladder; the hard guardrail; the misconception watchlist with predict-then-explain; the student-first recap.
Stage 2, differentiators: expertise detection (worked example vs generate); three-way stuck branching; wait time, short turns, one question per turn, student-majority talk ratio; whiteboard trigger rules.
Stage 3, after the hackathon: A/B test tutored versus base behavior on a delayed unaided quiz. The metric is what the student can do without the tutor afterward.
