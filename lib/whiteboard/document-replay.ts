import type { DocumentPage } from './document';
import { groupReveal } from './reveal';

// The static study and live writing renderer share glyph timing. One absolute
// clock makes pause, resume and backwards scrubbing independent of CSS timers.
export function documentTimeline(page: DocumentPage) {
  let cursor = 0;
  const groups = new Map(page.groups.map(group => [group.id,group]));
  const steps = page.steps.map(id => {
    const group = groups.get(id);
    if(!group)throw new Error(`Missing replay group: ${id}`);
    const duration = groupReveal(group).duration;
    const step = { id, start:cursor, duration };
    cursor += duration + 120;
    return step;
  });
  return { steps, duration:Math.max(0,cursor-120) };
}
