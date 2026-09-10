// Shared contracts. Change only by editing docs/ARCHITECTURE.md and this
// file in the same PR. Lanes consume these types; they do not invent shapes.

export type StudentProfile = {
  userId: string;
  name: string;
  email: string;
  term: string;
  courses: EnrolledCourse[];
  source: "grokbot" | "canvas_api" | "manual";
  refreshedAt: string;
};

export type EnrolledCourse = {
  courseId: string;
  courseName: string;
  code: string;
  instructor?: string;
  meetingTimes?: string;
  assignments: Assignment[];
  packStatus: "none" | "collecting" | "ready";
};

export type Assignment = {
  id: string;
  title: string;
  dueAt?: string;
  kind: "pset" | "exam" | "reading" | "other";
  fileStoragePath?: string;
};

export type CoursePack = {
  courseId: string;
  courseName: string;
  term: string;
  source: "grokbot" | "canvas_api" | "manual";
  documents: CourseDocument[];
  policies: {
    collaboration: string;
    aiUse: string;
    late: string;
  };
};

export type CourseDocument = {
  id: string;
  kind:
    | "syllabus"
    | "lecture"
    | "pset"
    | "solution"
    | "exam_review"
    | "other";
  title: string;
  order?: number;
  storagePath: string;
  chunks: Chunk[];
};

export type Chunk = {
  id: string;
  documentId: string;
  text: string;
  page?: number;
  embedding: number[];
  isSolution: boolean;
};

export type Pset = {
  id: string;
  courseId: string;
  title: string;
  dueAt?: string;
  pages: PsetPage[];
  fullText: string;
};

export type PsetPage = {
  index: number;
  width: number;
  height: number;
  imageUrl: string;
  text: string;
  questionRegions: { label: string; bbox: BBox }[];
};

export type BBox = { x: number; y: number; w: number; h: number };

export type StudentAnnotation = {
  page: number;
  bbox: BBox;
  kind: "circle" | "underline" | "scribble";
  at: string;
};

export type Pt = { x: number; y: number };
export type Color = "ink" | "accent" | "muted" | "warn";

export type DrawCommand =
  | { op: "clear" }
  | { op: "axes"; id: string; origin: Pt; xLabel?: string; yLabel?: string }
  | {
      op: "arrow";
      id: string;
      from: Pt;
      to: Pt;
      label?: string;
      color?: Color;
    }
  | {
      op: "line";
      id: string;
      from: Pt;
      to: Pt;
      dashed?: boolean;
      color?: Color;
    }
  | {
      op: "curve";
      id: string;
      points: Pt[];
      label?: string;
      color?: Color;
    }
  | { op: "circle"; id: string; center: Pt; r: number; label?: string }
  | { op: "text"; id: string; at: Pt; text: string; size?: "s" | "m" }
  | { op: "highlight"; id: string }
  | { op: "remove"; id: string };

export type Follow = { follow: { pathId: string; offset?: Pt } };

export type Keyframe<T> = { t: number; ease?: "linear" | "inOut" | "out" } & T;

export type AnimShape =
  | {
      kind: "arrow";
      id: string;
      keyframes: Keyframe<{
        from: Pt | Follow;
        to: Pt | Follow;
        opacity?: number;
        color?: Color;
      }>[];
      label?: string;
    }
  | {
      kind: "dot";
      id: string;
      keyframes: Keyframe<{
        at: Pt | Follow;
        r?: number;
        opacity?: number;
      }>[];
      label?: string;
    }
  | {
      kind: "path";
      id: string;
      points: Pt[];
      keyframes: Keyframe<{ drawn: number; opacity?: number }>[];
      label?: string;
    }
  | {
      kind: "text";
      id: string;
      text: string;
      keyframes: Keyframe<{ at: Pt; opacity?: number }>[];
    }
  | {
      kind: "axes";
      id: string;
      origin: Pt;
      xLabel?: string;
      yLabel?: string;
      keyframes?: Keyframe<{ opacity?: number }>[];
    }
  | {
      kind: "bar";
      id: string;
      keyframes: Keyframe<{
        at: Pt;
        w: number;
        h: number;
        opacity?: number;
      }>[];
      label?: string;
    };

export type AnimationSpec = {
  id: string;
  duration: number;
  shapes: AnimShape[];
  camera?: { keyframes: Keyframe<{ x: number; y: number; zoom: number }>[] };
};

export type AnimationProgram = {
  id: string;
  source: string;
  sliders?: { name: string; min: number; max: number; value: number }[];
};

export type BoardSnapshot = {
  imageUrl: string;
  studentShapesSince: string;
};

export type AgentTurn = {
  speech: string;
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
  board?: {
    open?: boolean;
    commands: DrawCommand[];
    animation?: AnimationSpec | AnimationProgram;
    animControl?: { focus?: string; resume?: boolean };
  };
  mode?: "pset" | "concept";
  recap?: boolean;
  think?: boolean;
};

export type Session = {
  id: string;
  userId: string;
  courseId: string;
  psetId?: string;
  mode: "pset" | "concept";
  startedAt: string;
  endedAt?: string;
  transcript: Turn[];
  hintState: Record<string, { rung: number; attempts: number }>;
  misconceptionsSeen: string[];
  stylePreset: "more_hints" | "balanced" | "fewer_hints";
  recap?: Recap;
};

export type Turn = { role: "student" | "tutor"; text: string; at: string };

export type Recap = {
  stuckOn: string;
  unlockedBy: string;
  reviewNext: { documentTitle: string; where: string };
  studentSummary: string;
  spokenText: string;
};

export type LayoutState = "orb_only" | "pset" | "concept";
