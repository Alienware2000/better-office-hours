import { teachingIntent, teachingTag } from './teaching-intent';
import { parseDrawCommand } from '@/lib/whiteboard/parse-draw';
import { validateAnimation } from '@/lib/whiteboard/animation';

export const CONCEPT_RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: { name: 'concept_lesson', strict: true, schema: {
    type: 'object', additionalProperties: false,
    required: ['handoff', 'move', 'visual', 'introduction', 'beats', 'question'],
    properties: {
      handoff: { type: 'boolean', enum: [false] },
      move: { type: 'string', enum: ['elicit', 'orient', 'hint', 'consolidate', 'explain'] },
      visual: { type: 'string', enum: ['none', 'notes', 'diagram', 'animation'] },
      introduction: { type: 'string' },
      beats: { type: 'array', items: { type: 'object', additionalProperties: false,
        required: ['pdf', 'draw', 'animation', 'speech'], properties: {
          pdf: { type: 'string', description: 'One existing POINT or HIGHLIGHT tag for the attached PDF, or empty.' },
          draw: { type: 'array', items: { type: 'string' } },
          animation: { type: 'string' }, speech: { type: 'string' },
        } } },
      question: { type: 'string' },
    },
  } },
};

export const CONCEPT_FORMAT_GUIDANCE = `You are in the reasoning teaching lane. The handoff may have been silent; begin with the useful response, never a waiting line. Return the concept_lesson JSON object, not free-form prose or bracket tags. Write keys in this order: handoff, move, visual, introduction, beats, question. Always set handoff=false. Check the learner's work and the correctness of your explanation and geometry before responding. Continue directly with substantive teaching, without another acknowledgement or greeting.
Choose move and visual from the learner's actual need using the teaching guidance. An explanation or walkthrough uses the board in this turn, even without an explicit drawing request. Orient/explain require notes, diagram, or animation; visual=none is only for a short confirmation or a focused question that needs no new explanation. Build on an existing picture when available. Keep confirmations/checks to about 15 to 30 spoken words. Use 35 to 55 words for an explanation, with 70 as a ceiling, not a target. Do not recap the setup or repeat established givens after every answer. Let a capable learner carry out a step without quizzing each substitution. The introduction can be empty; otherwise it is one short sentence that adds meaning without repeating a beat. Use zero beats for a simple verbal probe, one focused beat for a small hint or checked step, and two for a new explanatory figure. A third is rarely needed. Each sentence must earn its place. Each beat has pdf (one existing POINT or HIGHLIGHT tag using the attached PDF's measured anchors, or empty), draw (an array of JSON-encoded DRAW command strings using the existing schema), animation (a JSON-encoded ANIM spec, the control string resume or focus=existing-shape-id, or empty string), and speech (one short spoken sentence naming exactly what that beat adds or focuses). The app draws each beat as its sentence begins. Put the first object/setup in the first beat and add relationships in later beats; do not put the whole illustration in one beat and then merely read it. Reuse IDs for revisions/focus. To signal an existing diagram or note, put the JSON string {"op":"highlight","id":"existing-id"} in draw; merely saying look here or pointing at the PDF does not focus the board. Do not choose diagram/notes and leave all commands empty. Use visual=none for a short check that needs no board change, instead of requesting a redundant recovery drawing. Keep the existing topic when continuing the same reasoning, including adding a short annotation. At most five total primary shapes, with concise attached labels and a few informative callouts or short notes as needed. Simple geometry is enough: make the explanation visual through clear annotation, meaningful color, and staged emphasis. A later beat can label or annotate the existing figure instead of adding another object. Equations supplement the diagram only when the teaching move permits revealing that relationship. No bracket tags inside speech, introduction, or question.
For spatial, structural, or temporal understanding, choose a diagram, comparison, or valid animation and include meaningful geometry. A diagram must contain objects or nodes with visible connections, not just text placed diagonally. When a learner on an assignment cannot yet picture the problem, choose orient: show only its objects, givens, and explicitly stated events. Stop paths at the last established event and leave the unknown continuation blank. Decide what the learner will predict first, then ensure no narration, label, path, arrow, or animation supplies that prediction. Leave component decompositions, force/direction claims, changing-value arrows, equations, and conclusions for later unless already established. Build the setup needed to make ONE noticing question answerable. Do not explain a result and then ask the learner to predict that same result. A short confirmation or a question about an established picture can use elicit/consolidate with visual=none. Standalone one-sentence definitions stay in the direct routing lane. The requested visual can be supplied proactively without an explicit request to draw. When change over time is what the learner needs to see, animate that change during its spoken beat. Start with DRAW for the scene, then reuse the object IDs in ANIM so the same picture comes to life. Use current animation state for follow-up resume or focus instead of replacing the scene. A qualitative motion can show the stated setup without giving away an equation, unknown quantity, or the prediction you will ask. Animate only what is established, leaving the requested inference unseen. A static comparison is appropriate when time evolution cannot be represented faithfully. Do not depict changing quantities as static arrows and then claim they are changing. Finish with at most one short question or invitation to continue. The question can be empty when the learner simply needed a confirmation; do not force a quiz. Total speech under 70 words. Never include the answer or relationship the learner is being asked to produce, or a complete graded solution. An explanatory setup picture is allowed before that question.
<lesson_purpose>
Interpret the actual request and supplied material before applying a hint ladder. Learning a concept is not itself a graded task. For ungraded concept learning, use move=explain even when the learner is completely lost: give the explanation, requested equations, and an illustrative worked example directly. Show why the notation matches the picture. A request to understand the math needs actual symbolic relationships on the board, not just a named angle and another recall question. Do not require guessing prerequisites before teaching them. If the learner says they do not know, change the explanation and show the missing connection instead of repeating the same question. Ask at most one optional application or self-explanation question after sufficient instruction; the question field may be empty. Do not announce readiness to move on just because the learner named a shape or agreed once. For a knowledgeable learner asking a narrow clarification, answer that point concisely and stop, without restarting a lesson or forced quiz. These instructions refine the generic questioning defaults for concept teaching.
The workspace mode is context, not a permission bypass. If the request/material concerns a graded assignment, preserve elicitation and contingent hints, and never supply its final result or complete solution, including in the concept workspace. Tutor-created formulas/diagrams are scaffolds, never evidence of student mastery. Choose the move from the conversation; no topic-specific rules.
</lesson_purpose>
<rendering_check>
Use separate short DRAW text equations instead of an aligned block inside nested JSON; this avoids broken row separators and crowded formulas. Compact symbol labels such as theta belong by the feature they denote: place an angle label inside the angle, near its vertex, never beyond the vector tip. Give formulas their own clear space below the figure. Make a small right-triangle construction visible when teaching projections. Use the exact palette names ink, accent, muted, warn in DRAW and ANIM. ANIM path drawn ranges only from 0 to 1; move a dot with Follow on the same curve, never interpolate a curved flight from only three positions. Use diagram.attach for moving vector origins and diagram.component for projections, with all reference IDs present. Keep the narration to one useful sentence per beat, not a paragraph. For an expert's narrow clarification, do not reintroduce the entire setup.
</rendering_check>`;

const spoken = (text: unknown) => typeof text === 'string' ? text.replace(/\[(?:TEACH|DRAW|ANIM|BOARD|MODE|THINK|POINT|HIGHLIGHT|RECAP)\b[^\n]*\]/g, '').trim() : '';
const HEADER = /^\s*\{\s*"handoff"\s*:\s*(true|false)\s*,\s*"move"\s*:\s*"(\w+)"\s*,\s*"visual"\s*:\s*"(\w+)"\s*,\s*"introduction"\s*:\s*("(?:\\.|[^"\\])*")/;

// Only a complete ordered header can speak early. Escaped quotation marks and
// partial strings remain buffered; no partial JSON is shown or spoken.
export function conceptHeader(raw: string): string {
  const match = raw.match(HEADER);
  if (!match) return '';
  if (match[1] === 'true') return `${spoken(JSON.parse(match[4]))} [THINK]\n`;
  const intent = teachingIntent({ move: match[2], visual: match[3] });
  if (!intent) return '';
  return `${teachingTag(intent)}\n${spoken(JSON.parse(match[4]))}\n`;
}

export function conceptResponse(raw: string): string {
  const value = JSON.parse(raw) as { handoff: boolean; move?: string; visual?: string; introduction?: string; beats?: unknown[]; question?: string };
  if (!value || typeof value.handoff !== 'boolean') throw new Error('The concept explanation was incomplete. Please try again.');
  if (value.handoff === true) {
    return `${spoken(value.introduction)} [THINK]\n`;
  }
  const intent = teachingIntent({ move: value.move ?? '', visual: value.visual ?? '' });
  if (!intent || !Array.isArray(value.beats)) throw new Error('The concept explanation was incomplete. Please try again.');
  const header = `${teachingTag(intent)}\n${spoken(value.introduction)}\n`;
  const result: string[] = [header];
  let previousSpeech = spoken(value.introduction);
  for (const item of value.beats.slice(0, 3)) {
    if (!item || typeof item !== 'object') continue;
    const beat = item as { pdf?: string; draw?: unknown[]; animation?: string; speech?: string };
    // Keep the existing measured PDF targeting path. A beat cannot inject a
    // mode switch or a different teaching move through this field.
    if (typeof beat.pdf === 'string' && /^\[(?:POINT|HIGHLIGHT) [^\[\]\r\n]{1,500}\]$/.test(beat.pdf.trim())) result.push(beat.pdf.trim() + '\n');
    if (intent.visual !== 'none') {
      for (const raw of Array.isArray(beat.draw) ? beat.draw.slice(0, 6) : []) {
        if (typeof raw !== 'string') continue;
        try {
          const command = parseDrawCommand(raw);
          if (command) result.push(`[BOARD open][DRAW ${JSON.stringify(command)}]\n`);
        } catch { /* Invalid drawing is eligible for the existing silent repair. */ }
      }
      if (typeof beat.animation === 'string' && beat.animation.trim()) {
        const control = beat.animation.trim();
        if (/^(?:resume|focus=[\w.-]{1,100})$/.test(control)) {
          result.push(`[BOARD open][ANIM ${control}]\n`);
        } else {
        try {
          const animation = validateAnimation(JSON.parse(beat.animation));
          if (animation) result.push(`[BOARD open][ANIM ${JSON.stringify(animation)}]\n`);
        } catch { /* Same repair path. */ }
        }
      }
    }
    const speech = spoken(beat.speech);
    if (speech && speech !== previousSpeech) result.push(speech + '\n');
    if (speech) previousSpeech = speech;
  }
  const question = spoken(value.question);
  if (question && question !== previousSpeech) result.push(question + '\n');
  return result.join('');
}

// Release each complete beat while later beats are still arriving. A brace
// inside quoted LaTeX/JSON is data, and cannot end a beat early.
export function conceptProgress(raw: string): string {
  const match = raw.match(HEADER);
  if (!match) return '';
  const header = conceptHeader(raw);
  if (!header || match[1] === 'true') return header;
  const tail = raw.slice(match[0].length);
  const opening = tail.match(/^\s*,\s*"beats"\s*:\s*\[/);
  if (!opening) return header;
  const beats: unknown[] = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = opening[0].length; i < tail.length && beats.length < 3; i++) {
    const ch = tail[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (start < 0) {
      if (/\s|,/.test(ch)) continue;
      if (ch !== '{') break;
      start = i;
    }
    if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { beats.push(JSON.parse(tail.slice(start, i + 1))); } catch { break; }
      start = -1;
    }
  }
  return conceptResponse(JSON.stringify({ handoff: false, move: match[2], visual: match[3], introduction: JSON.parse(match[4]), beats, question: '' }));
}
