import { collectorOwner } from '@/lib/context/ownership';
import { saveProfile } from '@/lib/context/catalog';
export async function POST(req: Request) {
  const owner = collectorOwner(req.headers.get('authorization'));
  if (!owner) return Response.json({ error: 'Invalid or expired collector connection.' }, { status: 401 });
  try {
    const raw = await req.text(); if (raw.length > 1_000_000) throw new Error('Profile is too large.');
    const profile = await saveProfile(owner, JSON.parse(raw));
    return Response.json({ ok: true, courses: profile.courses.length });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid profile.' }, { status: 400 }); }
}
