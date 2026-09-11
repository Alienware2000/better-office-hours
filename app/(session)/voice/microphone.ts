import { withRequestTimeout } from './request-timeout';

// Invoke from the user's start/retry action. A browser permission prompt may
// never settle; reject on deadline and release any late-granted stream.
export function requestMicrophone(parent: AbortSignal): Promise<MediaStream> {
  return withRequestTimeout(parent, 15000,
    'Microphone permission is still pending. Allow microphone access in your browser, then retry.',
    async signal => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot open a microphone. Open this page in Chrome or Safari.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1,
      } });
      if (signal.aborted) {
        stream.getTracks().forEach(track => track.stop());
        throw signal.reason;
      }
      return stream;
    });
}

export function assertLiveMicrophone(stream: MediaStream) {
  const tracks = stream.getAudioTracks();
  if (!tracks.length || tracks.some(track => track.readyState === 'ended')) {
    throw new Error('The browser disconnected the microphone during startup. Check microphone access and retry.');
  }
}
