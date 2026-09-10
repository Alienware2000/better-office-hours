"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseAgentTurn, takeSpeechChunks, type ChatMessage } from "@/lib/agent/tags";
import { CHIPS, GREETING, type OrbState } from "./constants";

type Health = { grok: boolean; elevenlabs: boolean };

async function readSseText(
  response: Response,
  onDelta: (full: string) => void,
): Promise<string> {
  if (!response.body) throw new Error("No stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      const json = JSON.parse(data) as {
        error?: { message?: string };
        choices?: { delta?: { content?: string } }[];
      };
      if (json.error?.message) throw new Error(json.error.message);
      const content = json.choices?.[0]?.delta?.content;
      if (content) {
        full += content;
        onDelta(full);
      }
    }
  }
  return full;
}

export function useVoiceLoop() {
  const [state, setState] = useState<OrbState>("idle");
  const [level, setLevel] = useState(0);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const abortRef = useRef<AbortController | null>(null);
  const playingRef = useRef(false);
  const recordingRef = useRef(false);
  const stateRef = useRef<OrbState>("idle");

  const setOrb = useCallback((next: OrbState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const stopPlayback = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    playingRef.current = false;
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const controller = abortRef.current ?? new AbortController();
      abortRef.current = controller;
      playingRef.current = true;
      setOrb("speaking");

      const response = await fetch("/api/agent/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      if (!response.ok) {
        playingRef.current = false;
        throw new Error("Voice playback failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      try {
        await new Promise<void>((resolve, reject) => {
          const cancel = () => {
            audio.pause();
            resolve();
          };
          if (controller.signal.aborted) {
            cancel();
            return;
          }
          controller.signal.addEventListener("abort", cancel, { once: true });
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Audio failed"));
          void audio.play().catch(reject);
        });
      } finally {
        URL.revokeObjectURL(url);
        playingRef.current = false;
      }
    },
    [setOrb],
  );

  const runTurn = useCallback(
    async (userText: string) => {
      const text = userText.trim();
      if (!text) return;
      stopPlayback();
      setOrb("thinking");
      historyRef.current = [...historyRef.current, { role: "user", content: text }];

      const response = await fetch("/api/agent/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyRef.current, stream: true }),
      });
      if (!response.ok) throw new Error("Tutor request failed");

      let spokenEmitted = 0;
      let chain: Promise<void> = Promise.resolve();

      const full = await readSseText(response, (raw) => {
        const turn = parseAgentTurn(raw);
        const next = takeSpeechChunks(turn.speech, spokenEmitted);
        if (next.chunk) {
          spokenEmitted = next.consumed;
          chain = chain.then(() => speak(next.chunk));
        }
      });

      const turn = parseAgentTurn(full);
      const leftover = turn.speech.slice(spokenEmitted).trim();
      if (leftover) chain = chain.then(() => speak(leftover));
      await chain;
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: full },
      ];
      if (!playingRef.current) setOrb("listening");
    },
    [setOrb, speak, stopPlayback],
  );

  const sendUtterance = useCallback(
    async (text: string) => {
      try {
        setError(null);
        await runTurn(text);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setOrb("idle");
      }
    },
    [runTurn, setOrb],
  );

  const sendRef = useRef(sendUtterance);
  const speakRef = useRef(speak);
  const stopRef = useRef(stopPlayback);
  sendRef.current = sendUtterance;
  speakRef.current = speak;
  stopRef.current = stopPlayback;

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];
    let lastLoud = 0;
    let startedAt = 0;
    let raf = 0;

    const transcribe = async (blob: Blob) => {
      const form = new FormData();
      form.set("file", blob, "speech.webm");
      const response = await fetch("/api/agent/stt", { method: "POST", body: form });
      if (!response.ok) throw new Error("Could not hear that");
      const data = (await response.json()) as { text?: string };
      return (data.text ?? "").trim();
    };

    const stopRecorder = async () => {
      if (!recorder || recorder.state === "inactive") return;
      const done = new Promise<Blob>((resolve) => {
        recorder!.onstop = () => {
          resolve(new Blob(chunks, { type: recorder!.mimeType || "audio/webm" }));
          chunks = [];
        };
      });
      recorder.stop();
      recordingRef.current = false;
      const blob = await done;
      if (cancelled || blob.size < 1200) return;
      try {
        const text = await transcribe(blob);
        if (text) await sendRef.current(text);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not hear that");
          setOrb("listening");
        }
      }
    };

    const startRecorder = () => {
      if (!stream || recordingRef.current) return;
      chunks = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined;
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.start();
      recordingRef.current = true;
      startedAt = performance.now();
      setOrb("listening");
    };

    const boot = async () => {
      const status = (await fetch("/api/agent/health").then((r) => r.json())) as Health;
      if (cancelled) return;
      setHealth(status);
      if (!status.elevenlabs || !status.grok) {
        setError(
          "Add XAI_API_KEY and ELEVENLABS_API_KEY to .env.local, then restart npm run dev.",
        );
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

      const loop = () => {
        if (cancelled) return;
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (const sample of data) sum += sample * sample;
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);
        const loud = rms > 0.04;
        const now = performance.now();
        if (loud) lastLoud = now;

        if (playingRef.current && loud && rms > 0.07) {
          stopRef.current();
          startRecorder();
        } else if (
          !playingRef.current &&
          stateRef.current !== "thinking" &&
          loud &&
          !recordingRef.current
        ) {
          startRecorder();
        } else if (
          recordingRef.current &&
          now - lastLoud > 850 &&
          now - startedAt > 450
        ) {
          void stopRecorder();
        }

        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      setOrb("speaking");
      try {
        await speakRef.current(GREETING);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not speak");
        }
      }
      if (!cancelled && !playingRef.current) setOrb("listening");
    };

    void boot().catch((err: unknown) => {
      if (cancelled) return;
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "The microphone is blocked."
          : err instanceof Error
            ? err.message
            : "Could not start voice",
      );
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopRef.current();
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close();
      if (recorder && recorder.state !== "inactive") recorder.stop();
    };
  }, [setOrb]);

  return { state, level, health, error, sendUtterance, chips: CHIPS };
}
