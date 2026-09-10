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
    const pdf = await readPsetPdf(id);
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
