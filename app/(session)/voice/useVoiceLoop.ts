"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionEvent } from "@/lib/agent/events";
import { detectMode } from "@/lib/agent/intent";
import { parseAgentTurn, takeSpeechChunks, type ChatMessage } from "@/lib/agent/tags";
import { getLivePage } from "@/lib/pdf/live-page";
import type { AgentTurn, LayoutState, Turn } from "@/lib/types";
import { CHIPS, pickGreeting, type OrbState } from "./constants";
import { isJunkSpeech, isPutAwayPsetPhrase, isResumeConceptPhrase, isResumePsetPhrase } from "./speech";

type Health = { grok: boolean; elevenlabs: boolean };
type WorkKind = "lobby" | "pset" | "concept";
type WorkSnapshot = { history: ChatMessage[]; turns: Turn[] };

// PROMPT.md asks for two or three sentences under about seventy words. Capping
// at two cut the tutor's closing question, which is the whole point of a turn.
const MAX_SENTENCES = 3;
const MAX_WORDS = 70;

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
  const [paused, setPaused] = useState(true);
  const [layout, setLayoutState] = useState<LayoutState>("orb_only");
  const [pointer, setPointer] = useState<AgentTurn["pointer"]>();
  const [highlight, setHighlight] = useState<AgentTurn["highlight"]>();
  const [turns, setTurns] = useState<Turn[]>([]);

  const speechQueueRef = useRef<Promise<void>>(Promise.resolve());
  const greetingRef = useRef(pickGreeting());
  const historyRef = useRef<ChatMessage[]>([
    { role: "assistant", content: greetingRef.current },
  ]);
  const kindRef = useRef<WorkKind>("lobby");
  const turnsRef = useRef<Turn[]>([]);
  const parkedRef = useRef<{ pset: WorkSnapshot | null; concept: WorkSnapshot | null }>({
    pset: null,
    concept: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const turnAbortRef = useRef<AbortController | null>(null);
  const playbackEpochRef = useRef(0);
  const playbackStartedAtRef = useRef(0);
  const playbackEndedAtRef = useRef(0);
  const playingRef = useRef(false);
  const recordingRef = useRef(false);
  const stateRef = useRef<OrbState>("idle");
  const pausedRef = useRef(true);
  const layoutRef = useRef<LayoutState>("orb_only");
  const setLayout = useCallback((next: LayoutState) => {
    layoutRef.current = next;
    setLayoutState(next);
  }, []);

  const greetingMessages = useCallback(
    (): ChatMessage[] => [{ role: "assistant", content: greetingRef.current }],
    [],
  );

  // Leave parks the current piece of work. The lobby is a fresh waiting room,
  // not a continuation of the homework chat. Sitting back down restores it.
  const adoptKind = useCallback(
    (next: WorkKind, restore: boolean) => {
      const prev = kindRef.current;
      if (prev === next) return;

      if (prev === "pset" || prev === "concept") {
        parkedRef.current[prev] = {
          history: historyRef.current,
          turns: turnsRef.current,
        };
      }

      kindRef.current = next;

      if (next === "lobby") {
        historyRef.current = greetingMessages();
        turnsRef.current = [];
        setTurns([]);
        return;
      }

      if (restore) {
        const parked = parkedRef.current[next];
        if (parked) {
          historyRef.current = parked.history;
          turnsRef.current = parked.turns;
          setTurns(parked.turns);
          return;
        }
      }

      if (prev !== "lobby") {
        historyRef.current = greetingMessages();
        turnsRef.current = [];
        setTurns([]);
      }
    },
    [greetingMessages],
  );

  const hasStartedRef = useRef(false);
  const discardRecordingRef = useRef<() => void>(() => {});
  const setInputEnabledRef = useRef<(enabled: boolean) => void>(() => {});
  const claimTabRef = useRef<() => void>(() => {});
  const discardPsetRef = useRef<() => void>(() => {});

  const setOrb = useCallback((next: OrbState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const stopPlayback = useCallback(() => {
    playbackEpochRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    playingRef.current = false;
    playbackEndedAtRef.current = performance.now();
  }, []);

  const speak = useCallback(
    async (text: string, previousText?: string, epoch = playbackEpochRef.current) => {
      if (!text.trim() || epoch !== playbackEpochRef.current) return;
      const controller = abortRef.current ?? new AbortController();
      abortRef.current = controller;
      playingRef.current = true;
      playbackStartedAtRef.current = performance.now();
      setInputEnabledRef.current(false);
      setOrb("speaking");

      let url: string | null = null;
      try {
        const response = await fetch("/api/agent/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, previousText }),
          signal: controller.signal,
        });
        if (epoch !== playbackEpochRef.current) return;
        if (!response.ok) throw new Error("Voice playback failed");

        url = URL.createObjectURL(await response.blob());
        const audio = new Audio(url);
        await new Promise<void>((resolve, reject) => {
          const finish = () => {
            controller.signal.removeEventListener("abort", cancel);
            resolve();
          };
          const cancel = () => {
            audio.pause();
            finish();
          };
          if (controller.signal.aborted) {
            cancel();
            return;
          }
          controller.signal.addEventListener("abort", cancel, { once: true });
          audio.onended = finish;
          audio.onerror = () => reject(new Error("Audio failed"));
          void audio.play().catch(reject);
        });
      } catch (error) {
        if (controller.signal.aborted || (error as Error).name === "AbortError") return;
        throw error;
      } finally {
        if (url) URL.revokeObjectURL(url);
        playingRef.current = false;
        playbackEndedAtRef.current = performance.now();
        window.setTimeout(() => {
          if (
            !pausedRef.current &&
            !playingRef.current &&
            epoch === playbackEpochRef.current
          ) {
            setInputEnabledRef.current(true);
          }
        }, 450);
      }
    },
    [setOrb],
  );

  // Every spoken chunk goes through one queue. The fast lane's lead-in and the
  // reasoning lane's reply are produced concurrently, and without this they
  // would play over each other.
  const enqueueSpeechTask = useCallback((task: () => Promise<void>) => {
    const next = speechQueueRef.current.then(task, task);
    speechQueueRef.current = next.then(
      () => {},
      () => {},
    );
    return next;
  }, []);

  const applyTurn = useCallback((turn: AgentTurn) => {
    if (turn.mode === "pset") {
      if (kindRef.current === "lobby") adoptKind("pset", false);
      setLayout("pset");
    }
    // The non-reasoning model emits [MODE concept] on ordinary pset talk
    // ("what is the angle"). That used to close the desk.
    if (turn.mode === "concept" && layoutRef.current !== "pset") {
      if (kindRef.current === "lobby") adoptKind("concept", false);
      setLayout("concept");
    }
    if (turn.pointer) setPointer(turn.pointer);
    if (turn.highlight) setHighlight(turn.highlight);
  }, [adoptKind, setLayout]);

  // Leaving the desk parks that work. The tutor is back in the lobby and
  // cannot see the pset until the student sits down again.
  const exitWorkspace = useCallback(() => {
    adoptKind("lobby", false);
    setLayout("orb_only");
    setPointer(undefined);
    setHighlight(undefined);
  }, [adoptKind, setLayout]);

  const enterWorkspace = useCallback(() => {
    adoptKind("pset", true);
    setLayout("pset");
  }, [adoptKind, setLayout]);

  // One paper on the desk at a time. Putting it away is a new homework
  // session, not a parked copy of the old one.
  const putAwayPset = useCallback(() => {
    stopPlayback();
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    parkedRef.current.pset = null;
    kindRef.current = "pset";
    historyRef.current = greetingMessages();
    turnsRef.current = [];
    setTurns([]);
    setPointer(undefined);
    setHighlight(undefined);
    setLayout("pset");
    discardPsetRef.current();
    setOrb(pausedRef.current ? "idle" : "listening");
  }, [greetingMessages, setLayout, setOrb, stopPlayback]);

  const bindDiscardPset = useCallback((discard: () => void) => {
    discardPsetRef.current = discard;
  }, []);

  const addTurn = useCallback((role: Turn["role"], text: string) => {
    setTurns((prev) => {
      const next = [...prev, { role, text, at: new Date().toISOString() }];
      turnsRef.current = next;
      return next;
    });
  }, []);

  // The tutor's caption fills in as the reply streams, so the panel keeps up
  // with the voice instead of appearing after it.
  const reviseLastTutorTurn = useCallback((text: string) => {
    setTurns((prev) => {
      const last = prev.length - 1;
      if (last < 0 || prev[last].role !== "tutor") return prev;
      const next = [...prev];
      next[last] = { ...next[last], text };
      turnsRef.current = next;
      return next;
    });
  }, []);

  // One model pass. Returns as soon as the text is in, with `spoken` resolving
  // when its audio finishes, so the caller can start the next pass underneath
  // the audio that is still playing.
  const runPass = useCallback(
    async ({
      event,
      deep,
      signal,
      playbackEpoch,
    }: {
      event?: SessionEvent;
      deep: boolean;
      signal: AbortSignal;
      playbackEpoch: number;
    }): Promise<{ full: string; turn: AgentTurn; spoken: Promise<void> }> => {
      const response = await fetch("/api/agent/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          stream: true,
          livePage: getLivePage(),
          event,
          deep,
        }),
        signal,
      });
      if (!response.ok) throw new Error("Tutor request failed");

      let emitted = 0;
      let saidSoFar = "";
      let sentences = 0;
      let words = 0;
      let spoken: Promise<void> = Promise.resolve();

      // The caps stop the next sentence rather than trimming the current one.
      // Cutting mid-sentence lost the tutor's closing question and left the
      // audio hanging on half a word.
      const enqueueSpeech = (chunk: string) => {
        if (sentences >= MAX_SENTENCES || words >= MAX_WORDS) return;
        const trimmed = chunk.trim();
        if (!trimmed) return;
        const previousText = saidSoFar;
        saidSoFar = [saidSoFar, trimmed].filter(Boolean).join(" ");
        sentences += 1;
        words += trimmed.split(/\s+/).length;
        spoken = enqueueSpeechTask(() =>
          playbackEpoch === playbackEpochRef.current
            ? speak(trimmed, previousText, playbackEpoch)
            : Promise.resolve(),
        );
      };

      addTurn("tutor", "");
      const full = await readSseText(response, (raw) => {
        const partial = parseAgentTurn(raw);
        applyTurn(partial);
        reviseLastTutorTurn(partial.speech);
        // A lead-in turn is not worth speaking in pieces, and speaking it
        // before [THINK] arrives would strand the student mid-thought.
        if (partial.think) return;
        let next = takeSpeechChunks(partial.speech, emitted);
        while (next.chunk && sentences < MAX_SENTENCES) {
          emitted = next.consumed;
          enqueueSpeech(next.chunk);
          next = takeSpeechChunks(partial.speech, emitted);
        }
      });

      const turn = parseAgentTurn(full);
      applyTurn(turn);
      reviseLastTutorTurn(turn.speech);
      const leftover = turn.speech.slice(emitted).trim();
      if (leftover) enqueueSpeech(leftover);
      return { full, turn, spoken };
    },
    [addTurn, applyTurn, enqueueSpeechTask, reviseLastTutorTurn, speak],
  );

  const runTurn = useCallback(
    async ({ text, event }: { text?: string; event?: SessionEvent }) => {
      const said = text?.trim() ?? "";
      if (!said && !event) return;
      if (said && isJunkSpeech(said)) return;

      if (said && isPutAwayPsetPhrase(said) && layoutRef.current === "pset") {
        putAwayPset();
        if (!playingRef.current) setOrb(pausedRef.current ? "idle" : "listening");
        return;
      }

      // The layout follows what the student said right away. Waiting on the
      // model's [MODE ...] tag makes the screen lag behind the conversation.
      const intent = said ? detectMode(said, layoutRef.current) : null;
      if (intent === "pset") {
        const was = kindRef.current;
        const hadParked = Boolean(parkedRef.current.pset);
        adoptKind("pset", hadParked && was !== "pset");
        setLayout("pset");
        if (hadParked && was !== "pset" && isResumePsetPhrase(said)) {
          if (!playingRef.current) setOrb(pausedRef.current ? "idle" : "listening");
          return;
        }
      } else if (intent === "concept") {
        const was = kindRef.current;
        const hadParked = Boolean(parkedRef.current.concept);
        adoptKind("concept", hadParked && was !== "concept");
        setLayout("concept");
        if (hadParked && was !== "concept" && isResumeConceptPhrase(said)) {
          if (!playingRef.current) setOrb(pausedRef.current ? "idle" : "listening");
          return;
        }
      }
      if (health && (!health.grok || !health.elevenlabs)) return;

      stopPlayback();
      setPointer(undefined);
      setHighlight(undefined);
      turnAbortRef.current?.abort();
      const turnController = new AbortController();
      turnAbortRef.current = turnController;
      const playbackEpoch = playbackEpochRef.current;
      const signal = turnController.signal;
      setOrb("thinking");
      if (said) {
        historyRef.current = [...historyRef.current, { role: "user", content: said }];
        addTurn("student", said);
      }

      const lead = await runPass({ event, deep: false, signal, playbackEpoch });
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: lead.full },
      ];

      if (lead.turn.think) {
        // Fired before waiting on the lead-in audio, so the reasoning wait
        // happens underneath it rather than after it.
        const deep = runPass({ event, deep: true, signal, playbackEpoch });
        await lead.spoken;
        if (playbackEpoch === playbackEpochRef.current) setOrb("thinking");
        const result = await deep;
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: result.full },
        ];
        await result.spoken;
      } else {
        await lead.spoken;
      }

      if (turnAbortRef.current === turnController) turnAbortRef.current = null;
      if (!playingRef.current) setOrb(pausedRef.current ? "idle" : "listening");
    },
    [addTurn, adoptKind, health, putAwayPset, runPass, setLayout, setOrb, stopPlayback],
  );

  const sendUtterance = useCallback(
    async (text: string) => {
      if (isJunkSpeech(text)) return;
      try {
        setError(null);
        pausedRef.current = false;
        hasStartedRef.current = true;
        setPaused(false);
        setInputEnabledRef.current(true);
        claimTabRef.current();
        await runTurn({ text });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setOrb("idle");
      }
    },
    [runTurn, setOrb],
  );

  // Something happened on screen that the tutor should react to on its own.
  const sendEvent = useCallback(
    async (event: SessionEvent) => {
      if (pausedRef.current) return;
      try {
        setError(null);
        await runTurn({ event });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setOrb("idle");
      }
    },
    [runTurn, setOrb],
  );

  const interrupt = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      setInputEnabledRef.current(true);
      claimTabRef.current();
      if (health?.grok && health.elevenlabs && !hasStartedRef.current) {
        hasStartedRef.current = true;
        setOrb("speaking");
        addTurn("tutor", greetingRef.current);
        void speakRef
          .current(greetingRef.current)
          .then(() => {
            if (!pausedRef.current) setOrb("listening");
          })
          .catch((err) => {
            if ((err as Error).name !== "AbortError") {
              setError((err as Error).message);
            }
          });
      } else {
        setOrb(health?.grok && health.elevenlabs ? "listening" : "idle");
      }
      return;
    }

    pausedRef.current = true;
    setPaused(true);
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    stopPlayback();
    discardRecordingRef.current();
    setInputEnabledRef.current(false);
    setOrb("idle");
  }, [addTurn, health, setOrb, stopPlayback]);

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
    const tabId = crypto.randomUUID();
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("better-office-hours-voice");

    const setInputEnabled = (enabled: boolean) => {
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    };
    setInputEnabledRef.current = setInputEnabled;

    const discardRecording = () => {
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      chunks = [];
      recordingRef.current = false;
    };
    discardRecordingRef.current = discardRecording;

    const claimTab = () => channel?.postMessage({ type: "claim", tabId });
    claimTabRef.current = claimTab;

    const suspendVoice = (message?: string) => {
      pausedRef.current = true;
      setPaused(true);
      turnAbortRef.current?.abort();
      turnAbortRef.current = null;
      stopRef.current();
      discardRecording();
      setInputEnabled(false);
      setOrb("idle");
      if (message) setError(message);
    };

    const handleVisibility = () => {
      if (document.hidden) suspendVoice();
    };
    const handlePageHide = () => suspendVoice();

    channel?.addEventListener("message", (event) => {
      const data = event.data as { type?: string; tabId?: string };
      if (data.type === "claim" && data.tabId !== tabId) {
        suspendVoice("Voice moved to the active tab.");
      }
    });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

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
      if (!stream || recordingRef.current || pausedRef.current) return;
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

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      setInputEnabled(!pausedRef.current);
      claimTab();
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

      const loop = () => {
        if (cancelled) return;
        if (pausedRef.current) {
          setLevel(0);
          raf = requestAnimationFrame(loop);
          return;
        }
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (const sample of data) sum += sample * sample;
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);
        const loud = rms > 0.045;
        const now = performance.now();
        if (loud) lastLoud = now;

        if (!playingRef.current) {
          if (
            stateRef.current !== "thinking" &&
            loud &&
            !recordingRef.current &&
            now - playbackEndedAtRef.current > 450
          ) {
            startRecorder();
          } else if (
            recordingRef.current &&
            now - lastLoud > 850 &&
            now - startedAt > 450
          ) {
            void stopRecorder();
          }
        }

        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      if (pausedRef.current) {
        setOrb("idle");
      } else {
        hasStartedRef.current = true;
        setOrb("speaking");
        addTurn("tutor", greetingRef.current);
        try {
          await speakRef.current(greetingRef.current);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Could not speak");
          }
        }
        if (!cancelled && !playingRef.current) setOrb("listening");
      }
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
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      channel?.close();
      turnAbortRef.current?.abort();
      stopRef.current();
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close();
      discardRecording();
      discardRecordingRef.current = () => {};
      setInputEnabledRef.current = () => {};
      claimTabRef.current = () => {};
    };
  }, [addTurn, setOrb]);

  return {
    state,
    level,
    health,
    error,
    paused,
    sendUtterance,
    sendEvent,
    interrupt,
    exitWorkspace,
    enterWorkspace,
    putAwayPset,
    bindDiscardPset,
    turns,
    chips: CHIPS,
    layout,
    pointer,
    highlight,
  };
}
