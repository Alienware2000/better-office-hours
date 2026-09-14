// Reuse the real board store/layout/React drawing components in this separate process.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cases } from '../bench-tutor-models.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const external = createRequire(import.meta.url), cache = new Map();
function load(file) {
  if (!path.extname(file)) file += fs.existsSync(file + '.tsx') ? '.tsx' : '.ts';
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  cache.set(file, mod.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(name => {
    if (name.startsWith('@/')) return load(path.join(root, name.slice(2)));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
    return external(name);
  }, mod, mod.exports);
  cache.set(file, mod.exports);
  return mod.exports;
}
const store = load(path.join(root, 'lib/whiteboard/store'));
const { BoardDrawing } = load(path.join(root, 'components/whiteboard/BoardDrawing'));
const { conceptResponse } = load(path.join(root, 'lib/agent/concept-response'));
const { parseAgentTurn } = load(path.join(root, 'lib/agent/tags'));

export function renderAcceptedBoard(caseId, board, snapshots = [{ board }]) {
  const fixture = cases.find(c => c.id === caseId);
  store.resetBoard();
  const initial = (fixture?.board?.tutorItems ?? []).flatMap(item => { try { return [JSON.parse(item.layout)]; } catch { return []; } });
  store.applyDrawCommands(initial);
  let commandCount = 0, previousAnimation = '';
  for (const snapshot of snapshots) {
    const accepted = snapshot.board;
    const commands = accepted?.commands ?? [];
    store.applyDrawCommands(commands.slice(commandCount));
    commandCount = commands.length;
    const animationJSON = JSON.stringify(accepted?.animation ?? null);
    if (accepted?.animation && animationJSON !== previousAnimation) store.loadAnimation(accepted.animation);
    previousAnimation = animationJSON;
    if (accepted?.animControl?.focus) store.focusAnimation(accepted.animControl.focus);
    for (const group of store.getBoardState().groups) store.markGroupShown(group.id);
  }
  const state = store.getBoardState();
  return renderToStaticMarkup(React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 1 1', preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Accepted board so far' },
    React.createElement(BoardDrawing, { groups: state.groups, student: [], animation: state.animation, time: 0, focus: state.focus, earlier: true })));
}

export function renderReview(result, stage = 'final', animationTime = 0) {
  const fixture = cases.find(c => c.id === result.case);
  let lesson;
  try { lesson = JSON.parse(result.rawContent); } catch { /* Preserve parser failure, never strip fences here. */ }
  if (!result.appParsed || !Array.isArray(lesson?.beats)) return {
    pages: [], stages: [], speech: result.speech ?? '', error: 'This response did not become a usable lesson. Inspect the raw response below.',
  };
  const selected = stage === 'final' ? Math.min(lesson.beats.length, 3) : Number(stage);
  if (!Number.isInteger(selected) || selected < 0 || selected > Math.min(lesson.beats.length, 3)) throw new Error('Invalid stage');
  store.resetBoard();
  const initial = (fixture?.board?.tutorItems ?? []).flatMap(item => {
    try { return [JSON.parse(item.layout)]; } catch { return []; }
  });
  if (initial.length) store.applyDrawCommands(initial);
  const stages = [{ value: '0', label: 'Introduction', speech: lesson.introduction ?? '' },
    ...lesson.beats.slice(0, 3).map((beat, i) => ({ value: String(i + 1), label: `Beat ${i + 1}`, speech: beat.speech ?? '' })),
    { value: 'final', label: 'Full response', speech: lesson.question ?? '' }];
  let turn;
  const warnings = [], availableIds = new Set(initial.map(c => c.id));
  // Replay cumulative accepted commands at each complete beat, using real layout/state.
  for (let i = 0; i <= selected; i++) {
    turn = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, beats: lesson.beats.slice(0, i), question: stage === 'final' && i === selected ? lesson.question : '' })));
    const beat = i > 0 ? lesson.beats[i - 1] : null;
    const delta = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, introduction: '', beats: beat ? [beat] : [], question: '' })));
    if (beat?.draw?.length > 6) warnings.push(`Current parser check: beat ${i} generated ${beat.draw.length} drawing commands; only the first six are considered.`);
    for (const command of delta.board?.commands ?? []) {
      if (command.op === 'highlight' && !availableIds.has(command.id)) warnings.push(`Current parser check: highlight targets missing object "${command.id}".`);
      else if (['text','circle','line','arrow','curve','axes'].includes(command.op)) availableIds.add(command.id);
      else if (command.op === 'clear') availableIds.clear();
      else if (command.op === 'remove') availableIds.delete(command.id);
    }
    if (delta.board?.commands) store.applyDrawCommands(delta.board.commands);
    if (delta.board?.animation) {
      const pageBefore = store.getBoardState().pageId;
      store.loadAnimation(delta.board.animation);
      if (store.getBoardState().pageId !== pageBefore) warnings.push('Current renderer starts a new page for this animation. Check whether the backdrop it refers to stayed on the earlier page.');
    }
    if (delta.board?.animControl?.focus) store.focusAnimation(delta.board.animControl.focus);
    for (const group of store.getBoardState().groups) store.markGroupShown(group.id);
  }
  const state = store.getBoardState();
  const pages = [...state.earlierPages, { id: state.pageId, ...state }].map(page => {
    const duration = page.animation?.duration ?? 0;
    const time = Math.max(0, Math.min(Number(animationTime) || 0, duration));
    const svg = renderToStaticMarkup(React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 1 1', preserveAspectRatio: 'none', role: 'img', 'aria-label': `Reconstructed tutor board page ${page.id}` },
      React.createElement(BoardDrawing, { groups: page.groups, student: page.student, animation: page.animation, time,
        focus: page.focus, pulseId: state.pulseId, earlier: true })));
    return { page: page.id, svg, duration, ids: page.groups.map(g => g.id) };
  });
  return { pages, stages, warnings, speech: turn?.speech ?? '', error: null,
    notice: 'Reconstruction with the current BOH layout and drawing components. Original rendering, reveal timing, and audio were not recorded.' };
}

// Keep speech normalization and provider configuration aligned with the tutor.
export function repositoryModule(relative) { return load(path.join(root, relative)); }
export function spokenStages(result) {
  const view = renderReview(result);
  if (view.error || result.failure) throw new Error('Cannot voice an unusable lesson');
  let previous = '';
  return view.stages.map(stage => {
    const current = renderReview(result, stage.value).speech;
    if (!current.startsWith(previous)) throw new Error('Speech stages are not cumulative');
    const text = current.slice(previous.length).trim(); previous = current;
    return { stage: stage.value, text };
  });
}
