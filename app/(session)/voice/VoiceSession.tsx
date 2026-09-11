"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  WorkspacePane,
  type LoadedPset,
} from "@/components/workspace/WorkspacePane";
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
    chips,
    layout,
    pointer,
    highlight,
  } = useVoiceLoop();
  const [pset, setPset] = useState<LoadedPset | null>(null);
  const split = layout === "pset";
  const deskKept = split || Boolean(pset);
  const reduceMotion = useReducedMotion();
  const announcedReady = useRef<string | null>(null);
  const [deskReady, setDeskReady] = useState<{ title: string; pages: number } | null>(
    null,
  );

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

  // sendEvent no-ops while paused, so do not mark the pset announced until
  // the student is actually listening. Otherwise the tutor never sees the page.
  useEffect(() => {
    if (paused || !split || !pset || !deskReady) return;
    announceReady(deskReady, pset.id);
  }, [announceReady, deskReady, paused, pset, split]);

  useEffect(() => {
    if (!split) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitWorkspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitWorkspace, split]);

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
                onInterrupt={interrupt}
              />
            </motion.div>
            <p className="orb-status">{statusText(state, paused)}</p>

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
            className={["workspace-layout", split ? "" : "is-parked"].filter(Boolean).join(" ")}
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
              <WorkspacePane
                pset={pset}
                onPsetChange={setPset}
                pointer={pointer}
                highlight={highlight}
                active={split}
                onExit={exitWorkspace}
                onRemove={putAwayPset}
                onPsetReady={setDeskReady}
              />
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
                    onInterrupt={interrupt}
                  />
                </motion.div>
                <p className="orb-status">{statusText(state, paused)}</p>
                <Captions turns={turns} />
                <Whiteboard active={split} />
                {error ? <p className="session-note workspace-note">{error}</p> : null}
              </section>
            ) : null}
          </motion.div>
        ) : null}
      </LayoutGroup>
    </main>
  );
}

function statusText(state: OrbState, paused: boolean): string {
  if (paused) return "Tap to start";
  if (state === "speaking") return "Speaking · tap to stop";
  if (state === "thinking") return "Thinking · tap to cancel";
  if (state === "listening") return "Listening";
  return "Ready";
}
