import { createHash } from 'node:crypto';
import type { StudentProfile, CoursePack, CourseDocument } from '@/lib/types';
import { getJson, putJson } from '@/lib/storage/private';
import { chunkSourceRecord } from './chunk';
import { retrieveStudentContext } from './retrieve';
import type { TurnContext } from '@/lib/agent/context';

const key = (id: string) => createHash('sha256').update(id).digest('hex');
const profilePath = (owner: string) => `${owner}/profile.json`;
const packPath = (owner: string, id: string) => `${owner}/courses/${key(id)}.json`;
export const readProfile = (owner: string) => getJson<StudentProfile>(profilePath(owner));
export const readPack = (owner: string, id: string) => getJson<CoursePack>(packPath(owner, id));
export function text(value: unknown, max = 300): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid or oversized text field.');
  return value.trim();
}
export async function saveProfile(owner: string, input: unknown) {
  const data = input as Partial<StudentProfile>;
  if (!data || !Array.isArray(data.courses) || data.courses.length > 100) throw new Error('Expected a student profile with courses.');
  const profile: StudentProfile = { userId: owner, name: text(data.name), email: text(data.email), term: text(data.term), source: 'grokbot', refreshedAt: new Date().toISOString(), courses: data.courses.map(course => {
    if (!Array.isArray(course.assignments) || course.assignments.length > 300) throw new Error('Invalid assignment list.');
    return { courseId: text(course.courseId), courseName: text(course.courseName), code: text(course.code),
      ...(course.instructor ? { instructor: text(course.instructor) } : {}), ...(course.meetingTimes ? { meetingTimes: text(course.meetingTimes) } : {}), packStatus: 'none',
      assignments: course.assignments.map(a => ({ id: text(a.id), title: text(a.title), kind: ['pset', 'exam', 'reading', 'other'].includes(a.kind) ? a.kind : 'other', ...(a.dueAt ? { dueAt: text(a.dueAt) } : {}) })) };
  }) };
  if (profile.courses.some(c => !c.courseId || !c.courseName) || new Set(profile.courses.map(c => c.courseId)).size !== profile.courses.length) throw new Error('Each course needs a unique Canvas ID and name.');
  await putJson(profilePath(owner), profile); return profile;
}
export type CollectedDocument = { courseId: string; courseName: string; term: string; documentId: string; title: string; kind: CourseDocument['kind']; sourceUrl: string; pages: { page: number; text: string }[]; isSolution?: boolean };
export async function saveCollectedDocument(owner: string, input: unknown) {
  const data = input as CollectedDocument;
  if (!data || !['syllabus','lecture','pset','solution','exam_review','other'].includes(data.kind) || !Array.isArray(data.pages) || data.pages.length > 500) throw new Error('Invalid course document.');
  const courseId = text(data.courseId), profile = await readProfile(owner);
  const course = profile?.courses.find(c => c.courseId === courseId);
  if (!course) throw new Error('Send the course profile before its materials.');
  const id = text(data.documentId), title = text(data.title), sourceUrl = text(data.sourceUrl, 1500);
  if (!id || !title || !/^https:\/\//.test(sourceUrl)) throw new Error('Document ID, title, and source URL are required.');
  const kind = data.isSolution || /solution|answer[ _-]?key/i.test(`${title} ${sourceUrl}`) ? 'solution' : data.kind;
  if (data.pages.some(p => !Number.isInteger(p.page) || p.page < 0 || p.page > 5000)) throw new Error('Page numbers must be zero-based integers.');
  const document: CourseDocument = { id, kind, title, storagePath: sourceUrl, chunks: data.pages.flatMap(p => chunkSourceRecord({ courseId, documentId: id, documentKind: kind, documentTitle: title, storagePath: sourceUrl, page: p.page, text: text(p.text, 100_000), isSolution: kind === 'solution' }).map(record => record.chunk)) };
  const previous = await readPack(owner, courseId);
  const pack: CoursePack = previous ?? { courseId, courseName: course.courseName, term: text(data.term), source: 'grokbot', policies: { collaboration: '', aiUse: '', late: '' }, documents: [] };
  pack.documents = [...pack.documents.filter(d => d.id !== id), document];
  if (pack.documents.length > 200) throw new Error('Course document limit reached.');
  await putJson(packPath(owner, courseId), pack);
  return { id, kind, chunks: document.chunks.length };
}
export async function studentCourseContext(owner: string | null, courseId: string | null, query: string): Promise<TurnContext> {
  if (!owner) return {};
  const profile = await readProfile(owner);
  if (!profile) return {};
  const course = profile.courses.find(c => c.courseId === courseId);
  const pack = course ? await readPack(owner, course.courseId) : null;
  const index = pack?.documents.flatMap(d => d.chunks.map(chunk => ({ courseId: pack.courseId, documentKind: d.kind, documentTitle: d.title, storagePath: d.storagePath, chunk }))) ?? [];
  const sources = course ? retrieveStudentContext(index, { courseId: course.courseId, query, limit: 5 }) : [];
  return { studentName: profile.name || 'unknown', courseCodes: profile.courses.map(c => `${c.code} (${c.courseName})`), courseName: course?.courseName, term: pack?.term,
    courseCatalog: profile.courses.map(c => ({ courseId: c.courseId, code: c.code, name: c.courseName })), assignments: course?.assignments.slice(0, 40).map(a => ({ title: a.title, dueAt: a.dueAt })),
    retrievedSources: sources.map(s => ({ title: s.documentTitle, page: s.page })),
    retrieved: sources.map(source => `${source.documentTitle}${source.page !== undefined ? `, page ${source.page + 1}` : ''}:\n${source.text}`).join('\n\n'),
  };
}
