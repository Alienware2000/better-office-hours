"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionEvent } from "@/lib/agent/events";
import { detectMode } from "@/lib/agent/intent";
import { parseAgentTurn, takeSpeechChunks, visualBeats, type ChatMessage } from "@/lib/agent/tags";
import { getLivePage, setLivePage } from "@/lib/pdf/live-page";
import { boardContextForTurn, getLiveBoard } from "@/lib/whiteboard/live-board";
import { needsBoardRepair, teachingTag } from "@/lib/agent/teaching-intent";
import { interpretCommand, isDrawCommand } from "@/lib/whiteboard/geometry";
import { getBoardState, restoreBoard, type BoardState, loadAnimation, pauseAnimation, playAnimation, focusAnimation, applyDrawCommands, continueBoardPage, openBoard, resetBoard } from "@/lib/whiteboard/store";
import type { AgentTurn, LayoutState, Turn } from "@/lib/types";
import { createSpeechDetector, isSpeechFrame } from "./speech-detector";
import { requestMicrophone, assertLiveMicrophone } from "./microphone";
import { SpeechAudioCapture } from "./audio-capture";
import { transcriptionKeyterms } from "@/lib/agent/transcription-context";
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
  const [inputStarting, setInputStarting] = useState(false);
  const startInputRef = useRef<() => void>(() => {});
  const pendingStartTextRef = useRef<string | null>(null);
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
      onProgress,
    }: {
      event?: SessionEvent;
      deep: boolean;
      signal: AbortSignal;
      playbackEpoch: number;
      onProgress?: () => void;
    }): Promise<{ full: string; turn: AgentTurn; spoken: Promise<void> }> => {
      // Each model pass has its own tag stream. Reset so a deep turn after
      // [THINK] does not skip DRAW commands that share indices with the lead-in.
      void enqueueSpeechTask(async () => {
        if (signal.aborted || playbackEpoch !== playbackEpochRef.current) return;
        boardAppliedRef.current = 0;
        animAppliedRef.current = "";
        animControlRef.current = "";
      });
      const visualSource = getLivePage();
      const requestedAt = performance.now();
      const response = await fetch("/api/agent/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          stream: true,
          livePage: visualSource,
          liveBoard: boardContextForTurn(getBoardState()),
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
      let pendingVisuals: AgentTurn[] = [];

      // Shortness is a tutor instruction, never a silent client-side audio cut.
      const enqueueSpeech = (chunk: string) => {
        const trimmed = chunk.trim();
        if (!trimmed || signal.aborted || playbackEpoch !== playbackEpochRef.current) return;
        const visuals = pendingVisuals;
        pendingVisuals = [];
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
          let started = false;
          try { await speak(trimmed, previousText, playbackEpoch, prepared, () => {
            if (started) return;
            started = true;
            // Playback may wait on synthesis or browser buffering. Start both
            // ink and motion when the sentence is audible, not when queued.
            visuals.forEach(applyTurn);
            if (process.env.NODE_ENV !== 'production' && visuals.length) {
              const board = getBoardState();
              console.info('Tutor visual playback ' + JSON.stringify({ request: response.headers.get('x-tutor-request'), deep, beats: visuals.length, page: board.pageId, groups: board.groups?.length, animation: Boolean(board.animation), revision: board.revision }));
            }
            heard = [heard, trimmed].filter(Boolean).join(" ");
            if (!captionStarted && process.env.NODE_ENV !== 'production') console.info('Tutor speech playback ' + JSON.stringify({ request: response.headers.get('x-tutor-request'), deep, firstAudioMs: Math.round(performance.now() - requestedAt) }));
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
        onProgress?.();
        const partial = parseAgentTurn(raw);
        // Both static marks and animation share the speech queue. A tag waits
        // for its preceding words rather than drawing the whole reply upfront.
        const beats = visualBeats(raw, visualSource);
        for (const beat of beats.slice(beatsApplied)) {
          const pending = beat.speechBefore.slice(emitted).trim();
          if (pending) { enqueueSpeech(pending); emitted = beat.speechBefore.length; }
          pendingVisuals.push(beat.turn);
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
      // Legacy/silent drawing turns may end in tags without spoken words.
      // They still wait for preceding narration and obey interruption.
      if (pendingVisuals.length) {
        const visuals = pendingVisuals;
        pendingVisuals = [];
        spoken = enqueueSpeechTask(async () => {
          if (!signal.aborted && !speechFailure && playbackEpoch === playbackEpochRef.current) visuals.forEach(applyTurn);
        });
      }
      let visualRepair: Promise<void> = Promise.resolve();
      const currentBoard = getBoardState();
      if (needsBoardRepair(turn, currentBoard.animation, currentBoard.groups.filter(group => !group.unresolved).map(group => group.id))) {
        visualRepair = withRequestTimeout(signal, 6000, 'Board preparation timed out', async repairSignal => {
          const response = await fetch('/api/agent/llm', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: repairSignal,
            body: JSON.stringify({ visualRepair: true, messages: [...historyRef.current, { role: 'assistant', content: teachingTag(turn.teaching) + turn.speech }], livePage: visualSource, liveBoard: getLiveBoard() }),
          });
          if (!response.ok) return;
          const raw = await readSseText(response, () => {});
          if (signal.aborted || playbackEpoch !== playbackEpochRef.current || speechFailure) return;
          const repair = parseAgentTurn(raw, visualSource, turn.teaching);
          // This lane cannot speak, navigate, point at the PDF, or clear work.
          const commands = (repair.board?.commands ?? []).filter(command => !['clear', 'remove'].includes(command.op)).slice(0, 5);
          const renderable = commands.filter((command, index) => interpretCommand(command, index)?.kind === 'draw');
          if (renderable.length) {
            if (renderable.some(command => command.op !== 'text')) continueBoardPage();
            applyDrawCommands(renderable);
          }
        }).catch(error => { if (!signal.aborted) console.warn('Board preparation did not complete:', (error as Error).name); });
      }
      const finished = Promise.all([spoken, visualRepair]).then(() => { if (speechFailure) throw speechFailure; });
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
        const deep = withRequestTimeout(signal, 30000, "The tutor took too long. Please try again.",
          (signal, onProgress) => runPass({ event, deep: true, signal, playbackEpoch, onProgress }),
          { idleMilliseconds: 20000, totalMilliseconds: 60000 });
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
        if (!inputReadyRef.current) {
          pendingStartTextRef.current = text;
          startInputRef.current();
          return;
        }
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
    pendingStartTextRef.current = null;
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
    // Retrying the input resumes this conversation after the new stream is ready.
    pausedRef.current = false;
    setPaused(false);
    startInputRef.current();
  }, [pauseVoice]);

  const interrupt = useCallback(() => {
    if (!inputReadyRef.current) { retryMicrophone(); return; }
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
  }, [addTurn, health, setOrb, retryMicrophone]);

  const sendRef = useRef(sendUtterance);
  const stopRef = useRef(stopPlayback);
  useEffect(() => {
    sendRef.current = sendUtterance;
    speakRef.current = speak;
    stopRef.current = stopPlayback;
  }, [sendUtterance, speak, stopPlayback]);

  useEffect(() => {
    let cancelled = false;
    let starting = false;
    let startup: AbortController | null = null;
    let stream: MediaStream | null = null;
    let detector: Awaited<ReturnType<typeof createSpeechDetector>> | null = null;
    let speechProbability = 0;
    let probabilityAt = 0;
    let suspendedAt: number | null = null;
    let audioContext: AudioContext | null = null;
    const audioCapture = new SpeechAudioCapture();
    let lastLoud = 0;
    let startedAt = 0;
    let candidate = false;
    let voicedMs = 0;
    let lastFrame = 0;
    let lastInputTrace = 0;
    let rmsPeak = 0;
    let probabilityPeak = 0;
    let pcmPeak = 0;
    let raf = 0;
    let capture: { controller: AbortController; epoch: number; pending: number; failed?: boolean; parts: (string | null)[] } | null = null;
    const flushCapture = () => {
      const batch = capture;
      if (!batch || batch.pending || recordingRef.current) return;
      if (cancelled || pausedRef.current || batch.controller.signal.aborted || batch.epoch !== playbackEpochRef.current) { capture = null; return; }
      capture = null;
      if (transcriptionAbortRef.current === batch.controller) transcriptionAbortRef.current = null;
      const text = batch.failed ? '' : batch.parts.filter((part): part is string => Boolean(part)).join(' ');
      if (text) void sendRef.current(text);
      else if (!playingRef.current && !turnAbortRef.current) setOrb('listening');
    };
    const tabId = crypto.randomUUID();
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("better-office-hours-voice");

    const setInputEnabled = (enabled: boolean) => {
      if (enabled) probabilityAt = performance.now();
      if (enabled && audioContext && audioContext.state !== "running" && audioContext.state !== "closed") {
        void audioContext.resume().catch(() => {});
      }
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    };
    setInputEnabledRef.current = setInputEnabled;

    const discardRecording = () => {
      audioCapture.discard();
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

    const inputUnavailable = (message: string) => {
      console.warn('Voice input unavailable ' + JSON.stringify({
        audioState: audioContext?.state,
        tracks: stream?.getAudioTracks().map(track => ({ state: track.readyState, muted: track.muted, enabled: track.enabled })),
        detectorAgeMs: Math.round(performance.now() - probabilityAt),
      }));
      inputReadyRef.current = false;
      setInputReady(false);
      suspendVoice(message);
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
      form.set("file", blob, "speech.wav");
      const recentTutor = historyRef.current.filter(message => message.role === "assistant").at(-1)?.content ?? "";
      form.set("keyterms", JSON.stringify(transcriptionKeyterms(recentTutor, getLivePage()?.text ?? "")));
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
      if (!recordingRef.current) return;
      const epoch = playbackEpochRef.current;
      if (!capture || capture.controller.signal.aborted || capture.epoch !== epoch) {
        capture = { controller: new AbortController(), epoch, pending: 0, parts: [] };
      }
      const batch = capture;
      const controller = batch.controller;
      const part = batch.parts.length;
      batch.parts.push(null);
      batch.pending += 1;
      transcriptionAbortRef.current = controller;
      const current = () => !cancelled && !pausedRef.current &&
        !controller.signal.aborted && epoch === playbackEpochRef.current;
      setOrb("thinking");
      const blob = audioCapture.finish();
      recordingRef.current = false;
      setRecording(false);
      const meaningful = voicedMs >= 160;
      try {
        if (!current() || !meaningful || blob.size < 1200) return;
        const text = await transcribe(blob, controller.signal);
        // A paused tab or a different desk must never receive an old recording,
        // even when the transport completes despite cancellation.
        if (!current()) return;
        if (!isJunkSpeech(text)) batch.parts[part] = text;
      } catch (err) {
        if (current() && (err as Error).name !== "AbortError") {
          batch.failed = true;
          setError(err instanceof Error ? err.message : "Could not hear that");
        }
      } finally {
        batch.pending -= 1;
        if (current()) flushCapture();
        else if (capture === batch) capture = null;
      }
    };

    finishRecordingRef.current = () => {
      if (candidate || voicedMs < 160) {
        discardRecording();
        if (!playingRef.current && !turnAbortRef.current) setOrb("listening");
      } else void stopRecorder();
    };

    const takeFloor = () => {
      // Continued speech during transcription belongs to the same student
      // turn. Keep that batch alive instead of discarding its opening words.
      if (!capture || capture.controller.signal.aborted || capture.epoch !== playbackEpochRef.current) {
        turnAbortRef.current?.abort();
        turnAbortRef.current = null;
        stopRef.current();
      }
      pauseAnimation();
      candidate = false;
      pendingAttachmentRef.current = null;
      setRecording(true);
      setOrb("listening");
    };

    const startRecorder = () => {
      if (!stream || recordingRef.current || pausedRef.current) return;
      audioCapture.start();
      candidate = true;
      voicedMs = 0;
      recordingRef.current = true;
      startedAt = performance.now();
      setRecording(false);
    };

    const boot = async (signal: AbortSignal) => {
      // Both browser audio operations begin in the click's call stack, before
      // awaiting server configuration or detector assets.
      const requested = requestMicrophone(signal);
      void requested.catch(() => {});
      audioContext = new AudioContext();
      const resumed = audioContext.resume();
      void resumed.catch(() => {});
      const healthRequest = withRequestTimeout(signal, 8000, 'Voice configuration could not load. Retry the microphone.', async requestSignal => {
        const response = await fetch('/api/agent/health', { signal: requestSignal });
        if (!response.ok) throw new Error('Voice configuration could not load. Retry the microphone.');
        return await response.json() as Health;
      });
      void healthRequest.catch(() => {});
      // Hold a granted stream immediately so a concurrent configuration failure
      // or unmount cannot orphan it.
      stream = await requested;
      if (cancelled || signal.aborted) { stream.getTracks().forEach(track => track.stop()); return; }
      assertLiveMicrophone(stream);
      const status = await healthRequest;
      if (cancelled || signal.aborted) return;
      setHealth(status);
      if (!status.elevenlabs || !status.grok) throw new Error('Voice services are not configured on this server.');
      await withRequestTimeout(signal, 5000, 'Microphone audio could not start. Retry the microphone.', async () => resumed);
      if (cancelled || signal.aborted) return;
      setInputEnabled(!pausedRef.current);
      if (!pausedRef.current) claimTab();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      const inputStream = stream;
      const inputContext = audioContext;
      detector = await withRequestTimeout(signal, 20000, "The microphone could not get ready. Try the microphone again.", async signal => {
        const created = await createSpeechDetector(inputStream, inputContext, (probability, frame) => {
          if (cancelled || signal.aborted) return;
          if (pausedRef.current) audioCapture.discard();
          else audioCapture.push(frame);
          speechProbability = probability;
          probabilityAt = performance.now();
          if (process.env.NODE_ENV === 'development' && !pausedRef.current) {
            probabilityPeak = Math.max(probabilityPeak, probability);
            let energy = 0;
            for (const sample of frame) energy += sample * sample;
            pcmPeak = Math.max(pcmPeak, Math.sqrt(energy / Math.max(1, frame.length)));
          }
        });
        if (cancelled || signal.aborted) {
          await created.destroy();
          if (cancelled) inputStream.getTracks().forEach(track => track.stop());
          throw new DOMException("Cancelled", "AbortError");
        }
        return created;
      });
      if (cancelled) { await detector.destroy(); return; }
      assertLiveMicrophone(inputStream);
      starting = false;
      setInputStarting(false);
      inputReadyRef.current = true;
      setInputReady(true);


      const loop = () => {
        if (cancelled) return;
        if (pausedRef.current) {
          setLevel(0);
          raf = requestAnimationFrame(loop);
          return;
        }
        const now = performance.now();
        const tracks = inputStream.getAudioTracks();
        if (!tracks.length || tracks.some(track => track.readyState === 'ended') || inputContext.state === 'closed') {
          inputUnavailable('The microphone connection ended. Retry the microphone.');
          raf = requestAnimationFrame(loop);
          return;
        }
        // A live detector can keep processing silence from a muted/disabled
        // track. Check the source itself before trusting its heartbeat.
        for (const track of tracks) if (!track.enabled) track.enabled = true;
        if (inputContext.state !== 'running' || tracks.some(track => track.muted)) {
          setLevel(0);
          if (suspendedAt === null) {
            suspendedAt = now;
            if (inputContext.state !== 'running') void inputContext.resume().catch(() => {});
          } else if (now - suspendedAt > 2000) {
            inputUnavailable(inputContext.state === 'suspended'
              ? 'Microphone audio was suspended. Retry the microphone.'
              : 'Microphone audio was interrupted. Retry the microphone.');
          }
          raf = requestAnimationFrame(loop);
          return;
        }
        if (suspendedAt !== null) {
          suspendedAt = null;
          // Allow fresh detector frames after the browser restores audio.
          probabilityAt = now;
          speechProbability = 0;
        }
        if (now - probabilityAt > 5000) {
          inputUnavailable('The microphone stopped responding. Retry the microphone.');
          raf = requestAnimationFrame(loop);
          return;
        }
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (const sample of data) sum += sample * sample;
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);
        rmsPeak = Math.max(rmsPeak, rms);
        // Development diagnostics for input that appears live but hears nothing.
        // No audio, transcript, device name, or credential is recorded.
        if (process.env.NODE_ENV === 'development' && now - lastInputTrace > 5000) {
          lastInputTrace = now;
          console.info('Voice input state ' + JSON.stringify({
            tab: tabId.slice(0, 8), state: stateRef.current, rms: Number(rms.toFixed(4)),
            rmsPeak: Number(rmsPeak.toFixed(4)), pcmPeak: Number(pcmPeak.toFixed(4)),
            probabilityPeak: Number(probabilityPeak.toFixed(3)),
            probability: Number(speechProbability.toFixed(3)), detectorAgeMs: Math.round(now - probabilityAt),
            recording: recordingRef.current, candidate, voicedMs: Math.round(voicedMs),
            pendingTranscriptions: capture?.pending ?? 0, playing: playingRef.current,
          }));
          rmsPeak = probabilityPeak = pcmPeak = 0;
        }
        const elapsed = lastFrame ? Math.min(100, now - lastFrame) : 16;
        lastFrame = now;
        // Use speech probability, not volume, to distinguish non-speech noise.
        // The analyser now drives only the visual input meter.
        const loud = now - probabilityAt < 500 && isSpeechFrame(speechProbability, recordingRef.current && !candidate, playingRef.current);
        // Low-confidence background sound must not keep extending a turn.
        // Preserve quiet syllables in the recording, but only clear speech
        // renews the endpoint timer.
        if (loud && speechProbability >= 0.6) lastLoud = now;
        if (!recordingRef.current && loud &&
            (playingRef.current || now - playbackEndedAtRef.current > 300)) {
          startRecorder();
        }
        if (recordingRef.current) {
          if (loud) voicedMs += elapsed;
          if (candidate) {
            if (voicedMs >= 180) takeFloor();
            else if (now - lastLoud > 120) discardRecording();
          } else if ((now - lastLoud > 1500 && now - startedAt > 450) || now - startedAt > 90000) {
            void stopRecorder();
          }
        }

        flushCapture();
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

      const pendingText = pendingStartTextRef.current;
      pendingStartTextRef.current = null;
      if (pausedRef.current) {
        setOrb("idle");
      } else if (pendingText) {
        await sendRef.current(pendingText);
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

    const releaseInput = () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(track => track.stop());
      const previousDetector = detector, previousContext = audioContext;
      detector = null;
      stream = null;
      audioContext = null;
      void (async () => { await previousDetector?.destroy(); if (previousContext?.state !== 'closed') await previousContext?.close(); })().catch(() => {});
    };
    startInputRef.current = () => {
      if (cancelled || starting) return;
      startup?.abort();
      releaseInput();
      const controller = new AbortController();
      startup = controller;
      starting = true;
      setInputStarting(true);
      void boot(controller.signal).catch((err: unknown) => {
        if (cancelled || startup !== controller) return;
        controller.abort();
        releaseInput();
        inputReadyRef.current = false;
        setInputReady(false);
        pendingStartTextRef.current = null;
        suspendVoice();
        const name = err instanceof DOMException ? err.name : '';
        setError(name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser and retry.'
          : err instanceof Error ? err.message : 'Could not start voice');
      }).finally(() => {
        if (cancelled || startup !== controller) return;
        starting = false;
        setInputStarting(false);
      });
    };

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      channel?.close();
      turnAbortRef.current?.abort();
      stopRef.current();
      startup?.abort();
      releaseInput();
      startInputRef.current = () => {};
      discardRecording();
      discardRecordingRef.current = () => {};
      finishRecordingRef.current = () => {};
      setInputEnabledRef.current = () => {};
      claimTabRef.current = () => {};
    };
  }, [addTurn, setOrb]);

  return {
    state,
    level,
    recording,
    inputReady,
    inputStarting,
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
