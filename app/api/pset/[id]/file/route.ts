import { cloudStorageConfigured, signedDownload } from "@/lib/storage/private";
import { courseOwner } from "@/lib/context/ownership";
import { readPsetPdf } from "@/lib/pdf/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const owner = await courseOwner();
    if (cloudStorageConfigured()) {
      const url = owner ? await signedDownload(`${owner}/psets/${id}/source.pdf`) : null;
      if (!url) return Response.json({ error: 'Not found' }, { status: 404 });
      return new Response(null, { status: 307, headers: { Location: url, 'Cache-Control': 'private, no-store' } });
    }
    const pdf = await readPsetPdf(id, owner);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
