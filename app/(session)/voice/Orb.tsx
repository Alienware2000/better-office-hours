import type { OrbState } from "./constants";
import "./orb.css";

export function Orb({
  state,
  level,
  paused,
  recording = false,
  onInterrupt,
  onPause,
  inputReady = true,
  inputError = false,
  onRetry,
}: {
  state: OrbState;
  level: number;
  paused: boolean;
  recording?: boolean;
  onInterrupt: () => void;
  onPause: () => void;
  inputReady?: boolean;
  inputError?: boolean;
  onRetry: () => void;
}) {
  const scale = 1 + Math.min(0.22, level * 0.45);
  const label = paused
    ? "Start the tutor"
    : recording
      ? "Send what I said"
      : state === "speaking" || state === "thinking"
        ? "Tutor is responding"
        : "Listening";

  return (
    <div className="voice-controls">
      <button
        type="button"
        className="orb-control"
        aria-label={label}
        onClick={onInterrupt}
        disabled={!inputReady}
        aria-disabled={!inputReady || (!paused && !recording)}
      >
        <span
          aria-hidden
          className={[
            "orb",
            state === "idle" && "orb-idle",
            state === "listening" && "orb-listening",
            state === "thinking" && "orb-thinking",
            state === "speaking" && "orb-speaking",
          ].filter(Boolean).join(" ")}
          style={state === "listening" ? { transform: `scale(${scale})` } : undefined}
        />
      </button>
      {inputError ? (
        <button type="button" className="voice-pause" onClick={onRetry}>
          Retry microphone
        </button>
      ) : (
        <button
          type="button"
          className="voice-pause"
          onClick={onPause}
          disabled={paused}
          aria-label="Pause voice"
          title="Pause voice (Escape)"
        >
          <span aria-hidden>Ⅱ</span> Pause
        </button>
      )}
    </div>
  );
}
