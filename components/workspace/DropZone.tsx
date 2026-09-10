"use client";

import { useCallback, useState } from "react";
import "./workspace.css";

export function DropZone({
  onUploaded,
}: {
  onUploaded: (pset: { id: string; title: string; fileUrl: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const send = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/pset/upload", {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Upload failed");
        }
        const pset = (await response.json()) as {
          id: string;
          title: string;
          fileUrl: string;
        };
        onUploaded(pset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [onUploaded],
  );

  return (
    <div className="desk">
      <label
        className={["paper", busy ? "is-busy" : "", over ? "is-over" : ""]
          .filter(Boolean)
          .join(" ")}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void send(event.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => void send(event.target.files?.[0])}
        />
        <span className="paper-rule" />
        <p className="paper-copy">
          {busy ? "Opening the problem set." : "Drop the pset PDF here."}
        </p>
        {error ? <p className="paper-error">{error}</p> : null}
      </label>
    </div>
  );
}
