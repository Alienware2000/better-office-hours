import type { DrawCommand } from '@/lib/types';

// A general relationship already spoken should not remain invisible merely
// because the model omitted its DRAW tag. This copies notation, never solves.
export function symbolicRelation(input: string): string | null {
  const text = input.replace(/\b(squared|cubed|equals|equal to|plus|minus|times|two)\b/gi, word => ({
    squared: '²', cubed: '³', equals: '=', 'equal to': '=', plus: '+', minus: '-', times: '×', two: '2',
  }[word.toLowerCase()] ?? word)).replace(/\s+([²³])/g, '$1');
  for (const match of text.matchAll(/(?<![\p{L}\p{N}_])([a-zα-ωΔ](?:[₀-₉²³]|\^\d)*)\s*=/giu)) {
    const rest = text.slice(match.index + match[0].length);
    const tokens: string[] = [];
    let position = 0;
    const token = /\s*([a-zα-ωΔ]{1,3}[₀-₉²³]*|\d+(?:\.\d+)?|[+\-×*/^()])/giy;
    while (position < rest.length) {
      token.lastIndex = position;
      const next = token.exec(rest);
      if (!next || /^(at|is|the|and|for|not|so)$/i.test(next[1])) break;
      // Do not cut the start of a prose word into fake variables.
      if (/[\p{L}]/u.test(rest[token.lastIndex] ?? '') && /[\p{L}]/u.test(next[1].at(-1) ?? '')) break;
      tokens.push(next[1]); position = token.lastIndex;
    }
    const rhs = tokens.join(' ').trim();
    if (!rhs || !/[a-zα-ωΔ]/i.test(rhs) || /[+\-×*/^(]$/.test(rhs)) continue;
    // Numeric assignments with units, computed answers, and long expressions
    // are deliberately excluded. General symbolic formulas retain constants.
    if (/^\d/.test(rhs) && !/[+\-×]/.test(rhs)) continue;
    if (/^[+\-]?\s*\d+(?:\.\d+)?\s*(?:m|s|kg|N|J)(?:\s*\/\s*s[²³]?)?$/i.test(rhs)) continue;
    const relation = `${match[1]} = ${rhs}`;
    if (relation.length <= 64) return relation;
  }
  return null;
}

export function speechBoardCue(speech: string, student: string, existing: string[]): DrawCommand | null {
  const relation = symbolicRelation(speech) ??
    (/\b(?:yes|correct|right|that's the one|that equation)\b/i.test(speech) ? symbolicRelation(student) : null);
  if (!relation) return null;
  const key = (text: string) => text.replace(/\s+/g, '').toLowerCase();
  if (existing.some(text => key(text) === key(relation))) return null;
  return { op: 'text', id: 'relation', at: { x: .5, y: .3 }, text: relation, size: 'm' };
}

export function needsBoardRepair(student: string, speech: string, hasVisual: boolean): boolean {
  if (hasVisual || speech.length < 40 || symbolicRelation(speech)) return false;
  return /\b(draw|diagram|visuali[sz]e|picture|illustrat\w*|example|equation|formula|remind|givens)\b/i.test(student) ||
    /\b(imagine|for example|picture this|look at the board|givens|quantities|variables|relationship|equation|formula)\b/i.test(speech);
}
