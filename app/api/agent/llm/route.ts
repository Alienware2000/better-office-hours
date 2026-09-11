import { asSessionEvent } from "@/lib/agent/events";
import { GROK_DEEP_MODEL, GROK_MODEL, streamGrok, usesConceptLesson } from "@/lib/agent/grok";
import { setLivePage, type LivePage } from "@/lib/pdf/live-page";
import { asLiveBoard, setLiveBoard } from "@/lib/whiteboard/live-board";
import type { ChatMessage } from "@/lib/agent/tags";
import { parseAgentTurn } from "@/lib/agent/tags";

export const dynamic = "force-dynamic";

function asMessages(body: unknown): ChatMessage[] {
  if (!body || typeof body !== "object" || !("messages" in body)) return [];
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];
  return messages.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: string }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant" && role !== "system") return [];
    if (typeof content !== "string") return [];
    return [{ role, content }];
  });
}

function asLivePage(body: unknown): LivePage | null {
  if (!body || typeof body !== "object" || !("livePage" in body)) return null;
  const live = (body as { livePage?: unknown }).livePage;
  if (!live || typeof live !== "object") return null;
  const page = live as Partial<LivePage>;
  if (typeof page.psetId !== "string" || typeof page.imageUrl !== "string") {
    return null;
  }
  return {
    psetId: page.psetId,
    documentKind: page.documentKind === "notes" ? "notes" : "pset",
    title: typeof page.title === "string" ? page.title : "",
    page: typeof page.page === "number" ? page.page : 0,
    pages: typeof page.pages === "number" ? page.pages : 1,
    imageUrl: page.imageUrl,
    text: typeof page.text === "string" ? page.text : "",
    questionRegions: Array.isArray(page.questionRegions)
      ? page.questionRegions
      : [],
    textRegions: Array.isArray(page.textRegions) ? page.textRegions.slice(0, 180).filter(region =>
      typeof region?.label === "string" && region.bbox &&
      [region.bbox.x, region.bbox.y, region.bbox.w, region.bbox.h].every(n => Number.isFinite(n) && n >= 0 && n <= 1)
    ) : [],
    studentMarks: typeof page.studentMarks === "number" ? page.studentMarks : 0,
  };
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const history = asMessages(body);
  const event = asSessionEvent(
    body && typeof body === "object" ? (body as { event?: unknown }).event : null,
  );
  const deep: boolean =
    !!body && typeof body === "object" && (body as { deep?: unknown }).deep === true;
  const visualRepair = !!body && typeof body === "object" && (body as { visualRepair?: unknown }).visualRepair === true;
  setLivePage(asLivePage(body));
  setLiveBoard(
    body && typeof body === "object"
      ? asLiveBoard((body as { liveBoard?: unknown }).liveBoard)
      : null,
  );
  const model = deep ? GROK_DEEP_MODEL : GROK_MODEL;
  const structuredLesson = usesConceptLesson(deep, visualRepair);
  const id = `tutor-${crypto.randomUUID()}`;
  const started = Date.now();
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();

  let cancelled = false;
  const upstream = new AbortController();
  const cancel = () => { cancelled = true; upstream.abort(); };
  req.signal.addEventListener("abort", cancel, { once: true });
  if (req.signal.aborted) cancel();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      let raw = '';
      let firstVisualMs: number | null = null;
      let firstSpeechMs: number | null = null;
      try {
        for await (const content of streamGrok(history, event, deep, upstream.signal, visualRepair)) {
          raw += content;
          if (firstVisualMs === null && /\[(?:DRAW|ANIM) /.test(raw)) firstVisualMs = Date.now() - started;
          if (firstSpeechMs === null && parseAgentTurn(raw).speech) firstSpeechMs = Date.now() - started;
          send({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            // Structured generator yields only completed introductions/beats.
            // Preserve that boundary after speech parsing trims whitespace.
            bohSpeechBoundary: structuredLesson && content.endsWith('\n'),
            choices: [{ index: 0, delta: { content }, finish_reason: null }],
          });
        }
        if (process.env.NODE_ENV !== 'production') {
          const turn = parseAgentTurn(raw);
          console.info('Tutor visual response ' + JSON.stringify({ request: id, deep, visualRepair, elapsedMs: Date.now() - started, firstSpeechMs, firstVisualMs, speechWords: turn.speech.trim() ? turn.speech.trim().split(/\s+/).length : 0, think: turn.think === true, teaching: turn.teaching, commands: turn.board?.commands.length ?? 0, animation: Boolean(turn.board?.animation), control: Boolean(turn.board?.animControl) }));
        }
        send({
          id,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        });
        if (!cancelled) controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.info('Tutor visual incomplete ' + JSON.stringify({ request: id, deep, visualRepair, elapsedMs: Date.now() - started, firstVisualMs, cancelled, receivedCharacters: raw.length, errorType: error instanceof SyntaxError ? 'invalid_json' : 'request_failed' }));
        const message = error instanceof SyntaxError
          ? "The tutor's response was interrupted. Your work is still here. Please try again."
          : error instanceof Error ? error.message : "Tutor request failed";
        send({ error: { message } });
      } finally {
        req.signal.removeEventListener("abort", cancel);
        if (!cancelled) controller.close();
      }
    },
    cancel,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Tutor-Request": id,
    },
  });
}
