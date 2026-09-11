"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionEvent } from "@/lib/agent/events";
import { detectMode } from "@/lib/agent/intent";
import { parseAgentTurn, takeSpeechChunks, visualBeats, type ChatMessage } from "@/lib/agent/tags";
import { getLivePage, setLivePage } from "@/lib/pdf/live-page";
import { getLiveBoard } from "@/lib/whiteboard/live-board";
import { isDrawCommand } from "@/lib/whiteboard/geometry";
import { getBoardState, restoreBoard, type BoardState, loadAnimation, pauseAnimation, playAnimation, focusAnimation, applyDrawCommands, openBoard, resetBoard } from "@/lib/whiteboard/store";
import type { AgentTurn, LayoutState, Turn } from "@/lib/types";
import { createSpeechDetector, isSpeechFrame } from "./speech-detector";
import { withRequestTimeout } from "./request-timeout";
import { CHIPS, pickGreeting, type OrbState } from "./constants";
import { isJunkSpeech, isPutAwayPsetPhrase, isResumeConceptPhrase, isResumePsetPhrase } from "./speech";

type Health = { grok: boolean; elevenlabs: boolean };
type WorkKind = "lobby" | "pset" | "concept";
type WorkSnapshot = { history: ChatMessage[]; turns: Turn[]; board: BoardState };

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

  const pendingAttachmentRef = useRef<{ id: string; at: number } | null>(null);
  const noticedAttachmentsRef = useRef(new Set<string>());
  const speechQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [inputReady, setInputReady] = useState(false);
  const inputReadyRef = useRef(false);
  const [inputAttempt, setInputAttempt] = useState(0);
  const [greeting] = useState(pickGreeting);
  const greetingRef = useRef(greeting);
  const historyRef = useRef<ChatMessage[]>([
    { role: "assistant", content: greeting },
  ]);
  const kindRef = useRef<WorkKind>("lobby");
  const turnsRef = useRef<Turn[]>([]);
  const parkedRef = useRef<{ pset: WorkSnapshot | null; concept: WorkSnapshot | null }>({
    pset: null,
    concept: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const turnAbortRef = useRef<AbortController | null>(null);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const playbackEpochRef = useRef(0);
  const playbackStartedAtRef = useRef(0);
  const playbackEndedAtRef = useRef(0);
  const boardAppliedRef = useRef(0);
  const animAppliedRef = useRef("");
  const animControlRef = useRef("");
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
      pendingAttachmentRef.current = null;
      const prev = kindRef.current;
      if (prev === next) return;

      if (prev === "pset" || prev === "concept") {
        parkedRef.current[prev] = {
          history: historyRef.current,
          turns: turnsRef.current,
          board: structuredClone({ ...getBoardState(), playing: false }),
        };
      }

      kindRef.current = next;
      resetBoard();
      setLivePage(null);
      if (next === "concept") openBoard();

      if (next === "lobby") {
        historyRef.current = greetingMessages();
        turnsRef.current = [];
        setTurns([]);
        return;
      }

      if (restore) {
        const parked = parkedRef.current[next];
        if (parked) {
          restoreBoard(parked.board);
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

  const finishRecordingRef = useRef<() => void>(() => {});
  const [recording, setRecording] = useState(false);
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
    pauseAnimation();
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current = null;
    playbackEpochRef.current += 1;
    speechQueueRef.current = Promise.resolve();
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    playingRef.current = false;
    playbackEndedAtRef.current = performance.now();
  }, []);

  const speak = useCallback(
    async (text: string, previousText?: string, epoch = playbackEpochRef.current,
      prepared?: Promise<{ blob: Blob } | { error: unknown }>, onStart?: () => void) => {
      if (!text.trim() || epoch !== playbackEpochRef.current) return;
      const controller = abortRef.current ?? new AbortController();
      abortRef.current = controller;
      setInputEnabledRef.current(!pausedRef.current);

      let url: string | null = null;
      try {
        let blob: Blob;
        if (prepared) {
          const result = await prepared;
          if ('error' in result) throw result.error;
          blob = result.blob;
        } else {
          blob = await withRequestTimeout(controller.signal, 15000, "Voice playback took too long. Please try again.", async signal => {
            const response = await fetch("/api/agent/tts", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, previousText }), signal,
            });
            if (!response.ok) {
              const failure = await response.json().catch(() => ({}));
              throw new Error(typeof failure.error === "string" ? failure.error : "Voice playback failed");
            }
            return response.blob();
          });
        }
        if (controller.signal.aborted || epoch !== playbackEpochRef.current) return;
        url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = 1.08;
        audio.preservesPitch = true;
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
          audio.onplaying = () => {
            if (controller.signal.aborted || epoch !== playbackEpochRef.current) return;
            playingRef.current = true;
            playbackStartedAtRef.current = performance.now();
            setOrb("speaking");
            onStart?.();
          };
          audio.onended = finish;
          audio.onerror = () => {
            controller.signal.removeEventListener("abort", cancel);
            reject(new Error("Audio failed"));
          };
          void audio.play().catch(reject);
        });
      } catch (error) {
        if (controller.signal.aborted || (error as Error).name === "AbortError") return;
        throw error;
      } finally {
        if (url) URL.revokeObjectURL(url);
        if (epoch === playbackEpochRef.current) {
          playingRef.current = false;
          playbackEndedAtRef.current = performance.now();
          if (!pausedRef.current) setOrb(turnAbortRef.current ? "thinking" : "listening");
        }
      }
    },
    [setOrb],
  );

  const speakRef = useRef(speak);

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
    if (turn.mode === "pset" && kindRef.current === "lobby") {
      if (kindRef.current === "lobby") adoptKind("pset", false);
      setLayout("pset");
    }
    // The non-reasoning model emits [MODE concept] on ordinary pset talk
    // ("what is the angle"). That used to close the desk.
    if (turn.mode === "concept" && kindRef.current === "lobby") {
      if (kindRef.current === "lobby") adoptKind("concept", false);
      setLayout("concept");
    }
    if (turn.pointer) { setPointer(turn.pointer); setHighlight(undefined); }
    if (turn.highlight) { setHighlight(turn.highlight); setPointer(undefined); }
    if (turn.board?.open) openBoard();
    const animation = turn.board?.animation;
    if (animation && 'shapes' in animation) {
      const key = JSON.stringify(animation);
      if (key !== animAppliedRef.current) {
        animAppliedRef.current = key;
        if (loadAnimation(animation)) {
          pauseAnimation();
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) playAnimation();
        }
      }
    }
    const control = turn.board?.animControl;
    if (control && JSON.stringify(control) !== animControlRef.current) {
      animControlRef.current = JSON.stringify(control);
      if (control.resume) playAnimation();
      if (control.focus) focusAnimation(control.focus.replace(/^"|"$/g, ''));
    }
    const commands = turn.board?.commands;
    if (commands && commands.length > boardAppliedRef.current) {
      const fresh = commands.slice(boardAppliedRef.current).filter(isDrawCommand);
      boardAppliedRef.current = commands.length;
      if (fresh.length) applyDrawCommands(fresh);
    }
  }, [adoptKind, setLayout]);

  // Leaving the desk parks that work. The tutor is back in the lobby and
  // cannot see the pset until the student sits down again.
  const exitWorkspace = useCallback(() => {
    stopPlayback();
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    adoptKind("lobby", false);
    setLayout("orb_only");
    setPointer(undefined);
    setHighlight(undefined);
    discardRecordingRef.current();
    setInputEnabledRef.current(!pausedRef.current);
    setOrb(pausedRef.current ? "idle" : "listening");
  }, [adoptKind, setLayout, setOrb, stopPlayback]);

  const enterWorkspace = useCallback(() => {
    stopPlayback();
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    discardRecordingRef.current();
    adoptKind("pset", true);
    setLayout("pset");
    setInputEnabledRef.current(!pausedRef.current);
    setOrb(pausedRef.current ? "idle" : "listening");
  }, [adoptKind, setLayout, setOrb, stopPlayback]);

  // One paper on the desk at a time. Putting it away is a new homework
  // session, not a parked copy of the old one.
  const putAwayPset = useCallback(() => {
    stopPlayback();
    discardRecordingRef.current();
    setInputEnabledRef.current(!pausedRef.current);
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    parkedRef.current.pset = null;
    kindRef.current = "pset";
    historyRef.current = greetingMessages();
    turnsRef.current = [];
    setTurns([]);
    setPointer(undefined);
    setHighlight(undefined);
    resetBoard();
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
      // Each model pass has its own tag stream. Reset so a deep turn after
      // [THINK] does not skip DRAW commands that share indices with the lead-in.
      void enqueueSpeechTask(async () => {
        if (signal.aborted || playbackEpoch !== playbackEpochRef.current) return;
        boardAppliedRef.current = 0;
        animAppliedRef.current = "";
        animControlRef.current = "";
      });
      const response = await fetch("/api/agent/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          stream: true,
          livePage: getLivePage(),
          liveBoard: getLiveBoard(),
          event,
          deep,
        }),
        signal,
      });
      if (!response.ok) throw new Error("Tutor request failed");

      let emitted = 0;
      let beatsApplied = 0;
      let saidSoFar = "";
      let speechFailure: unknown;
      let captionStarted = false;
      let heard = "";
      let historyMessage: ChatMessage | null = null;
      let spoken: Promise<void> = Promise.resolve();
      let preparationQueue: Promise<unknown> = Promise.resolve();

      // Shortness is a tutor instruction, never a silent client-side audio cut.
      const enqueueSpeech = (chunk: string) => {
        const trimmed = chunk.trim();
        if (!trimmed || signal.aborted || playbackEpoch !== playbackEpochRef.current) return;
        const previousText = saidSoFar;
        saidSoFar = [saidSoFar, trimmed].filter(Boolean).join(" ");
        const audioSignal = abortRef.current?.signal;
        const prepared = preparationQueue.then(() => withRequestTimeout(audioSignal, 15000, "Voice playback took too long. Please try again.", async signal => {
          const response = await fetch("/api/agent/tts", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed, previousText }), signal,
          });
          if (!response.ok) {
            const failure = await response.json().catch(() => ({}));
            throw new Error(typeof failure.error === "string" ? failure.error : "Voice playback failed");
          }
          return { blob: await response.blob() };
        })).catch((error: unknown) => ({ error }));
        preparationQueue = prepared;
        spoken = enqueueSpeechTask(async () => {
          if (playbackEpoch !== playbackEpochRef.current || signal.aborted) return;
          if (speechFailure) throw speechFailure;
          try { await speak(trimmed, previousText, playbackEpoch, prepared, () => {
            heard = [heard, trimmed].filter(Boolean).join(" ");
            if (!captionStarted) { addTurn("tutor", heard); captionStarted = true; }
            else reviseLastTutorTurn(heard);
            if (!historyMessage) {
              historyMessage = { role: "assistant", content: heard };
              historyRef.current = [...historyRef.current, historyMessage];
            } else historyMessage.content = heard;
          }); } catch (error) { speechFailure = error; throw error; }
        });
      };

      const full = await readSseText(response, (raw) => {
        if (signal.aborted || playbackEpoch !== playbackEpochRef.current) throw new DOMException("Interrupted", "AbortError");
        const partial = parseAgentTurn(raw);
        // Both static marks and animation share the speech queue. A tag waits
        // for its preceding words rather than drawing the whole reply upfront.
        const beats = visualBeats(raw);
        for (const beat of beats.slice(beatsApplied)) {
          const pending = beat.speechBefore.slice(emitted).trim();
          if (pending) { enqueueSpeech(pending); emitted = beat.speechBefore.length; }
          spoken = enqueueSpeechTask(async () => {
            if (!signal.aborted && playbackEpoch === playbackEpochRef.current) applyTurn(beat.turn);
          });
        }
        beatsApplied = beats.length;
        if (partial.mode) applyTurn({ speech: "", mode: partial.mode });
        // A lead-in turn is not worth speaking in pieces, and speaking it
        // before [THINK] arrives would strand the student mid-thought.
        if (partial.think) return;
        let next = takeSpeechChunks(partial.speech, emitted);
        while (next.chunk) {
          emitted = next.consumed;
          enqueueSpeech(next.chunk);
          next = takeSpeechChunks(partial.speech, emitted);
        }
      });

      if (signal.aborted || playbackEpoch !== playbackEpochRef.current) throw new DOMException("Interrupted", "AbortError");
      const turn = parseAgentTurn(full);

      const leftover = turn.speech.slice(emitted).trim();
      if (leftover) enqueueSpeech(leftover);
      const finished = spoken.then(() => { if (speechFailure) throw speechFailure; });
      void finished.catch(() => {});
      return { full, turn, spoken: finished };
    },
    [addTurn, applyTurn, enqueueSpeechTask, reviseLastTutorTurn, speak],
  );

  const runTurn = useCallback(
    async ({ text, event }: { text?: string; event?: SessionEvent }) => {
      const said = text?.trim() ?? "";
      if (said) pendingAttachmentRef.current = null;
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
      if (said && kindRef.current === "pset" && getLivePage()) openBoard();
      if (health && (!health.grok || !health.elevenlabs)) return;

      stopPlayback();
      setPointer(undefined);
      setHighlight(undefined);
      boardAppliedRef.current = 0;
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

      const lead = await withRequestTimeout(signal, 30000, "The tutor took too long. Please try again.", signal => runPass({ event, deep: false, signal, playbackEpoch }));


      if (lead.turn.think) {
        // Fired before waiting on the lead-in audio, so the reasoning wait
        // happens underneath it rather than after it.
        const deep = withRequestTimeout(signal, 30000, "The tutor took too long. Please try again.", signal => runPass({ event, deep: true, signal, playbackEpoch }));
        void deep.catch(() => {});
        await lead.spoken;
        if (playbackEpoch === playbackEpochRef.current && !playingRef.current) setOrb("thinking");
        const result = await deep;

        await result.spoken;
      } else {
        await lead.spoken;
      }

      if (turnAbortRef.current === turnController) turnAbortRef.current = null;
      if (playbackEpoch === playbackEpochRef.current && !playingRef.current) setOrb(pausedRef.current ? "idle" : "listening");
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
        (turnAbortRef.current as AbortController | null)?.abort();
        turnAbortRef.current = null;
        stopPlayback();
        setError(err instanceof Error ? err.message : "Something went wrong");
        setOrb(pausedRef.current ? "idle" : "listening");
      }
    },
    [runTurn, setOrb, stopPlayback],
  );

  // Ink changes update snapshots, not turn ownership. The next student utterance
  // carries fresh PDF and board images, without a timer interrupting their work.

  useEffect(() => {
    const onWriting = () => {
      if (pausedRef.current) return;
      turnAbortRef.current?.abort();
      turnAbortRef.current = null;
      stopPlayback();
      setOrb("listening");
    };
    window.addEventListener("boh:student-writing", onWriting);
    return () => window.removeEventListener("boh:student-writing", onWriting);
  }, [setOrb, stopPlayback]);

  // A readiness receipt may acknowledge the screen, but never start a lesson.
  const sendEvent: (event: SessionEvent) => Promise<void> = useCallback(async event => {
    if (event.kind === "student_mark") return;
    const page = getLivePage();
    if (!page || noticedAttachmentsRef.current.has(page.psetId)) return;
    noticedAttachmentsRef.current.add(page.psetId);
    if (pausedRef.current || recordingRef.current || playingRef.current ||
        turnAbortRef.current || transcriptionAbortRef.current) return;
    pendingAttachmentRef.current = { id: page.psetId, at: performance.now() };
  }, []);

  const pauseVoice = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    stopPlayback();
    discardRecordingRef.current();
    setInputEnabledRef.current(false);
    setOrb("idle");
  }, [setOrb, stopPlayback]);

  const retryMicrophone = useCallback(() => {
    pauseVoice();
    inputReadyRef.current = false;
    setInputReady(false);
    setError(null);
    setInputAttempt(attempt => attempt + 1);
  }, [pauseVoice]);

  const interrupt = useCallback(() => {
    if (!inputReadyRef.current) return;
    if (recordingRef.current && !pausedRef.current) {
      finishRecordingRef.current();
      return;
    }
    if (pausedRef.current) {
      setError(null);
      pausedRef.current = false;
      setPaused(false);
      setInputEnabledRef.current(true);
      claimTabRef.current();
      if (health?.grok && health.elevenlabs && !hasStartedRef.current) {
        hasStartedRef.current = true;
        // Paper already on the desk: skip the empty-room greeting so the
        // pset_ready turn can speak about what is actually on screen.
        if (getLivePage()) {
          setOrb("listening");
        } else {
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
        }
      } else {
        setOrb(health?.grok && health.elevenlabs ? "listening" : "idle");
      }
      return;
    }

    // The primary control only starts or submits. A tap aimed at "finished"
    // must remain harmless if automatic endpointing just changed the state.
  }, [addTurn, health, setOrb]);

  const sendRef = useRef(sendUtterance);
  const stopRef = useRef(stopPlayback);
  useEffect(() => {
    sendRef.current = sendUtterance;
    speakRef.current = speak;
    stopRef.current = stopPlayback;
  }, [sendUtterance, speak, stopPlayback]);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: Awaited<ReturnType<typeof createSpeechDetector>> | null = null;
    let speechProbability = 0;
    let probabilityAt = 0;
    let suspendedAt: number | null = null;
    let audioContext: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];
    let lastLoud = 0;
    let startedAt = 0;
    let candidate = false;
    let voicedMs = 0;
    let lastFrame = 0;
    let raf = 0;
    const tabId = crypto.randomUUID();
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("better-office-hours-voice");

    const setInputEnabled = (enabled: boolean) => {
      if (enabled) probabilityAt = performance.now();
      if (enabled && audioContext?.state === "suspended") void audioContext.resume();
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
      candidate = false;
      setRecording(false);
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
        if (!pausedRef.current) suspendVoice("Voice is active in another tab. Tap the orb to continue here.");
      }
    });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    const transcribe = async (blob: Blob, signal: AbortSignal) => {
      const form = new FormData();
      form.set("file", blob, "speech.webm");
      return withRequestTimeout(signal, 12000, "Transcription took too long. Please try again.", async signal => {
        const response = await fetch("/api/agent/stt", { method: "POST", body: form, signal });
        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(typeof failure.error === "string" ? failure.error : "Could not hear that");
        }
        const data = (await response.json()) as { text?: string };
        return (data.text ?? "").trim();
      });
    };

    const stopRecorder = async () => {
      if (!recorder || recorder.state === "inactive") return;
      const epoch = playbackEpochRef.current;
      const controller = new AbortController();
      transcriptionAbortRef.current = controller;
      const current = () => !cancelled && !pausedRef.current &&
        !controller.signal.aborted && epoch === playbackEpochRef.current;
      setOrb("thinking");
      const finishedRecorder = recorder;
      const finishedChunks = chunks;
      const done = new Promise<Blob>((resolve) => {
        finishedRecorder.onstop = () => {
          resolve(new Blob(finishedChunks, { type: finishedRecorder.mimeType || "audio/webm" }));
          if (recorder === finishedRecorder) chunks = [];
        };
      });
      finishedRecorder.stop();
      recordingRef.current = false;
      setRecording(false);
      const meaningful = voicedMs >= 160;
      try {
        const blob = await withRequestTimeout(controller.signal, 3000, "The recording could not be finished. Please try again.", async () => done);
        if (!current() || !meaningful || blob.size < 1200) return;
        const text = await transcribe(blob, controller.signal);
        // A paused tab or a different desk must never receive an old recording,
        // even when the transport completes despite cancellation.
        if (!current()) return;
        transcriptionAbortRef.current = null;
        if (!isJunkSpeech(text)) await sendRef.current(text);
      } catch (err) {
        if (current() && (err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not hear that");
        }
      } finally {
        if (transcriptionAbortRef.current === controller) transcriptionAbortRef.current = null;
        if (current() && !playingRef.current && !turnAbortRef.current) setOrb("listening");
      }
    };

    finishRecordingRef.current = () => {
      if (candidate || voicedMs < 160) {
        discardRecording();
        if (!playingRef.current && !turnAbortRef.current) setOrb("listening");
      } else void stopRecorder();
    };

    const takeFloor = () => {
      turnAbortRef.current?.abort();
      turnAbortRef.current = null;
      stopRef.current();
      pauseAnimation();
      candidate = false;
      pendingAttachmentRef.current = null;
      setRecording(true);
      setOrb("listening");
    };

    const startRecorder = () => {
      if (!stream || recordingRef.current || pausedRef.current) return;
      chunks = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined;
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const recordingChunks = chunks;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunks.push(event.data);
      };
      candidate = true;
      voicedMs = 0;
      recorder.start();
      recordingRef.current = true;
      startedAt = performance.now();
      setRecording(false);
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
      if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
      setInputEnabled(!pausedRef.current);
      // A newly opened, paused tab must not steal an active conversation.
      if (!pausedRef.current) claimTab();
      audioContext = new AudioContext();
      if (!pausedRef.current) await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      const inputStream = stream;
      const inputContext = audioContext;
      detector = await withRequestTimeout(undefined, 20000, "The microphone could not get ready. Try the microphone again.", async signal => {
        const created = await createSpeechDetector(inputStream, inputContext, probability => {
          if (cancelled || signal.aborted) return;
          speechProbability = probability;
          probabilityAt = performance.now();
        });
        if (cancelled || signal.aborted) {
          await created.destroy();
          if (cancelled) inputStream.getTracks().forEach(track => track.stop());
          throw new DOMException("Cancelled", "AbortError");
        }
        return created;
      });
      if (cancelled) { await detector.destroy(); return; }
      inputReadyRef.current = true;
      setInputReady(true);


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
        const now = performance.now();
        if (inputReadyRef.current && audioContext?.state === "running" && now - probabilityAt > 5000) {
          inputReadyRef.current = false;
          setInputReady(false);
          suspendVoice("The microphone stopped responding. Retry the microphone.");
          raf = requestAnimationFrame(loop);
          return;
        }
        if (audioContext?.state === "suspended") {
          if (suspendedAt === null) {
            suspendedAt = now;
            void audioContext.resume().catch(() => {});
          } else if (now - suspendedAt > 2000) {
            inputReadyRef.current = false;
            setInputReady(false);
            suspendVoice("Microphone audio was suspended. Retry the microphone.");
          }
          raf = requestAnimationFrame(loop);
          return;
        }
        suspendedAt = null;
        const elapsed = lastFrame ? Math.min(100, now - lastFrame) : 16;
        lastFrame = now;
        // Use speech probability, not volume, to distinguish non-speech noise.
        // The analyser now drives only the visual input meter.
        const loud = now - probabilityAt < 500 && isSpeechFrame(speechProbability, recordingRef.current && !candidate, playingRef.current);
        // Low-confidence background sound must not keep extending a turn.
        // Preserve quiet syllables in the recording, but only clear speech
        // renews the endpoint timer.
        if (loud && speechProbability >= 0.6) lastLoud = now;
        if (!recordingRef.current && !transcriptionAbortRef.current && loud &&
            (playingRef.current || now - playbackEndedAtRef.current > 300)) {
          startRecorder();
        }
        if (recordingRef.current) {
          if (loud) voicedMs += elapsed;
          if (candidate) {
            if (voicedMs >= 180) takeFloor();
            else if (now - lastLoud > 120) discardRecording();
          } else if ((now - lastLoud > 1000 && now - startedAt > 450) || now - startedAt > 90000) {
            void stopRecorder();
          }
        }

        const attachment = pendingAttachmentRef.current;
        if (attachment) {
          const samePage = getLivePage()?.psetId === attachment.id;
          if (!samePage || now - attachment.at > 8000 || recordingRef.current || transcriptionAbortRef.current || turnAbortRef.current) {
            pendingAttachmentRef.current = null;
          } else if (!playingRef.current && now - lastLoud > 1500 && now - attachment.at > 1500 && now - playbackEndedAtRef.current > 1500) {
            pendingAttachmentRef.current = null;
            const receipt = "I can see your PDF now.";
            const epoch = playbackEpochRef.current;
            void speakRef.current(receipt, undefined, epoch, undefined, () => {
              if (epoch !== playbackEpochRef.current || pausedRef.current) return;
              addTurn("tutor", receipt);
              historyRef.current = [...historyRef.current, { role: "assistant", content: receipt }];
            }).catch(err => {
              if (epoch === playbackEpochRef.current && !pausedRef.current && (err as Error).name !== "AbortError") setError((err as Error).message);
            });
          }
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      if (pausedRef.current) {
        setOrb("idle");
      } else if (!hasStartedRef.current && layoutRef.current === "orb_only") {
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
      } else if (!playingRef.current && !turnAbortRef.current) {
        setOrb("listening");
      }
    };

    void boot().catch((err: unknown) => {
      if (cancelled) return;
      inputReadyRef.current = false;
      setInputReady(false);
      suspendVoice();
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
      void (async () => { await detector?.destroy(); await audioContext?.close(); })();
      discardRecording();
      discardRecordingRef.current = () => {};
      finishRecordingRef.current = () => {};
      setInputEnabledRef.current = () => {};
      claimTabRef.current = () => {};
    };
  }, [addTurn, setOrb, inputAttempt]);

  return {
    state,
    level,
    recording,
    inputReady,
    retryMicrophone,
    health,
    error,
    paused,
    sendUtterance,
    sendEvent,
    interrupt,
    pauseVoice,
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
