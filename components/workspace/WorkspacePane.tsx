"use client";

import { useState } from "react";
import type { BBox } from "@/lib/types";
import { DropZone } from "./DropZone";
import { PdfViewer } from "./PdfViewer";
import "./workspace.css";

export function WorkspacePane({
  pointer,
  highlight,
  onPsetReady,
}: {
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
  onPsetReady?: (info: { title: string; pages: number }) => void;
}) {
  const [pset, setPset] = useState<{
    id: string;
    title: string;
    fileUrl: string;
  } | null>(null);

  if (!pset) {
    return <DropZone onUploaded={setPset} />;
  }

  return (
    <div className="desk">
      <PdfViewer
        psetId={pset.id}
        title={pset.title}
        fileUrl={pset.fileUrl}
        pointer={pointer}
        highlight={highlight}
        onReady={onPsetReady}
      />
    </div>
  );
}
