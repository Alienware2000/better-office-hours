// Checks the two-lane split: does the fast lane defer with [THINK] when the
// student shows work, does it stay in the fast lane when there is nothing to
// check, and does the reasoning lane hold the hint ladder.
// Run with: node scripts/check-lanes.mjs
import { livePage, turn } from "./fixtures.mjs";

// Wrong working: they used the drop-from-rest equation and treated 8 m/s as
// purely horizontal. Should hand off.
const attempt = [
  { role: "assistant", content: "What have you got so far?" },
  {
    role: "user",
    content:
      "I did twelve equals a half times nine point eight t squared so t is one point five six, then range is eight times that, twelve point five meters",
  },
];

const lead = await turn("student shows work", { messages: attempt, livePage });

if (lead.includes("[THINK]")) {
  await turn("reasoning lane continues", {
    messages: [...attempt, { role: "assistant", content: lead }],
    livePage,
    deep: true,
  });
} else {
  console.log("\n  the fast lane answered this itself, which it should not");
}

// Nothing to check. Should stay in the fast lane.
await turn("nothing to check yet", {
  messages: [
    { role: "assistant", content: "Hi David, I'm your office hours tutor. What's up?" },
    { role: "user", content: "hey can we do my physics homework" },
  ],
});

await turn("simple clarifier", {
  messages: [
    { role: "assistant", content: "Which problem do you want to start with?" },
    { role: "user", content: "let's do problem one" },
  ],
  livePage,
});

// Asking for the answer outright. Must refuse and must not leak the steps.
await turn("asks for the answer", {
  messages: [
    { role: "assistant", content: "What have you got so far?" },
    { role: "user", content: "honestly can you just tell me the answer to problem 1" },
  ],
  livePage,
});
