import { collectorOwner } from '@/lib/context/ownership';
import { saveCollectedDocument } from '@/lib/context/catalog';
export const maxDuration = 60;
export async function POST(req: Request) {
  const owner = collectorOwner(req.headers.get('authorization'));
  if (!owner) return Response.json({ error: 'Invalid or expired collector connection.' }, { status: 401 });
  try {
    const raw = await req.text(); if (raw.length > 3_000_000) throw new Error('Split this document into smaller source documents.');
    const document = await saveCollectedDocument(owner, JSON.parse(raw));
    return Response.json({ ok: true, document });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid document.' }, { status: 400 }); }
}
