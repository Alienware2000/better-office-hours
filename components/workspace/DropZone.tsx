"use client";

import { useCallback, useState } from "react";
import "./workspace.css";

export function DropZone({
  onUploaded,
  kind = "pset",
}: {
  kind?: "pset" | "notes";
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
        if (file.size > 20 * 1024 * 1024) throw new Error('Choose a PDF under 20 MB.');
        const header = new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer());
        if (!header.includes('%PDF-')) throw new Error('Choose a valid PDF.');
        const ticket = await fetch('/api/pset/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, size: file.size }) });
        const prepared = await ticket.json();
        if (!ticket.ok) throw new Error(prepared.error || 'Could not prepare PDF upload.');
        if (prepared.direct) {
          const uploaded = await fetch(prepared.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
          if (!uploaded.ok) throw new Error('PDF upload failed. Please try again.');
          onUploaded({ id: prepared.id, title: prepared.title, fileUrl: prepared.fileUrl });
          return;
        }
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
        {busy ? "Opening the PDF." : kind === "notes" ? "Drop your notes PDF here" : "Drop the pset PDF here"}
      </p>
      {busy ? null : <p className="paper-hint">or click to choose a file</p>}
      {error ? <p className="paper-error">{error}</p> : null}
    </label>
  );
}
