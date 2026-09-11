// Serve pinned package assets locally. No runtime CDN or uploaded audio involved.
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const destination = path.resolve('public/voice-assets');
await mkdir(destination, { recursive: true });
for (const [directory, files] of [
  ['node_modules/@ricky0123/vad-web/dist', ['silero_vad_v5.onnx', 'vad.worklet.bundle.min.js']],
  ['node_modules/onnxruntime-web/dist', ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']],
]) {
  for (const file of files) await copyFile(path.join(directory, file), path.join(destination, file));
}
console.log('Local speech detector assets ready.');
