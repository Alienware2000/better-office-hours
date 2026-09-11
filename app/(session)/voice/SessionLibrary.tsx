"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { deleteSession, downloadSession, newSession, readSession, readSessions, selectSession, sessionTitle, writeSession, type SavedSession } from './saved-sessions';

export type SessionPersistence = {
  saved: SavedSession;
  onSave: (session: SavedSession) => void;
  bindCapture: (capture: () => SavedSession) => void;
  bindSuspend: (suspend: () => void) => void;
  onNew: () => void;
  onExport: (format: 'txt' | 'json') => void;
};

export function SessionLibrary({ Desk }: { Desk: ComponentType<SessionPersistence> }) {
  const [initial, setInitial] = useState<SavedSession | null>(null);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('Opening saved sessions');
  const [failure, setFailure] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const current = useRef<SavedSession | null>(null);
  const capture = useRef<(() => SavedSession) | null>(null);
  const suspend = useRef<(() => void) | null>(null);
  const pending = useRef(Promise.resolve());
  const revision = useRef(0);
  const savedVersions = useRef(new Map<string, string>());
  const dialog = useRef<HTMLElement>(null);
  const entry = useRef<HTMLButtonElement>(null);
  const failed = (error: unknown) => setFailure(error instanceof Error ? error.message : 'Could not save this session. Export a copy before leaving.');
  useEffect(() => {
    if (open) dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);
  const closeLibrary = () => { setOpen(false); entry.current?.focus(); };

  useEffect(() => {
    let cancelled = false;
    void readSessions().then(async result => {
      const active = result.sessions.find(s => s.id === result.active) ?? result.sessions[0] ?? newSession();
      if (cancelled) return;
      savedVersions.current = new Map(result.sessions.map(session => [session.id, session.updatedAt]));
      current.current = active;
      setSessions(result.sessions); setInitial(active); setRename(active.title);
      setStatus('Saved in this browser');
      await selectSession(active.id);
    }).catch(error => {
      if (cancelled) return;
      failed(error);
      const fresh = newSession();
      current.current = fresh; setInitial(fresh);
      setStatus('Not saved');
    });
    return () => { cancelled = true; };
  }, []);

  const onSave = useCallback((session: SavedSession) => {
    // Ignore an unmounted desk's delayed render/effect.
    if (session.id !== current.current?.id) return;
    if (current.current.renamed) session = { ...session, title: current.current.title, renamed: true };
    session = { ...session, title: sessionTitle(session), updatedAt: new Date(Math.max(Date.now(), Date.parse(current.current.updatedAt) + 1)).toISOString() };
    current.current = session;
    const version = ++revision.current;
    setStatus('Saving');
    pending.current = pending.current.catch(() => {}).then(async () => {
      await writeSession(session, savedVersions.current.get(session.id) ?? null);
      savedVersions.current.set(session.id, session.updatedAt);
    });
    void pending.current.then(() => {
      setSessions(rows => [session, ...rows.filter(row => row.id !== session.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      if (version === revision.current) { setStatus('Saved in this browser'); setFailure(null); }
    }).catch(error => { failed(error); setStatus('Not saved'); });
  }, []);

  const bindCapture = useCallback((fn: () => SavedSession) => { capture.current = fn; }, []);
  const bindSuspend = useCallback((fn: () => void) => { suspend.current = fn; }, []);
  const latest = () => {
    const snapshot = capture.current?.() ?? current.current;
    return snapshot && { ...snapshot, title: current.current?.renamed ? current.current.title : sessionTitle(snapshot), renamed: current.current?.renamed };
  };
  const switchTo = async (next: SavedSession) => {
    if (switching) return;
    setSwitching(true);
    try {
      suspend.current?.();
      const previous = latest();
      if (previous) onSave(previous);
      await pending.current;
      if (savedVersions.current.has(next.id)) {
        const fresh = await readSession(next.id);
        if (!fresh) throw new Error('This session was deleted in another tab. Your current work is still open.');
        next = fresh;
      } else await writeSession(next, null);
      savedVersions.current.set(next.id, next.updatedAt);
      await selectSession(next.id);
      current.current = next; capture.current = null;
      setInitial(next); setRename(next.title); setOpen(false); setFailure(null);
    } catch (error) { failed(error); }
    finally { setSwitching(false); }
  };
  const onNew = () => { void switchTo(newSession()); };
  const onExport = (format: 'txt' | 'json') => {
    const snapshot = latest();
    if (snapshot) { onSave(snapshot); downloadSession(snapshot, format); }
  };

  return <>
    <div className="session-library-entry">
      <button ref={entry} type="button" onClick={() => { suspend.current?.(); setOpen(true); setRename(current.current?.title ?? ''); }}>Sessions</button>
      <span role="status">{failure ? 'Not saved' : status}</span>
    </div>
    {failure && <p className="session-save-error" role="alert">{failure} Your current work remains open. Export a copy.</p>}
    {initial ? <Desk key={initial.id} saved={initial} onSave={onSave} bindCapture={bindCapture} bindSuspend={bindSuspend} onNew={onNew} onExport={onExport} /> : <main className="session-shell" />}
    {open && <div className="session-library-scrim" onClick={closeLibrary}>
      <section ref={dialog} className="session-library" role="dialog" aria-modal="true" aria-label="Saved sessions" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); closeLibrary(); }
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input'));
          const next = event.shiftKey ? controls.at(-1) : controls[0];
          if ((event.shiftKey && document.activeElement === controls[0]) || (!event.shiftKey && document.activeElement === controls.at(-1))) { event.preventDefault(); next?.focus(); }
        }
      }}>
        <header><h2>Your sessions</h2><button type="button" onClick={closeLibrary} aria-label="Close saved sessions">×</button></header>
        <p>Keep a separate desk for each piece of work. Saved in this browser.</p>
        <button className="session-new" type="button" disabled={switching} onClick={onNew}>+ New session</button>
        <form onSubmit={event => {
          event.preventDefault();
          const snapshot = latest();
          if (snapshot && rename.trim()) {
            current.current = { ...snapshot, title: rename.trim().slice(0, 80), renamed: true };
            onSave(current.current);
          }
        }}>
          <label htmlFor="session-name">Current session</label>
          <div><input id="session-name" value={rename} maxLength={80} onChange={event => setRename(event.target.value)} /><button type="submit">Rename</button></div>
        </form>
        <div className="session-export-actions"><button type="button" onClick={() => onExport('txt')}>Export transcript</button><button type="button" onClick={() => onExport('json')}>Export session JSON</button></div>
        <ul>{sessions.map(session => <li key={session.id}>
          <button type="button" disabled={switching} aria-current={session.id === initial?.id ? 'true' : undefined} onClick={() => {
            if (session.id === initial?.id) setOpen(false); else void switchTo(session);
          }}><strong>{session.title}</strong><span>{new Date(session.updatedAt).toLocaleString()} {session.id === initial?.id ? '· Current' : ''}</span></button>
          {session.id !== initial?.id && (deleting === session.id ? <div className="session-delete-confirm">Delete this saved session?<button type="button" onClick={() => {
            void deleteSession(session.id).then(() => { setSessions(rows => rows.filter(row => row.id !== session.id)); setDeleting(null); }).catch(failed);
          }}>Delete</button><button type="button" onClick={() => setDeleting(null)}>Keep</button></div> : <button className="session-delete" type="button" aria-label={`Delete ${session.title}`} onClick={() => setDeleting(session.id)}>Delete</button>)}
        </li>)}</ul>
        <p className="session-storage-note">Clearing browser data removes these saves. Uploaded PDFs currently live on this demo server. Export JSON includes conversations, board pages, ink, and timing records, but no audio or PDF files.</p>
      </section>
    </div>}
  </>;
}
