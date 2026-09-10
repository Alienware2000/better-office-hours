import type {
  AgentTurn,
  AnimationProgram,
  AnimationSpec,
  BBox,
  DrawCommand,
} from "@/lib/types";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const ATTR = /(\w+)=(?:"([^"]*)"|(\S+))/g;

function attrs(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of inner.matchAll(ATTR)) {
    out[match[1]] = match[2] ?? match[3] ?? "";
  }
  return out;
}

function num(value: string | undefined, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readJson(source: string, openAt: number): { value: unknown; end: number } | null {
  if (openAt < 0 || source[openAt] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = openAt; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return { value: JSON.parse(source.slice(openAt, i + 1)), end: i + 1 };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function applyTag(turn: AgentTurn, name: string, body: string) {
  if (name === "RECAP") {
    turn.recap = true;
    return;
  }
  if (name === "BOARD") {
    turn.board = turn.board ?? { commands: [] };
    if (body.trim() === "open") turn.board.open = true;
    return;
  }
  if (name === "MODE") {
    const mode = body.trim();
    if (mode === "pset" || mode === "concept") turn.mode = mode;
    return;
  }
  if (name === "POINT") {
    const a = attrs(body);
    turn.pointer = {
      page: num(a.page, 1),
      x: num(a.x),
      y: num(a.y),
      label: a.label,
    };
    return;
  }
  if (name === "HIGHLIGHT") {
    const a = attrs(body);
    const bbox: BBox = {
      x: num(a.x),
      y: num(a.y),
      w: num(a.w),
      h: num(a.h),
    };
    turn.highlight = { page: num(a.page, 1), bbox };
    return;
  }
  if (name === "DRAW") {
    const json = readJson(body.trim(), body.trim().indexOf("{"));
    if (!json) return;
    turn.board = turn.board ?? { commands: [] };
    turn.board.commands.push(json.value as DrawCommand);
    return;
  }
  if (name === "ANIM_PROGRAM") {
    const json = readJson(body.trim(), body.trim().indexOf("{"));
    if (!json) return;
    turn.board = turn.board ?? { commands: [] };
    turn.board.animation = json.value as AnimationProgram;
    return;
  }
  if (name === "ANIM") {
    const trimmed = body.trim();
    if (trimmed === "resume") {
      turn.board = turn.board ?? { commands: [] };
      turn.board.animControl = { ...turn.board.animControl, resume: true };
      return;
    }
    if (trimmed.startsWith("focus=")) {
      turn.board = turn.board ?? { commands: [] };
      turn.board.animControl = {
        ...turn.board.animControl,
        focus: trimmed.slice("focus=".length),
      };
      return;
    }
    const json = readJson(trimmed, trimmed.indexOf("{"));
    if (!json) return;
    turn.board = turn.board ?? { commands: [] };
    turn.board.animation = json.value as AnimationSpec;
  }
}

export function parseAgentTurn(raw: string): AgentTurn {
  const turn: AgentTurn = { speech: "" };
  let speech = "";
  let i = 0;

  while (i < raw.length) {
    if (raw[i] !== "[") {
      speech += raw[i];
      i += 1;
      continue;
    }

    const close = raw.indexOf("]", i + 1);
    const brace = raw.indexOf("{", i + 1);
    let end = -1;
    let inner = "";

    if (brace !== -1 && (close === -1 || brace < close)) {
      const json = readJson(raw, brace);
      if (!json) {
        speech += raw[i];
        i += 1;
        continue;
      }
      end = raw[json.end] === "]" ? json.end + 1 : json.end;
      inner = raw.slice(i + 1, end - (raw[end - 1] === "]" ? 1 : 0));
    } else if (close !== -1) {
      end = close + 1;
      inner = raw.slice(i + 1, close);
    } else {
      speech += raw[i];
      i += 1;
      continue;
    }

    const space = inner.search(/\s/);
    const name = (space === -1 ? inner : inner.slice(0, space)).trim();
    const body = space === -1 ? "" : inner.slice(space + 1);
    const known = [
      "POINT",
      "HIGHLIGHT",
      "BOARD",
      "DRAW",
      "ANIM_PROGRAM",
      "ANIM",
      "MODE",
      "RECAP",
    ];
    if (known.includes(name)) {
      applyTag(turn, name, body);
    } else {
      speech += raw.slice(i, end);
    }
    i = end;
  }

  turn.speech = speech.replace(/\s+/g, " ").trim();
  return turn;
}

export function takeSpeechChunks(spoken: string, emitted: number): {
  chunk: string;
  consumed: number;
} {
  const pending = spoken.slice(emitted);
  const match = pending.match(/^([\s\S]*?[.!?])(?:\s|$)/);
  if (match && match[1].trim().split(/\s+/).length >= 2) {
    return { chunk: match[1].trim(), consumed: emitted + match[0].length };
  }
  const words = pending.trim().split(/\s+/);
  if (words.length >= 8) {
    const chunk = words.slice(0, 8).join(" ");
    return { chunk, consumed: emitted + pending.indexOf(chunk) + chunk.length };
  }
  return { chunk: "", consumed: emitted };
}
