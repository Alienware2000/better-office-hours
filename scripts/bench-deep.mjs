// Picks the model for the reasoning lane. The lead-in only masks a few seconds
// of silence, so total time matters more than time to first token here.
// Run with: node scripts/bench-deep.mjs
import { readFileSync } from "node:fs";
import OpenAI from "openai";

const raw = readFileSync("docs/PROMPT.md", "utf8");
const marker = "\n---\n";
const at = raw.indexOf(marker);
const prompt = (at === -1 ? raw : raw.slice(at + marker.length)).trim();

const system = `${prompt
  .replaceAll("{courseName}", "your course")
  .replaceAll("{stylePreset}", "balanced")}

<pset>Homework 1, on page 1 of 3</pset>
<pset_text>Problem 1. A ball is thrown from a 12 m cliff at 8 m/s at 30 degrees above the horizontal. (a) Find the time of flight. (b) Find the horizontal range.</pset_text>
<deep_turn>You already told the student you were looking at their work. Continue with the substantive turn now. Do not greet and do not repeat the lead-in.</deep_turn>`;

// A wrong attempt that needs real checking: they used 8 m/s as the vertical
// component and dropped the cliff height.
const messages = [
  { role: "system", content: system },
  { role: "assistant", content: "What have you got so far?" },
  {
    role: "user",
    content:
      "I did twelve equals a half times nine point eight times t squared, so t is about one point five six seconds, and then range is eight times one point five six which is twelve point five meters",
  },
  { role: "assistant", content: "Let me look at that for a second." },
];

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const candidates = [
  { model: "grok-4.20-0309-reasoning" },
  { model: "grok-4.3" },
  { model: "grok-4.5" },
  { model: "grok-4.6", reasoning_effort: "low" },
];

for (const { model, reasoning_effort } of candidates) {
  const label = reasoning_effort ? `${model} (effort=${reasoning_effort})` : model;
  const t0 = Date.now();
  let first = null;
  let text = "";
  try {
    const stream = await grok.chat.completions.create({
      model,
      temperature: 0.6,
      max_tokens: 1200,
      stream: true,
      messages,
      ...(reasoning_effort ? { reasoning_effort } : {}),
    });
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content;
      if (delta) {
        first ??= Date.now() - t0;
        text += delta;
      }
    }
    console.log(`\n${label}`);
    console.log(`  first token ${first}ms, total ${Date.now() - t0}ms`);
    console.log(`  ${text.trim().replace(/\s+/g, " ")}`);
  } catch (error) {
    console.log(`\n${label}\n  failed: ${error.message.slice(0, 160)}`);
  }
}
