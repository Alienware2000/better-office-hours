"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  WorkspacePane,
  type LoadedPset,
} from "@/components/workspace/WorkspacePane";
import { LeaveButton } from "@/components/workspace/LeaveButton";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { CourseConnection } from "./CourseConnection";
import { Captions } from "./Captions";
import { Orb } from "./Orb";
import { ResponseStatus } from './ResponseStatus';
import type { OrbState } from "./constants";
import { useVoiceLoop } from "./useVoiceLoop";
import { SessionLibrary, type SessionPersistence } from './SessionLibrary';
import type { SavedSession, SessionDiagnostic } from './saved-sessions';
import type { PdfViewState } from '@/lib/pdf/view-state';
import { resetBoard, subscribeBoard } from '@/lib/whiteboard/store';
import "./session.css";

export function VoiceSession(props: { ownerKey?: string; studentName?: string; accountName?: string; signInAvailable?: boolean }) {
  return <SessionLibrary {...props} Desk={SessionDesk} />;
}

function SessionDesk({ saved, onSave, bindCapture, bindSuspend, onNew, onExport, studentName, headerActions }: SessionPersistence) {
  const [courseId, setCourseId] = useState(saved.courseId);
  const {
    state,
    level,
    recording,
    responsePhase,
    inputReady,
    inputStarting,
    retryMicrophone,
    error,
    paused,
    sendUtterance,
    sendEvent,
    interrupt,
    pauseVoice,
    enterWorkspace,
    putAwayPset,
    bindDiscardPset,
    bindNewSession,
    recap,
    captureSession,
    restoreSession,
    turns,
    chips,
    layout,
    pointer,
    highlight,
  } = useVoiceLoop(courseId, setCourseId, studentName);
  const [pset, setPset] = useState<LoadedPset | null>(saved.pset);
  const [notes, setNotes] = useState<LoadedPset | null>(saved.notes);
  const [documentViews, setDocumentViews] = useState(saved.documentViews);
  const [pdf, setPdf] = useState(saved.pdf);
  const diagnostics = useRef<SessionDiagnostic[]>(saved.diagnostics);
  useEffect(() => { bindSuspend(pauseVoice); }, [pauseVoice, bindSuspend]);
  const hydrated = useRef(false);
  const capture = useCallback((): SavedSession => ({ ...saved, courseId, voice: captureSession(), pset, notes, documentViews, pdf, diagnostics: [...diagnostics.current] }),
    [saved, courseId, captureSession, pset, notes, documentViews, pdf]);
  const captureRef = useRef(capture);
  useEffect(() => { captureRef.current = capture; bindCapture(capture); }, [capture, bindCapture]);
  useEffect(() => {
    if (hydrated.current) return;
    if (saved.voice) restoreSession(saved.voice); else resetBoard();
    hydrated.current = true;
  }, [saved, restoreSession]);
  useEffect(() => {
    bindNewSession(onNew);
    return () => bindNewSession(null);
  }, [bindNewSession, onNew]);
  useEffect(() => {
    if (hydrated.current) onSave(capture());
  }, [capture, layout, turns, recap, onSave]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (hydrated.current) onSave(captureRef.current());
    };
    // Throttle rather than debounce: a playing animation must still get saved.
    const schedule = () => { timer ??= setTimeout(flush, 500); };
    const unsubscribe = subscribeBoard(schedule);
    const record = (event: Event) => {
      const detail = (event as CustomEvent<SessionDiagnostic>).detail;
      diagnostics.current = [...diagnostics.current, detail];
      schedule();
    };
    window.addEventListener('boh:session-diagnostic', record);
    window.addEventListener('pagehide', flush);
    const onHidden = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      unsubscribe(); if (timer) clearTimeout(timer);
      window.removeEventListener('boh:session-diagnostic', record);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [onSave]);
  const rememberPdf = useCallback((id: string, value: PdfViewState) => setPdf(current => ({ ...current, [id]: value })), []);
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
    <>
    <CourseConnection headerActions={headerActions} recap={recap} selected={courseId} onSelect={id => { pauseVoice(); setCourseId(id); }} onOpen={pauseVoice} />
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
                inputStarting={inputStarting}
                inputError={!inputReady && Boolean(error)}
                onRetry={retryMicrophone}
                onInterrupt={interrupt}
                onPause={pauseVoice}
              />
            </motion.div>
            <ResponseStatus label={statusText(state, paused, recording, inputReady, Boolean(error), inputStarting, responsePhase)} busy={inputReady && !paused && !recording && state === 'thinking'} />

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
                  <LeaveButton onLeave={onNew} />
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
                      savedView={pset ? pdf[pset.id] : undefined}
                      onViewChange={rememberPdf}
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
                        savedView={notes ? pdf[notes.id] : undefined}
                        onViewChange={rememberPdf}
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
                inputStarting={inputStarting}
                    inputError={!inputReady && Boolean(error)}
                    onRetry={retryMicrophone}
                    onInterrupt={interrupt}
                    onPause={pauseVoice}
                  />
                </motion.div>
                <ResponseStatus label={statusText(state, paused, recording, inputReady, Boolean(error), inputStarting, responsePhase)} busy={inputReady && !paused && !recording && state === 'thinking'} />
                <Captions turns={turns} recap={recap} onExport={onExport} />
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
    </>
  );
}

function statusText(state: OrbState, paused: boolean, recording: boolean, inputReady: boolean, inputError: boolean, inputStarting: boolean, phase: ReturnType<typeof useVoiceLoop>['responsePhase']): string {
  if (!inputReady) return inputError ? "Microphone unavailable" : inputStarting ? "Preparing microphone" : "Tap to start";
  if (paused) return "Tap to start";
  if (recording) return "Listening · tap when finished";
  if (state === "speaking") return "Speaking";
  if (state === "thinking") {
    if (phase === 'transcribing') return 'Transcribing';
    if (phase === 'explaining') return 'Working through your question';
    if (phase === 'voice') return 'Preparing voice';
    return 'Thinking';
  }
  if (state === "listening") return "Listening";
  return "Ready";
}
