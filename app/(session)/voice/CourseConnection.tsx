'use client';
import { RecapCard } from '@/components/recap';
import type { Recap } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Course = { courseId: string; courseName: string; code: string; packStatus: string; documents: { id: string; title: string; pages: number }[] };
export function CourseConnection({ selected, onSelect, onOpen, recap, headerActions }: { headerActions?: HTMLElement | null; recap?: Recap | null; selected?: string; onSelect: (id?: string) => void; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const recapDialog = useRef<HTMLDialogElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<{ token: string; ingestUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try { const response = await fetch('/api/courses'); if (!response.ok) throw new Error('Could not load course materials.'); const data = await response.json(); if (!cancelled) setCourses(data.courses); }
      catch { if (!cancelled && open) setError('Could not load courses. Your conversation is still here.'); }
    };
    void refresh();
    const timer = open ? setInterval(() => void refresh(), 5000) : null;
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [open, selected]);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  useEffect(() => { if (showRecap) recapDialog.current?.showModal(); else recapDialog.current?.close(); }, [showRecap]);
  const current = courses.find(c => c.courseId === selected);
  async function connect() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/courses/connect', { method: 'POST' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setConnection(data); setCopied(false);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not connect.'); }
    finally { setBusy(false); }
  }
  const task = connection ? `Connect Course Pack Collector to Better Office Hours. Use these connection details only to upload my Canvas profile and course text, never share them publicly. Connection expires in two hours. Ingestion URL: ${connection.ingestUrl}. Authorization: Bearer ${connection.token}.
First POST JSON to ${connection.ingestUrl}/profile: {name,email,term,courses:[{courseId,courseName,code,instructor,meetingTimes,assignments:[{id,title,kind,dueAt}]}]}. Use actual Canvas IDs; kind is pset, exam, reading, or other. Optional unknown fields may be omitted; name/email/term/code can be empty if unavailable. Never invent details.
Then POST one JSON document at a time to ${connection.ingestUrl}: {courseId,courseName,term,documentId,title,kind,sourceUrl,pages:[{page:0,text:"actual extracted page text"}]}. Document kind is syllabus, lecture, pset, solution, exam_review, or other. Page numbers are zero-based. Extract text from downloaded PDFs using your tools and preserve page boundaries and source URLs. Never label a solution as a lecture. Put posted solutions in kind=solution and never quote them in your student-visible report. Upload actual text, not a summary or filesystem path. Keep each request under 3 MB and send documents sequentially. Do not send PDF bytes to this text endpoint.
Canvas is read-only. Do not collect grades, submissions, rosters, messages, or other students' information. Hand NetID/Duo authentication to me. List my courses and ask which course to collect first. Report successful uploads and inaccessible materials accurately.` : '';
  return <>
    {headerActions && createPortal(<div className="course-bar"><button type="button" className="course-entry" title={current ? `${current.courseName} · ${current.documents.length} sources` : 'Optional: bring your course materials with Grok Bot'} onClick={() => { onOpen(); setOpen(true); }}><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/></svg><span className="course-entry-label">{current ? current.code || current.courseName : 'Connect Canvas'}</span>{current && <span className="course-source-count">{current.documents.length} sources</span>}</button>{recap && <button type="button" className="course-takeaway" onClick={() => { onOpen(); setShowRecap(true); }}>Takeaway</button>}</div>, headerActions)}
    {recap && <dialog ref={recapDialog} className="course-dialog takeaway-dialog" aria-label="Your session takeaway" onCancel={() => setShowRecap(false)}><header><h2>Your session takeaway</h2><button type="button" aria-label="Close takeaway" onClick={() => setShowRecap(false)}>×</button></header><RecapCard recap={recap} /></dialog>}
    <dialog ref={dialog} className="course-dialog" onCancel={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      <header><div><small>Course context</small><h2>Your Canvas materials</h2></div><button type="button" aria-label="Close course materials" onClick={() => setOpen(false)}>×</button></header>
      <p>Bring your course materials with Grok Bot, so explanations follow your lectures. Sign in to Canvas in the bot’s browser.</p><p>Connecting is optional. You can always talk to the tutor or upload a PDF yourself.</p>
      {courses.length > 0 && <><label htmlFor="course-choice">Course for this conversation</label><select id="course-choice" value={selected ?? ''} onChange={e => onSelect(e.target.value || undefined)}><option value="">General office hours</option>{courses.map(c => <option key={c.courseId} value={c.courseId}>{c.code ? `${c.code} · ` : ''}{c.courseName}</option>)}</select>
        {current && <section className="course-sources"><h3>{current.documents.length ? 'Available to your tutor' : 'Waiting for course materials'}</h3><ul>{current.documents.map(d => <li key={d.id}>{d.title}<small>{d.pages} pages</small></li>)}</ul></section>}</>}
      <button type="button" className="course-connect" disabled={busy} onClick={() => void connect()}>{busy ? 'Preparing connection' : connection ? 'Renew connection' : courses.length ? 'Collect more materials' : 'Connect Course Pack Collector'}</button>
      {connection && <div className="course-instructions"><p>Copy this connection task into Course Pack Collector in Grok Bot. Finish Yale sign-in in its computer. This window updates as materials arrive.</p><button type="button" onClick={() => void navigator.clipboard.writeText(task).then(() => setCopied(true)).catch(() => setError('Clipboard is unavailable. Select and copy the connection task below.'))}>{copied ? 'Copied' : 'Copy connection task'}</button><details><summary>Connection task</summary><textarea readOnly aria-label="Collector connection task" value={task} /></details></div>}
      {error && <p role="alert">{error}</p>}
      <p className="course-privacy">Only your courses and materials. No grades or other students’ information. Posted solutions stay out of the tutor’s retrieved sources.</p>
    </dialog>
  </>;
}
