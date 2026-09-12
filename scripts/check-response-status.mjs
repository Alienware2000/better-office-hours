// Use an isolated build/port and a fresh browser. Synthetic microphone through
// real Silero; model, transcription, and speech services are deferred fixtures.
// BOH_TEST_BASE_URL=http://localhost:3103 BOH_TEST_AUDIO=/tmp/boh-fake-input.wav PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-response-status.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BOH_TEST_BASE_URL, input = process.env.BOH_TEST_AUDIO;
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname) || !input || !fs.existsSync(input)) throw new Error('Supply an isolated local server and a speech WAV fixture.');
const output = fs.mkdtempSync(path.join(tmpdir(), 'boh-response-status-'));
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const stt = deferred(), fast = deferred(), deep = deferred(), voice = deferred(), secondDeep = deferred();
const wav = Buffer.alloc(44 + 8000);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
const sse = content => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${input}`, '--autoplay-policy=no-user-gesture-required'] });
try {
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 }, permissions: ['microphone'] });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {
    const getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async options => {
      const source = await getMedia(options), ctx = new AudioContext(); await ctx.resume();
      const gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaStreamSource(source).connect(gain);
      const dest = ctx.createMediaStreamDestination(); gain.connect(dest);
      window.testSpeech = active => { gain.gain.value = active ? 1 : 0; }; return dest.stream;
    };
  });
  let deepCalls = 0, ttsCalls = 0;
  await p.route('**/api/agent/health', r => r.fulfill({ json: { grok: true, elevenlabs: true } }));
  await p.route('**/api/agent/stt', async r => {
    await p.evaluate(() => window.testSpeech(false)); await stt.promise;
    await r.fulfill({ json: { text: 'Explain this concept with a simple picture.' } });
  });
  await p.route('**/api/agent/llm', async r => {
    if (!r.request().postDataJSON().deep) { await fast.promise; return r.fulfill({ contentType: 'text/event-stream', body: sse('[MODE concept][THINK]') }); }
    await (++deepCalls === 1 ? deep.promise : secondDeep.promise);
    return r.fulfill({ contentType: 'text/event-stream', body: sse('[TEACH move=explain visual=diagram][BOARD open][DRAW {"op":"circle","id":"sample","center":{"x":0.5,"y":0.4},"r":0.08}] Here is the object we are discussing.') });
  });
  await p.route('**/api/agent/tts', async r => { if (++ttsCalls > 1) await voice.promise; await r.fulfill({ contentType: 'audio/wav', body: wav }); });
  const status = text => p.waitForFunction(expected => document.querySelector('.orb-status')?.textContent === expected, text, { timeout: 30000 });
  await p.goto(base); await p.getByRole('button', { name: 'Start the tutor', exact: true }).click(); await status('Listening');
  await p.evaluate(() => window.testSpeech(true)); await status('Transcribing');
  assert.equal(await p.locator('.response-dots').count(), 1);
  stt.resolve(); await status('Thinking'); fast.resolve(); await status('Working through your question');
  await p.locator('.response-delay').waitFor({ timeout: 10000 });
  const bounds = await p.locator('.response-status').boundingBox();
  await p.screenshot({ path: path.join(output, 'waiting-desktop.png') });
  await p.setViewportSize({ width: 380, height: 820 });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await p.locator('.response-dots i').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const pauseBounds = await p.getByRole('button', { name: 'Pause voice', exact: true }).boundingBox();
  const statusBounds = await p.locator('.response-status').boundingBox();
  assert.ok(pauseBounds.y + pauseBounds.height <= statusBounds.y || pauseBounds.x + pauseBounds.width <= statusBounds.x || statusBounds.x + statusBounds.width <= pauseBounds.x, 'Pause must not cover the status on a phone');
  await p.screenshot({ path: path.join(output, 'waiting-mobile.png') });
  await p.setViewportSize({ width: 1400, height: 1000 });
  deep.resolve(); await status('Preparing voice');
  assert.equal(await p.locator('[data-board-group]').count(), 0, 'Waiting UI never draws ahead of audio');
  voice.resolve(); await status('Listening');
  await p.locator('[data-board-group]').first().waitFor();
  assert.equal(await p.locator('.response-dots').count(), 0);
  assert.equal(await p.locator('.response-delay').count(), 0);
  const settledBounds = await p.locator('.response-status').boundingBox();
  assert.equal(Math.round(settledBounds.height), Math.round(bounds.height), 'Waiting and speaking reserve identical status space');
  await p.evaluate(() => window.testSpeech(true)); await status('Working through your question');
  await p.getByRole('button', { name: 'Pause voice', exact: true }).click(); await status('Tap to start');
  secondDeep.resolve(); await p.waitForTimeout(400);
  assert.equal(await p.locator('.response-dots').count(), 0, 'Late response cannot reactivate the paused indicator');
  assert.equal(await p.locator('.response-delay').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: real Silero capture, actual request-driven wait stages, long-wait cue, mobile bounds, reduced motion, stable layout, audio-ordered drawing, pause and late-response cleanup. Services stubbed.');
  console.log('Rendered artifacts:', output);
} finally { await browser.close(); }
