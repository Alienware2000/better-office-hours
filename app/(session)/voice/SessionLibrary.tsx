"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { allTranscript, deleteSession, downloadSession, hasSessionContent, newSession, readSession, readSessions, selectSession, sessionForResume, sessionTitle, writeSession, type SavedSession } from './saved-sessions';

export type SessionPersistence = {
  saved: SavedSession;
  onSave: (session: SavedSession) => void;
  bindCapture: (capture: () => SavedSession) => void;
  bindSuspend: (suspend: () => void) => void;
  onNew: () => void;
  onExport: (format: 'txt' | 'json') => void;
};
const signature = (session: SavedSession) => JSON.stringify({ ...session, updatedAt: undefined });
const preview = (session: SavedSession) => allTranscript(session).filter(turn => turn.role === 'student').at(-1)?.text ?? 'Your notes and drawings';
function dateGroup(at: string) {
  const date = new Date(at).toDateString();
  if (date === new Date().toDateString()) return 'Today';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return date === yesterday.toDateString() ? 'Yesterday' : 'Earlier';
}

export function SessionLibrary({ Desk }: { Desk: ComponentType<SessionPersistence> }) {
  const [initial, setInitial] = useState<SavedSession | null>(null);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('Opening sessions');
  const [title, setTitle] = useState('New conversation');
  const [failure, setFailure] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rename, setRename] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const switchLock = useRef(false);
  const current = useRef<SavedSession | null>(null);
  const capture = useRef<(() => SavedSession) | null>(null);
  const suspend = useRef<(() => void) | null>(null);
  const pending = useRef(Promise.resolve());
  const revision = useRef(0);
  const savedVersions = useRef(new Map<string, string>());
  const queued = useRef(new Map<string, string>());
  const dialog = useRef<HTMLElement>(null);
  const entry = useRef<HTMLButtonElement>(null);
  const failed = (error: unknown) => setFailure(error instanceof Error ? error.message : 'Could not save. Export a copy before leaving.');
  useEffect(() => { if (open) dialog.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [open]);
  const closeLibrary = () => { setOpen(false); setEditing(null); setDeleting(null); entry.current?.focus(); };

  useEffect(() => {
    let cancelled = false;
    void readSessions().then(result => {
      if (cancelled) return;
      // A selected blank draft must not reopen an unrelated older conversation.
      const active = sessionForResume(result.sessions.find(s => s.id === result.active) ?? newSession());
      savedVersions.current = new Map(result.sessions.map(s => [s.id, s.updatedAt]));
      queued.current = new Map(result.sessions.map(s => [s.id, signature(s)]));
      current.current = active;
      setSessions(result.sessions.filter(hasSessionContent)); setInitial(active); setTitle(sessionTitle(active));
      setStatus(hasSessionContent(active) ? 'Saved in this browser' : 'Starts saving when you begin');
    }).catch(error => {
      if (cancelled) return;
      failed(error);
      const fresh = newSession(); current.current = fresh; setInitial(fresh); setStatus('Not saved');
    });
    return () => { cancelled = true; };
  }, []);

  const onSave = useCallback((session: SavedSession) => {
    if (session.id !== current.current?.id) return;
    if (current.current.renamed) session = { ...session, title: current.current.title, renamed: true };
    session = { ...session, title: sessionTitle(session) };
    const previous = current.current;
    current.current = session; setTitle(session.title);
    if (!hasSessionContent(session)) { setStatus('Starts saving when you begin'); return; }
    const key = signature(session);
    if (queued.current.get(session.id) === key) return;
    queued.current.set(session.id, key);
    session = { ...session, updatedAt: new Date(Math.max(Date.now(), Date.parse(previous.updatedAt) + 1)).toISOString() };
    current.current = session;
    const version = ++revision.current;
    setStatus('Saving');
    pending.current = pending.current.catch(() => {}).then(async () => {
      const firstSave = !savedVersions.current.has(session.id);
      await writeSession(session, savedVersions.current.get(session.id) ?? null);
      savedVersions.current.set(session.id, session.updatedAt);
      if (firstSave && current.current?.id === session.id) await selectSession(session.id);
    });
    void pending.current.then(() => {
      setSessions(rows => [session, ...rows.filter(row => row.id !== session.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      if (version === revision.current) { setStatus('Saved in this browser'); setFailure(null); }
    }).catch(error => {
      if (queued.current.get(session.id) === key) queued.current.delete(session.id);
      failed(error); setStatus('Not saved');
    });
  }, []);

  const bindCapture = useCallback((fn: () => SavedSession) => { capture.current = fn; }, []);
  const bindSuspend = useCallback((fn: () => void) => { suspend.current = fn; }, []);
  const latest = () => {
    const snapshot = capture.current?.() ?? current.current;
    return snapshot && { ...snapshot, title: current.current?.renamed ? current.current.title : sessionTitle(snapshot), renamed: current.current?.renamed };
  };
  const switchTo = async (next: SavedSession) => {
    if (switchLock.current) return;
    switchLock.current = true; setSwitching(true);
    try {
      suspend.current?.();
      const previous = latest(); if (previous) onSave(previous);
      await pending.current;
      if (savedVersions.current.has(next.id)) {
        const fresh = await readSession(next.id);
        if (!fresh) throw new Error('This session was deleted in another tab. Your current work is still open.');
        next = sessionForResume(fresh); savedVersions.current.set(next.id, next.updatedAt); queued.current.set(next.id, signature(next));
      }
      await selectSession(next.id);
      current.current = next; capture.current = null;
      setInitial(next); setTitle(sessionTitle(next)); setStatus(hasSessionContent(next) ? 'Saved in this browser' : 'Starts saving when you begin');
      closeLibrary(); setFailure(null);
    } catch (error) { failed(error); }
    finally { switchLock.current = false; setSwitching(false); }
  };
  const onNew = () => { void switchTo(newSession()); };
  const onExport = (format: 'txt' | 'json') => { const snapshot = latest(); if (snapshot) { onSave(snapshot); downloadSession(snapshot, format); } };
  const exportRow = async (session: SavedSession, format: 'txt' | 'json') => {
    if (session.id === current.current?.id) { onExport(format); return; }
    try { const fresh = await readSession(session.id); if (fresh) downloadSession(fresh, format); }
    catch (error) { failed(error); }
  };
  const renameRow = async (session: SavedSession) => {
    if (!rename.trim()) return;
    try {
      if (session.id === current.current?.id) {
        const snapshot = latest(); if (!snapshot) return;
        current.current = { ...snapshot, title: rename.trim(), renamed: true }; onSave(current.current); await pending.current;
      } else {
        const fresh = await readSession(session.id); if (!fresh) return;
        const renamed = { ...fresh, title: rename.trim(), renamed: true, updatedAt: new Date(Math.max(Date.now(), Date.parse(fresh.updatedAt) + 1)).toISOString() };
        await writeSession(renamed, fresh.updatedAt); savedVersions.current.set(renamed.id, renamed.updatedAt); queued.current.set(renamed.id, signature(renamed));
        setSessions(rows => rows.map(row => row.id === renamed.id ? renamed : row));
      }
      setEditing(null);
    } catch (error) { failed(error); }
  };
  const visible = sessions.filter(session => `${session.title} ${preview(session)}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="session-app">
    <header className="session-header">
      <button ref={entry} className="session-history-button" type="button" aria-label="Sessions" aria-expanded={open} onClick={() => { suspend.current?.(); setOpen(true); }}>☰ <span>Sessions</span></button>
      <div className="session-current"><strong title={title}>{title}</strong><span role="status">{failure ? 'Not saved' : status}</span></div>
      <button className="session-new-button" type="button" disabled={switching} onClick={onNew}>+ New session</button>
    </header>
    {failure && <p className="session-save-error" role="alert">{failure} Your current work remains open. <button type="button" onClick={() => onExport('json')}>Export a copy</button></p>}
    <div className="session-desk">{initial ? <Desk key={initial.id} saved={initial} onSave={onSave} bindCapture={bindCapture} bindSuspend={bindSuspend} onNew={onNew} onExport={onExport} /> : <main className="session-shell" />}</div>
    {open && <div className="session-library-scrim" onClick={closeLibrary}>
      <section ref={dialog} className="session-library" role="dialog" aria-modal="true" aria-label="Saved sessions" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); closeLibrary(); }
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, summary')).filter(el => el.getClientRects().length);
          if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
          else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
        }
      }}>
        <header><h2>Your sessions</h2><button type="button" onClick={closeLibrary} aria-label="Close saved sessions">×</button></header>
        <p>Pick up where you left off, or start a new conversation.</p>
        <button className="session-new" type="button" disabled={switching} onClick={onNew}>+ New session</button>
        {sessions.length > 0 && <input className="session-search" aria-label="Find a session" placeholder="Find a session" value={search} onChange={event => setSearch(event.target.value)} />}
        {visible.length === 0 && <p className="session-empty">{search ? 'No matching sessions.' : 'Your conversations will appear here automatically when you begin.'}</p>}
        {['Today', 'Yesterday', 'Earlier'].map(group => {
          const rows = visible.filter(session => dateGroup(session.updatedAt) === group);
          return rows.length > 0 && <div className="session-date-group" key={group}><h3>{group}</h3><ul>{rows.map(session => <li key={session.id} aria-current={session.id === initial?.id ? 'true' : undefined}>
            <div className="session-row"><button className="session-resume" type="button" disabled={switching} onClick={() => session.id === initial?.id ? closeLibrary() : void switchTo(session)}>
              <strong>{session.title}</strong><span>{preview(session)}</span><small>{session.id === initial?.id ? 'Current session' : new Date(session.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>
            </button><details className="session-actions" name="session-options" onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.removeAttribute('open'); }}><summary aria-label={`Options for ${session.title}`}>•••</summary><div>
              <button type="button" onClick={() => { setEditing(session.id); setRename(session.title); }}>Rename</button>
              <button type="button" onClick={() => void exportRow(session, 'txt')}>Export transcript</button>
              <button type="button" onClick={() => void exportRow(session, 'json')}>Export session JSON</button>
              {session.id !== initial?.id && <button type="button" onClick={() => setDeleting(session.id)}>Delete</button>}
            </div></details></div>
            {editing === session.id && <form className="session-rename" onSubmit={event => { event.preventDefault(); void renameRow(session); }}><label htmlFor="session-name">Session name</label><div><input id="session-name" value={rename} maxLength={70} onChange={event => setRename(event.target.value)} autoFocus /><button type="submit">Save name</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div></form>}
            {deleting === session.id && <div className="session-delete-confirm">Delete this saved session?<button type="button" onClick={() => { void deleteSession(session.id).then(() => { setSessions(rows => rows.filter(row => row.id !== session.id)); setDeleting(null); }).catch(failed); }}>Delete session</button><button type="button" onClick={() => setDeleting(null)}>Keep</button></div>}
          </li>)}</ul></div>;
        })}
        <p className="session-storage-note">Saved in this browser. Export important conversations before clearing browser data. PDF files stay on the demo server.</p>
      </section>
    </div>}
  </div>;
}
