'use client';
import { RecapCard } from '@/components/recap';
import type { Recap } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

type Course = { courseId: string; courseName: string; code: string; packStatus: string; documents: { id: string; title: string; pages: number }[] };
export function CourseConnection({ selected, onSelect, onOpen, recap }: { recap?: Recap | null; selected?: string; onSelect: (id?: string) => void; onOpen: () => void }) {
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
    <div className="course-bar"><button type="button" onClick={() => { onOpen(); setOpen(true); }}>{current ? current.code || current.courseName : 'Connect Canvas'}<span>{current ? `${current.documents.length} sources` : 'Bring your course materials'}</span></button>{recap && <button type="button" onClick={() => { onOpen(); setShowRecap(true); }}>Session takeaway</button>}</div>
    {recap && <dialog ref={recapDialog} className="course-dialog takeaway-dialog" aria-label="Your session takeaway" onCancel={() => setShowRecap(false)}><header><h2>Your session takeaway</h2><button type="button" aria-label="Close takeaway" onClick={() => setShowRecap(false)}>×</button></header><RecapCard recap={recap} /></dialog>}
    <dialog ref={dialog} className="course-dialog" onCancel={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      <header><div><small>Course context</small><h2>Your Canvas materials</h2></div><button type="button" aria-label="Close course materials" onClick={() => setOpen(false)}>×</button></header>
      <p>Grok Bot reads your Canvas after you sign in with Yale. Your materials help the tutor explain things in the context of your course.</p>
      {courses.length > 0 && <><label htmlFor="course-choice">Course for this conversation</label><select id="course-choice" value={selected ?? ''} onChange={e => onSelect(e.target.value || undefined)}><option value="">General office hours</option>{courses.map(c => <option key={c.courseId} value={c.courseId}>{c.code ? `${c.code} · ` : ''}{c.courseName}</option>)}</select>
        {current && <section className="course-sources"><h3>{current.documents.length ? 'Available to your tutor' : 'Waiting for course materials'}</h3><ul>{current.documents.map(d => <li key={d.id}>{d.title}<small>{d.pages} pages</small></li>)}</ul></section>}</>}
      <button type="button" className="course-connect" disabled={busy} onClick={() => void connect()}>{busy ? 'Preparing connection' : connection ? 'Renew connection' : courses.length ? 'Collect more materials' : 'Connect Course Pack Collector'}</button>
      {connection && <div className="course-instructions"><p>Copy this connection task into Course Pack Collector in Grok Bot. Finish Yale sign-in in its computer. This window updates as materials arrive.</p><button type="button" onClick={() => void navigator.clipboard.writeText(task).then(() => setCopied(true)).catch(() => setError('Clipboard is unavailable. Select and copy the connection task below.'))}>{copied ? 'Copied' : 'Copy connection task'}</button><details><summary>Connection task</summary><textarea readOnly aria-label="Collector connection task" value={task} /></details></div>}
      {error && <p role="alert">{error}</p>}
      <p className="course-privacy">Only your courses and materials. No grades or other students’ information. Posted solutions stay out of the tutor’s retrieved sources.</p>
    </dialog>
  </>;
}
