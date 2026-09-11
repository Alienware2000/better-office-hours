// Asks the tutor for a spatial explanation and checks that it opens the board
// and emits DRAW tags. Run with the app up: node scripts/check-board.mjs
import { deflateSync } from "node:zlib";

const BASE = process.env.BASE ?? "http://localhost:3100";

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function blankPage(w = 220, h = 285) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3, 0xff);
    row[0] = 0;
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const livePage = {
  psetId: "check-board",
  title: "Homework 1",
  page: 0,
  pages: 1,
  imageUrl: `data:image/png;base64,${blankPage().toString("base64")}`,
  text: "PHYS 180 Homework 1. Problem 1. A ball is launched at 20 m/s at 35 degrees. Resolve the launch velocity into horizontal and vertical components.",
  questionRegions: [{ label: "1", bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.2 } }],
};

async function turn(label, body) {
  const t0 = Date.now();
  const response = await fetch(`${BASE}/api/agent/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: true, ...body }),
  });
  if (!response.ok) {
    console.log(`${label}: HTTP ${response.status}`);
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let first = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      const json = JSON.parse(data);
      if (json.error) {
        console.log(`${label}: ERROR ${json.error.message}`);
        return "";
      }
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) {
        first ??= Date.now() - t0;
        text += delta;
      }
    }
  }

  const boardOpen = /\[BOARD\s+open\]/i.test(text);
  const drawBodies = [...text.matchAll(/\[DRAW\s+([^\]]+)\]/g)].map((match) => match[1].trim());
  const ops = drawBodies.map((body) => {
    try {
      const jsonStart = body.indexOf("{");
      if (jsonStart >= 0) return JSON.parse(body.slice(jsonStart)).op;
    } catch {
      // fall through
    }
    return body.split(/\s+/)[0]?.toLowerCase() || "?";
  });

  console.log(`\n${label}`);
  console.log(`  first token ${first}ms, total ${Date.now() - t0}ms`);
  console.log(`  board open: ${boardOpen}`);
  console.log(`  draw ops: ${ops.join(", ") || "(none)"}`);
  console.log(`  ${text.trim().replace(/\n+/g, " ").slice(0, 360)}`);
  return { text, boardOpen, ops };
}

const greeting = "Hey David, I'm your office hours tutor. What are we working on today?";

const first = await turn("draw velocity components", {
  messages: [
    { role: "assistant", content: greeting },
    {
      role: "user",
      content:
        "I don't get why we split the launch velocity into components. Can you draw it on the board?",
    },
  ],
  livePage,
});

const second = await turn("draw the components next", {
  messages: [
    { role: "assistant", content: greeting },
    {
      role: "user",
      content:
        "I don't get why we split the launch velocity into components. Can you draw it on the board?",
    },
    { role: "assistant", content: first.text },
    {
      role: "user",
      content: "Yes, please draw the horizontal and vertical parts on the board.",
    },
  ],
  livePage,
  liveBoard: { open: true, imageUrl: "", studentShapesSince: "" },
});

const drawCount = first.ops.length + second.ops.length;
if (!first.boardOpen || drawCount < 2) {
  console.log(
    `\nFAIL: expected [BOARD open] on the first turn and at least two [DRAW ...] across turns (got ${drawCount}).`,
  );
  process.exitCode = 1;
} else {
  console.log(`\nOK: board open and ${drawCount} draw tags across turns.`);
}
