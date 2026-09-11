"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  WorkspacePane,
  type LoadedPset,
} from "@/components/workspace/WorkspacePane";
import { LeaveButton } from "@/components/workspace/LeaveButton";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { Captions } from "./Captions";
import { Orb } from "./Orb";
import type { OrbState } from "./constants";
import { useVoiceLoop } from "./useVoiceLoop";
import "./session.css";

export function VoiceSession() {
  const {
    state,
    level,
    recording,
    inputReady,
    retryMicrophone,
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
    chips,
    layout,
    pointer,
    highlight,
  } = useVoiceLoop();
  const [pset, setPset] = useState<LoadedPset | null>(null);
  const [notes, setNotes] = useState<LoadedPset | null>(null);
  const [documentViews, setDocumentViews] = useState({
    pset: true,
    concept: false,
  });
  const [notesReady, setNotesReady] = useState<{
    title: string;
    pages: number;
  } | null>(null);
  const announcedNotes = useRef<string | null>(null);
  const split = layout !== "orb_only";
  const concept = layout === "concept";
  const homework = layout === "pset";
  const deskMode = concept ? "concept" : "pset";
  const documentView = documentViews[deskMode];
  const setDocumentView = (show: boolean) =>
    setDocumentViews((current) => ({ ...current, [deskMode]: show }));
  const deskKept = split || Boolean(pset) || Boolean(notes);
  const reduceMotion = useReducedMotion();
  const announcedReady = useRef<string | null>(null);
  const [deskReady, setDeskReady] = useState<{
    title: string;
    pages: number;
  } | null>(null);

  useEffect(() => {
    bindDiscardPset(() => {
      announcedReady.current = null;
      setDeskReady(null);
      setPset(null);
    });
    return () => bindDiscardPset(() => {});
  }, [bindDiscardPset]);

  const announceReady = useCallback(
    (info: { title: string; pages: number }, id: string) => {
      if (announcedReady.current === id) return;
      announcedReady.current = id;
      void sendEvent({
        kind: "pset_ready",
        title: info.title,
        pages: info.pages,
      });
    },
    [sendEvent],
  );

  // Retain readiness bookkeeping for the desk. Readiness is silent; the
  // current page snapshot reaches the tutor with the next student utterance.
  useEffect(() => {
    if (paused || !homework || !pset || !deskReady) return;
    announceReady(deskReady, pset.id);
  }, [announceReady, deskReady, paused, pset, homework]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); pauseVoice(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pauseVoice]);

  useEffect(() => {
    if (
      !concept ||
      paused ||
      !notes ||
      !notesReady ||
      announcedNotes.current === notes.id
    )
      return;
    announcedNotes.current = notes.id;
    void sendEvent({ kind: "notes_ready", ...notesReady });
  }, [concept, paused, notes, notesReady, sendEvent]);

  useEffect(() => {
    if ((!pointer && !highlight) || !(concept ? notes : homework && pset)) return;
    const mode = concept ? "concept" : "pset";
    const frame = requestAnimationFrame(() => setDocumentViews((current) =>
      current[mode] ? current : { ...current, [mode]: true },
    ));
    return () => cancelAnimationFrame(frame);
  }, [pointer, highlight, concept, homework, notes, pset]);

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 210, damping: 27, mass: 0.85 };

  return (
    <main className="session-shell">
      <LayoutGroup id="session-layout">
        {!split ? (
          <motion.section key="welcome" className="welcome-stage">
            <motion.div
              layoutId="tutor-orb"
              className="orb-frame orb-frame-home"
              transition={layoutTransition}
            >
              <Orb
                state={state}
                level={level}
                paused={paused}
                recording={recording}
                inputReady={inputReady}
                inputError={!inputReady && Boolean(error)}
                onRetry={retryMicrophone}
                onInterrupt={interrupt}
                onPause={pauseVoice}
              />
            </motion.div>
            <p className="orb-status">{statusText(state, paused, recording, inputReady, Boolean(error))}</p>

            <div className="chip-row">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (chip === "Homework" && pset) {
                      enterWorkspace();
                      return;
                    }
                    void sendUtterance(chip);
                  }}
                  className="chip"
                >
                  {chip}
                </button>
              ))}
            </div>

            {error ? <p className="session-note">{error}</p> : null}
          </motion.section>
        ) : null}

        {deskKept ? (
          <motion.div
            key="workspace"
            className={[
              "workspace-layout",
              split ? "" : "is-parked",
              concept ? "is-concept" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            initial={{ opacity: 0 }}
            animate={{ opacity: split ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            aria-hidden={!split}
          >
            <motion.section
              className="workspace-stage"
              initial={reduceMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={layoutTransition}
            >
              <div className="concept-desk adaptive-desk">
                <div className="concept-toolbar">
                  <LeaveButton onLeave={exitWorkspace} />
                  <div
                    className="concept-views"
                    role="group"
                    aria-label="Desk view"
                  >
                    <button
                      type="button"
                      aria-pressed={!documentView}
                      onClick={() => setDocumentView(false)}
                    >
                      Whiteboard
                    </button>
                    <button
                      type="button"
                      aria-pressed={documentView}
                      onClick={() => setDocumentView(true)}
                    >
                      {concept
                        ? notes
                          ? "Notes"
                          : "Attach notes"
                        : pset
                          ? "Problem set"
                          : "Attach pset"}
                    </button>
                  </div>
                </div>
                <div className="concept-content">
                  {split && !documentView && (
                    <div className="concept-board">
                      <Whiteboard expanded />
                    </div>
                  )}
                  <div
                    className={
                      homework && documentView
                        ? "concept-notes"
                        : "concept-notes is-concealed"
                    }
                    aria-hidden={!homework || !documentView}
                    inert={!homework || !documentView}
                  >
                    <WorkspacePane
                      pset={pset}
                      onPsetChange={setPset}
                      pointer={pointer}
                      highlight={highlight}
                      active={homework}
                      onRemove={putAwayPset}
                      onPsetReady={setDeskReady}
                    />
                  </div>
                  {(concept || notes) && (
                    <div
                      className={
                        concept && documentView
                          ? "concept-notes"
                          : "concept-notes is-concealed"
                      }
                      aria-hidden={!concept || !documentView}
                      inert={!concept || !documentView}
                    >
                      <WorkspacePane
                        kind="notes"
                        pset={notes}
                        onPsetChange={(value) => {
                          setNotesReady(null);
                          setNotes(value);
                        }}
                        active={concept}
                        pointer={pointer}
                        highlight={highlight}
                        onPsetReady={setNotesReady}
                        onRemove={() => {
                          setNotes(null);
                          setNotesReady(null);
                          announcedNotes.current = null;
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            {split ? (
              <section className="agent-stage">
                <motion.div
                  layoutId="tutor-orb"
                  className="orb-frame orb-frame-workspace"
                  transition={layoutTransition}
                >
                  <Orb
                    state={state}
                    level={level}
                    paused={paused}
                    recording={recording}
                    inputReady={inputReady}
                    inputError={!inputReady && Boolean(error)}
                    onRetry={retryMicrophone}
                    onInterrupt={interrupt}
                    onPause={pauseVoice}
                  />
                </motion.div>
                <p className="orb-status">{statusText(state, paused, recording, inputReady, Boolean(error))}</p>
                <Captions turns={turns} />
                {documentView && <Whiteboard active={split} onExpand={() => setDocumentView(false)} />}
                {error ? (
                  <p className="session-note workspace-note">{error}</p>
                ) : null}
              </section>
            ) : null}
          </motion.div>
        ) : null}
      </LayoutGroup>
    </main>
  );
}

function statusText(state: OrbState, paused: boolean, recording: boolean, inputReady: boolean, inputError: boolean): string {
  if (!inputReady) return inputError ? "Microphone unavailable" : "Preparing microphone";
  if (paused) return "Tap to start";
  if (recording) return "Listening · tap when finished";
  if (state === "speaking") return "Speaking";
  if (state === "thinking") return "Thinking";
  if (state === "listening") return "Listening";
  return "Ready";
}
