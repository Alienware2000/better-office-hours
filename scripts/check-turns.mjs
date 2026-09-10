// Exercises /api/agent/llm the way the client does, so turn latency, phrasing
// variety, and the proactive upload turn can be checked without a mic.
// Run with: node scripts/check-turns.mjs
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

// Blank page stand-in. The tutor reads the wording from <pset_text>.
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
  psetId: "check",
  title: "Homework 1",
  page: 0,
  pages: 3,
  imageUrl: `data:image/png;base64,${blankPage().toString("base64")}`,
  text: "PHYS 180 Homework 1. Problem 1. A ball is thrown from a 12 m cliff at 8 m/s at 30 degrees above the horizontal. (a) Find the time of flight. (b) Find the horizontal range. Problem 2. A block slides down a frictionless incline of 25 degrees. Find its acceleration.",
  questionRegions: [
    { label: "1", bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.1 } },
    { label: "2", bbox: { x: 0.1, y: 0.5, w: 0.8, h: 0.1 } },
  ],
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

  console.log(`\n${label}`);
  console.log(`  first token ${first}ms, total ${Date.now() - t0}ms`);
  console.log(`  ${text.trim().replace(/\n+/g, " ")}`);
  return text;
}

const greeting = "Hey David, I'm your office hours tutor. What are we working on today?";

// Same student line three times, to see whether phrasing actually varies.
for (let i = 1; i <= 3; i++) {
  await turn(`open turn ${i}`, {
    messages: [
      { role: "assistant", content: greeting },
      { role: "user", content: "uh yeah I need to do my physics homework" },
    ],
  });
}

// The proactive turn: no student utterance, the PDF just became visible.
await turn("pset_ready event", {
  messages: [
    { role: "assistant", content: greeting },
    { role: "user", content: "uh yeah I need to do my physics homework" },
    {
      role: "assistant",
      content: "Sure. Drop it in and I'll take a look.",
    },
  ],
  livePage,
  event: { kind: "pset_ready", title: "Homework 1", pages: 3 },
});

// A real question against the page, to confirm pointing still happens.
await turn("question on page", {
  messages: [
    { role: "assistant", content: greeting },
    { role: "user", content: "can you help me with problem 1, I don't know where to start" },
  ],
  livePage,
});
