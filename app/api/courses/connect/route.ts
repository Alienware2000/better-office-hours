import { courseOwner, collectorToken, sameOrigin } from '@/lib/context/ownership';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: 'Use the Canvas connection in this app.' }, { status: 403 });
  try {
    const owner = await courseOwner(true);
    const token = collectorToken(owner!);
    return Response.json({ token, ingestUrl: `${new URL(req.url).origin}/api/ingest`, expiresIn: 7200 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Could not connect.' }, { status: 503 }); }
}
