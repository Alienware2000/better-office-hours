import { conceptDraft, conceptResponse, LessonValidationError, type ConceptLesson, type LessonOptions } from './concept-response';

type Chunk = { choices: { delta: { content?: string | null } }[] };
export type LessonRecovery = { prefix: ConceptLesson; failure: LessonValidationError; remaining: number };

function continueLesson(prefix: ConceptLesson, tail: ConceptLesson): ConceptLesson {
  // A retry may replace a rejected visual, never change the teaching move,
  // repeat an introduction, or retract anything already sent to playback.
  if (tail.handoff || tail.move !== prefix.move || tail.visual !== prefix.visual || tail.introduction.trim() ||
      !Array.isArray(tail.beats) || tail.beats.length > 3 - prefix.beats.length) {
    throw new Error('The tutor could not safely continue that explanation. Your work is still here.');
  }
  return { ...prefix, beats: [...prefix.beats, ...tail.beats], question: tail.question };
}

/** One bounded recovery for a trial visual rejection, with the same validator.
 * The first accepted beat still streams immediately. Rejected content is never
 * emitted or logged. Provider/transport errors are not automatically retried.
 */
export async function* streamValidatedLesson(
  open: (recovery?: LessonRecovery) => Promise<AsyncIterable<Chunk>>,
  options: LessonOptions,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  let emitted = '';
  let accepted: ConceptLesson | null = null;
  let recovery: LessonRecovery | undefined;
  const output = (lesson: ConceptLesson) => {
    const text = conceptResponse(JSON.stringify(lesson), options);
    if (!text.startsWith(emitted)) throw new Error('The explanation changed while loading. Please try again.');
    const delta = text.slice(emitted.length);
    emitted = text;
    accepted = lesson;
    return delta;
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) throw new DOMException('Interrupted', 'AbortError');
    let raw = '';
    let failure: LessonValidationError | undefined;
    for await (const part of await open(recovery)) {
      if (signal?.aborted) throw new DOMException('Interrupted', 'AbortError');
      raw += part.choices[0]?.delta?.content ?? '';
      if (failure) continue;
      const draft = conceptDraft(raw);
      if (!draft) continue;
      try {
        const delta = output(recovery ? continueLesson(recovery.prefix, draft) : draft);
        if (delta) yield delta;
      } catch (error) {
        if (!(error instanceof LessonValidationError)) throw error;
        failure = error;
      }
    }
    if (!failure) {
      try {
        const complete = JSON.parse(raw) as ConceptLesson;
        if (recovery && !complete.beats?.length) throw new Error('The tutor could not finish that explanation. Please ask it to continue.');
        const delta = output(recovery ? continueLesson(recovery.prefix, complete) : complete);
        if (delta) yield delta;
        return;
      } catch (error) {
        if (!(error instanceof LessonValidationError)) throw error;
        failure = error;
      }
    }
    // Keep only the last fully validated prefix, not any rejected command or
    // its narration. A second rejection ends normally via the error channel.
    const draft = conceptDraft(raw);
    const prefix = accepted ?? (draft ? { ...draft, introduction: '', beats: [] } : null);
    if (attempt || !prefix || prefix.beats.length >= 3) throw failure;
    recovery = { prefix, failure, remaining: 3 - prefix.beats.length };
  }
}
