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

export const CONCEPT_FORMAT_GUIDANCE = `You are already in the reasoning teaching lane and the learner has heard a brief acknowledgement. Return the concept_lesson JSON object, not free-form prose or bracket tags. Write keys in this order: handoff, move, visual, introduction, beats, question. Always set handoff=false. Check the learner's work and the correctness of your explanation and geometry before responding. Continue directly with substantive teaching, without another acknowledgement or greeting.
Choose move and visual from the learner's actual need using the teaching guidance. The introduction is one short natural sentence that starts teaching the idea, with no greeting or boilerplate about withholding homework answers. Then give at most three beats around one useful figure. Each beat has pdf (one existing POINT or HIGHLIGHT tag using the attached PDF's measured anchors, or empty), draw (an array of JSON-encoded DRAW command strings using the existing schema), animation (a JSON-encoded ANIM spec, the control string resume or focus=existing-shape-id, or empty string), and speech (one short spoken sentence naming exactly what that beat adds or focuses). The app draws each beat as its sentence begins. Put the first object/setup in the first beat and add relationships in later beats; do not put the whole illustration in one beat and then merely read it. Reuse IDs for revisions/focus. At most five total primary shapes, with concise attached labels and a few informative callouts or short notes as needed. Simple geometry is enough: make the explanation visual through clear annotation, meaningful color, and staged emphasis. A later beat can label or annotate the existing figure instead of adding another object. Equations supplement the diagram only when the teaching move permits revealing that relationship. No bracket tags inside speech, introduction, or question.
For spatial, structural, or temporal understanding, choose a diagram, comparison, or valid animation and include meaningful geometry. A diagram must contain objects or nodes with visible connections, not just text placed diagonally. When the learner cannot yet picture an idea, choose orient: show only its objects, an initial situation, and a neutral reference or qualitative path. Leave component decompositions, force/direction claims, changing-value arrows, equations, and conclusions for later unless already established. Build the setup needed to make ONE noticing question answerable. Do not explain a result and then ask the learner to predict that same result. For a simple definition, acknowledgement, or clarification where a picture adds little, choose visual=none with no draw or animation. The requested visual can be supplied proactively without an explicit request to draw. When change over time is what the learner needs to see, animate that change during its spoken beat. Start with DRAW for the scene, then reuse the object IDs in ANIM so the same picture comes to life. Use current animation state for follow-up resume or focus instead of replacing the scene. A qualitative motion can show the stated setup without giving away an equation, unknown quantity, or the prediction you will ask. Animate only what is established, leaving the requested inference unseen. A static comparison is appropriate when time evolution cannot be represented faithfully. Do not depict changing quantities as static arrows and then claim they are changing. Finish with at most one short noticing or prediction question; leave it empty if the learner requested only a one-sentence definition. Total speech under 70 words. Never include the answer or relationship the learner is being asked to produce, or a complete graded solution. An explanatory setup picture is allowed before that question.`;

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
