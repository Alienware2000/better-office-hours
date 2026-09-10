// Shared fixtures for the check scripts. The page image has to be a real
// image above the API's minimum pixel count, and `livePage` is dropped
// server-side unless `imageUrl` is a string, so a null here silently removes
// all pset context from a test.
import { deflateSync } from "node:zlib";

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
export function blankPageDataUrl(w = 220, h = 285) {
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
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export const livePage = {
  psetId: "check",
  title: "Homework 1",
  page: 0,
  pages: 3,
  imageUrl: blankPageDataUrl(),
  text: "PHYS 180 Homework 1. Problem 1. A ball is thrown from a 12 m cliff at 8 m/s at 30 degrees above the horizontal. (a) Find the time of flight. (b) Find the horizontal range. Problem 2. A block slides down a frictionless incline of 25 degrees. Find its acceleration.",
  questionRegions: [
    { label: "1", bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.1 } },
    { label: "2", bbox: { x: 0.1, y: 0.5, w: 0.8, h: 0.1 } },
  ],
};

const BASE = process.env.BASE ?? "http://localhost:3100";

export async function turn(label, body) {
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
        console.log(`\n${label}\n  ERROR ${json.error.message}`);
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
  console.log(
    `  first ${first}ms, total ${Date.now() - t0}ms${
      text.includes("[THINK]") ? ", hands off to the reasoning lane" : ""
    }`,
  );
  console.log(`  ${text.trim().replace(/\s+/g, " ")}`);
  return text;
}
