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
        title={recording ? 'Done speaking: tap to send now, or pause for three seconds' : canStart ? 'Open the microphone for your next turn' : label}
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
