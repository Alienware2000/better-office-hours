import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

export function loadTutorPrompt(courseName = "PHYS 180"): string {
  if (!cached) {
    const raw = readFileSync(join(process.cwd(), "docs/PROMPT.md"), "utf8");
    const marker = "\n---\n";
    const start = raw.indexOf(marker);
    cached = (start === -1 ? raw : raw.slice(start + marker.length)).trim();
  }

  return cached
    .replaceAll("{courseName}", courseName)
    .replaceAll("{stylePreset}", "balanced");
}
