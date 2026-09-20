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
  inputStarting = false,
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
  inputStarting?: boolean;
  inputError?: boolean;
  onRetry: () => void;
}) {
  const scale = 1 + Math.min(0.22, level * 0.45);
  const responding = !paused && (state === 'thinking' || state === 'speaking');
  const canStart = paused || state === 'idle';
  const label = canStart
    ? "Tap to speak"
    : recording
      ? "Done speaking"
      : state === "speaking" || state === "thinking"
        ? "Tutor is responding"
        : "Listening";

  return (
    <div className="voice-controls">
      <button
        type="button"
        className="orb-control"
        aria-label={label}
        title={recording ? 'Done speaking: tap to send now, or pause for three seconds' : canStart ? 'Start listening. The microphone reopens after each response' : label}
        onClick={onInterrupt}
        disabled={inputStarting || inputError}
        aria-disabled={inputStarting || inputError || (inputReady && !canStart && !recording)}
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
        {canStart && !inputStarting && !inputError && <span className="orb-action" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg>
          Tap to speak
        </span>}
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
          disabled={canStart}
          aria-label={responding ? 'Interrupt tutor and speak' : 'Pause microphone'}
          title={responding ? 'Interrupt and speak (Escape)' : 'Pause microphone (Escape)'}
        >
          <span aria-hidden>Ⅱ</span> {responding ? 'Interrupt' : 'Pause'}
        </button>
      )}
    </div>
  );
}
