import type { LoadedPset } from '@/components/workspace/WorkspacePane';
import type { PdfViewState } from '@/lib/pdf/view-state';
import type { VoiceArchive } from './useVoiceLoop';
import type { Turn } from '@/lib/types';

export type SessionDiagnostic = { at: string; kind: string; request?: string | null; deep?: boolean; elapsedMs?: number; page?: number; groups?: number; animation?: boolean; message?: string };
export type SavedSession = {
  courseId?: string;
  version: 1;
  id: string;
  title: string;
  renamed?: boolean;
  createdAt: string;
  updatedAt: string;
  voice: VoiceArchive | null;
  pset: LoadedPset | null;
  notes: LoadedPset | null;
  documentViews: { pset: boolean; concept: boolean };
  pdf: Record<string, PdfViewState>;
  diagnostics: SessionDiagnostic[];
};

export function newSession(): SavedSession {
  const at = new Date().toISOString();
  return { version: 1, id: crypto.randomUUID(), title: 'New session', createdAt: at, updatedAt: at,
    voice: null, pset: null, notes: null, documentViews: { pset: true, concept: false }, pdf: {}, diagnostics: [] };
}

export function hasSessionContent(session: SavedSession): boolean {
  const works = [session.voice?.current, session.voice?.parked.pset, session.voice?.parked.concept];
  return Boolean(session.pset || session.notes || session.voice?.kind !== undefined && session.voice.kind !== 'lobby' ||
    works.some(work => work && (work.turns.some(turn => turn.role === 'student') || work.board.student.length ||
      work.board.groups.some(group => group.id !== 'topic') || work.board.earlierPages.length)));
}

// Older saves could park the only conversation behind a blank lobby. Resume
// the most recent desk without erasing any other parked work.
export function sessionForResume(session: SavedSession): SavedSession {
  const voice = session.voice;
  if (!voice || voice.kind !== 'lobby' || voice.current.turns.some(turn => turn.role === 'student')) return session;
  const kind = (['pset', 'concept'] as const).filter(key => voice.parked[key]).sort((a, b) =>
    (voice.parked[b]?.turns.at(-1)?.at ?? '').localeCompare(voice.parked[a]?.turns.at(-1)?.at ?? ''))[0];
  return kind ? { ...session, voice: { ...voice, kind, current: voice.parked[kind]! } } : session;
}

export function sessionTitle(session: SavedSession): string {
  if (session.renamed) return session.title;
  const work = session.voice?.current;
  const boards = [...(work?.board.earlierPages ?? []), work?.board];
  const topic = boards.flatMap(board => board?.groups ?? []).find(g => g.id === 'topic' || g.id.startsWith('topic-'))?.drawables.find(d => d.kind === 'text');
  const firstQuestion = allTranscript(session).find(t => t.role === 'student' && !['Homework', 'Explain a concept', 'Something else'].includes(t.text))?.text;
  // Reuse conversation/board content; no extra model request delays the tutor.
  const opening = firstQuestion?.replace(/^(?:(?:um|uh|okay|ok|well)[,.]?\s+)+/i, '')
    .replace(/^(?:can|could|would) you (?:please )?/i, '').replace(/^please /i, '').replace(/[.!?]+$/, '');
  const candidate = (topic?.kind === 'text' ? topic.text : '') || opening || session.pset?.title || session.notes?.title;
  if (candidate) {
    const title = candidate.split(/\s+/).slice(0, 10).join(' ').slice(0, 70);
    return title.charAt(0).toUpperCase() + title.slice(1);
  }
  return session.voice?.kind === 'pset' ? 'Homework conversation' : session.voice?.kind === 'concept' ? 'Concept conversation' : 'New conversation';
}

// Parked desks can contain earlier exchanges. Keep their timestamps and role,
// and deduplicate copies that were parked then resumed.
export function allTranscript(session: SavedSession): Turn[] {
  const voice = session.voice;
  const seen = new Set<string>();
  return [voice?.current, voice?.parked.pset, voice?.parked.concept]
    .flatMap(work => work?.turns ?? []).filter(turn => {
      const key = `${turn.at}:${turn.role}:${turn.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.at.localeCompare(b.at));
}

export function exportSession(session: SavedSession, format: 'txt' | 'json') {
  const text = format === 'json' ? JSON.stringify({ ...session, exportedAt: new Date().toISOString(),
    transcript: allTranscript(session),
    exportNote: 'Local session data. Tutor captions start at sentence playback and are not word-aligned audio. PDF entries reference uploaded files; file bytes are not included. No microphone recordings or hidden course solutions are stored.',
  }, null, 2) : [
    'Better Office Hours', session.title, `Session: ${session.id}`, `Started: ${session.createdAt}`,
    'Transcript of captions, not an audio recording. An interrupted sentence may be incomplete in playback.', '',
    ...allTranscript(session).map(turn => `[${turn.at}] ${turn.role === 'tutor' ? 'Tutor' : 'You'}: ${turn.text}\n`),
  ].join('\n');
  return { text, filename: `office-hours-${session.createdAt.replace(/[:.]/g, '-')}-${session.id.slice(0, 8)}.${format}`,
    mime: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' };
}

export function downloadSession(session: SavedSession, format: 'txt' | 'json') {
  const { text, filename, mime } = exportSession(session, format);
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DB = 'better-office-hours-sessions';
const databases = new Map<string, Promise<IDBDatabase>>();
function openDatabase(owner = "guest"): Promise<IDBDatabase> {
  const dbName = owner === "guest" ? DB : `${DB}-${owner}`;
  const existing = databases.get(dbName);
  if (existing) return existing;
  const database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('sessions', { keyPath: 'id' });
      request.result.createObjectStore('meta');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); databases.delete(dbName); };
      resolve(request.result);
    };
    request.onerror = () => { databases.delete(dbName); reject(request.error); };
    request.onblocked = () => { databases.delete(dbName); reject(new Error('Session storage is busy in another tab.')); };
  });
  databases.set(dbName, database);
  return database;
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Session save was interrupted.'));
    tx.onerror = () => reject(tx.error);
  });
}

export async function readSessions(owner = "guest"): Promise<{ sessions: SavedSession[]; active: string | null }> {
  const db = await openDatabase(owner);
  const tx = db.transaction(['sessions', 'meta'], 'readonly');
  const rows = tx.objectStore('sessions').getAll();
  const active = tx.objectStore('meta').get('active');
  await transactionDone(tx);
  const sessions = rows.result as SavedSession[];
  if (sessions.some(s => s.version !== 1 || !s.id || !s.pdf || !Array.isArray(s.diagnostics))) {
    throw new Error('Some saved sessions need a newer version of the app. They have been kept.');
  }
  return { sessions: sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), active: active.result ?? null };
}

// Writes update one session, never replace the library with a stale full list.
// Switching uses a separate active-ID write so a late autosave cannot reopen
// the previous conversation after refresh.
export async function readSession(id: string, owner = "guest"): Promise<SavedSession | null> {
  const db = await openDatabase(owner);
  const tx = db.transaction('sessions', 'readonly');
  const row = tx.objectStore('sessions').get(id);
  await transactionDone(tx);
  return row.result ?? null;
}

export async function writeSession(session: SavedSession, expectedUpdatedAt: string | null, owner = "guest") {
  const db = await openDatabase(owner);
  const tx = db.transaction('sessions', 'readwrite');
  const rows = tx.objectStore('sessions');
  const previous = rows.get(session.id);
  let conflict = false;
  previous.onsuccess = () => {
    // A second tab must not silently replace a newer conversation or revive
    // a deleted session. Check and write inside the same atomic transaction.
    if ((previous.result?.updatedAt ?? null) !== expectedUpdatedAt) {
      conflict = true;
      tx.abort();
    } else rows.put(session);
  };
  try { await transactionDone(tx); }
  catch (error) {
    if (conflict) throw new Error('This session changed in another tab. Export this copy, then reload to open the saved version.');
    throw error;
  }
}

export async function selectSession(id: string, owner = "guest") {
  const db = await openDatabase(owner);
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put(id, 'active');
  await transactionDone(tx);
}

export async function deleteSession(id: string, owner = "guest") {
  const db = await openDatabase(owner);
  const tx = db.transaction('sessions', 'readwrite');
  tx.objectStore('sessions').delete(id);
  await transactionDone(tx);
}
