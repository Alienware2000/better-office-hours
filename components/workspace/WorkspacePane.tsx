"use client";

import type { BBox } from "@/lib/types";
import { DropZone } from "./DropZone";
import { LeaveButton } from "./LeaveButton";
import { PdfViewer } from "./PdfViewer";
import "./workspace.css";

export type LoadedPset = { id: string; title: string; fileUrl: string };

export function WorkspacePane({
  pset,
  onPsetChange,
  pointer,
  highlight,
  active = true,
  onPsetReady,
  onExit,
  onRemove,
}: {
  // Held by the session rather than here, so closing the workspace and coming
  // back does not lose the student's upload.
  pset: LoadedPset | null;
  onPsetChange: (pset: LoadedPset) => void;
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
  // Parked desks stay mounted so the PDF does not reload, but they must not
  // keep publishing the page to the tutor.
  active?: boolean;
  onPsetReady?: (info: { title: string; pages: number }) => void;
  onExit?: () => void;
  onRemove?: () => void;
}) {
  if (!pset) {
    return (
      <div className="desk">
        {onExit ? (
          <div className="pdf-bar">
            <LeaveButton onLeave={onExit} />
          </div>
        ) : null}
        <DropZone onUploaded={onPsetChange} />
      </div>
    );
  }

  return (
    <div className="desk">
      <PdfViewer
        key={pset.id}
        psetId={pset.id}
        title={pset.title}
        fileUrl={pset.fileUrl}
        pointer={pointer}
        highlight={highlight}
        active={active}
        onReady={onPsetReady}
        onExit={onExit}
        onRemove={onRemove}
      />
    </div>
  );
}
