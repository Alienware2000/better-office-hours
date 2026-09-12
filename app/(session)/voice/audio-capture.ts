// Silero's frame callback supplies mono PCM at 16 kHz. Keep a small local
// pre-roll so detection latency cannot cut off the beginning of a word.
export class SpeechAudioCapture {
  private recent: Float32Array[] = [];
  private recentSamples = 0;
  private frames: Float32Array[] | null = null;
  private samples = 0;
  readonly sampleRate = 16000;

  push(frame: Float32Array) {
    const copy = frame.slice();
    if (this.frames) {
      // Bound memory even if the main-thread endpoint timer stalls.
      if (this.samples < this.sampleRate * 91) { this.frames.push(copy); this.samples += copy.length; }
      return;
    }
    this.recent.push(copy);
    this.recentSamples += copy.length;
    while (this.recentSamples > this.sampleRate * .32 && this.recent.length > 1) {
      this.recentSamples -= this.recent.shift()!.length;
    }
  }

  start() {
    this.frames = this.recent;
    this.samples = this.recentSamples;
    this.recent = [];
    this.recentSamples = 0;
  }

  discard() {
    this.frames = null;
    this.samples = 0;
    this.recent = [];
    this.recentSamples = 0;
  }

  finish(): Blob {
    const frames = this.frames ?? [];
    const buffer = new ArrayBuffer(44 + this.samples * 2);
    const view = new DataView(buffer);
    const label = (at: number, text: string) => [...text].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));
    label(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); label(8, 'WAVE');
    label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    label(36, 'data'); view.setUint32(40, this.samples * 2, true);
    let offset = 44;
    for (const frame of frames) for (const value of frame) {
      const sample = Math.max(-1, Math.min(1, value));
      view.setInt16(offset, sample * (sample < 0 ? 32768 : 32767), true);
      offset += 2;
    }
    this.discard();
    return new Blob([buffer], { type: 'audio/wav' });
  }
}
