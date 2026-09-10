"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { WorkspacePane } from "@/components/workspace/WorkspacePane";
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
    turns,
    chips,
    layout,
    pointer,
    highlight,
  } = useVoiceLoop();
  const split = layout === "pset";
  const reduceMotion = useReducedMotion();
  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 210, damping: 27, mass: 0.85 };

  return (
    <main className="session-shell">
      <LayoutGroup id="session-layout">
        <AnimatePresence initial={false} mode="popLayout">
          {!split ? (
            <motion.section
              key="welcome"
              className="welcome-stage"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transition: { duration: 0.18 } }
              }
            >
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

              <motion.div
                className="chip-row"
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, transition: { duration: 0.16 } }
                }
              >
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void sendUtterance(chip)}
                    className="chip"
                  >
                    {chip}
                  </button>
                ))}
              </motion.div>

              {error ? <p className="session-note">{error}</p> : null}
            </motion.section>
          ) : (
            <motion.div
              key="workspace"
              className="workspace-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <motion.section
                className="workspace-stage"
                initial={reduceMotion ? false : { opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={layoutTransition}
              >
                <WorkspacePane
                  pointer={pointer}
                  highlight={highlight}
                  onPsetReady={(info) =>
                    void sendEvent({
                      kind: "pset_ready",
                      title: info.title,
                      pages: info.pages,
                    })
                  }
                />
              </motion.section>

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
                {error ? <p className="session-note workspace-note">{error}</p> : null}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
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
