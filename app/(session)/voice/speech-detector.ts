/** Silero runs locally; the existing STT endpoint only receives a finished turn. */
export async function createSpeechDetector(
  stream: MediaStream,
  audioContext: AudioContext,
  onProbability: (probability: number, frame: Float32Array) => void,
) {
  const { MicVAD } = await import('@ricky0123/vad-web');
  const detector = await MicVAD.new({
    model: 'v5',
    baseAssetPath: '/voice-assets/',
    onnxWASMBasePath: '/voice-assets/',
    audioContext,
    getStream: async () => stream,
    pauseStream: async () => {}, // Track ownership stays with useVoiceLoop.
    resumeStream: async () => stream,
    startOnLoad: false,
    ortConfig: ort => {
      ort.env.wasm.numThreads = 1;
      ort.env.logLevel = 'error';
    },
    onFrameProcessed: (probability, frame) => onProbability(probability.isSpeech, frame),
  });
  try {
    await detector.start();
  } catch (error) {
    await detector.destroy();
    throw error;
  }
  return { destroy: () => detector.destroy() };
}

// Hysteresis: retain quieter syllables in a confirmed turn. Require stronger
// evidence to interrupt playback, rather than treating loud music as speech.
export function isSpeechFrame(probability: number, recording: boolean, playback: boolean) {
  return probability >= (playback ? 0.85 : recording ? 0.35 : 0.65);
}
