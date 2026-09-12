import { courseOwner } from '@/lib/context/ownership';
import { readProfile, readPack } from '@/lib/context/catalog';
export const dynamic = 'force-dynamic';
export async function GET() {
  const owner = await courseOwner();
  const profile = owner ? await readProfile(owner) : null;
  if (!profile || !owner) return Response.json({ courses: [] });
  const courses = await Promise.all(profile.courses.map(async course => {
    const pack = await readPack(owner, course.courseId);
    const documents = pack?.documents.filter(d => d.kind !== 'solution' && !d.chunks.some(c => c.isSolution)).map(d => ({ id: d.id, title: d.title, kind: d.kind, sourceUrl: d.storagePath, pages: new Set(d.chunks.map(c => c.page)).size })) ?? [];
    return { ...course, packStatus: documents.length ? 'ready' : 'none', documents };
  }));
  return Response.json({ name: profile.name, refreshedAt: profile.refreshedAt, courses }, { headers: { 'Cache-Control': 'private, no-store' } });
}
