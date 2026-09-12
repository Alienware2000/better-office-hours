import { courseOwner, sameOrigin } from "@/lib/context/ownership";
import { cloudStorageConfigured } from "@/lib/storage/private";
import { preparePsetUpload, savePsetPdf } from "@/lib/pdf/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Open the upload in this app." }, { status: 403 });
  if (req.headers.get('content-type')?.includes('application/json')) {
    const input = await req.json().catch(() => null);
    if (!input || typeof input.filename !== 'string' || input.filename.length > 200 || !/\.pdf$/i.test(input.filename) || !Number.isFinite(input.size) || input.size <= 0 || input.size > 20 * 1024 * 1024) return Response.json({ error: 'Choose a PDF under 20 MB.' }, { status: 400 });
    if (!cloudStorageConfigured()) {
      if (process.env.VERCEL) return Response.json({ error: 'PDF storage is not configured yet.' }, { status: 503 });
      return Response.json({ direct: false });
    }
    try { return Response.json({ direct: true, ...await preparePsetUpload(input.filename, (await courseOwner(true))!) }); }
    catch { return Response.json({ error: 'Could not prepare private PDF storage.' }, { status: 503 }); }
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Missing PDF" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return Response.json({ error: "PDF is too large" }, { status: 413 });
  }
  const type = file.type || "";
  const name = file.name.toLowerCase();
  if (!type.includes("pdf") && !name.endsWith(".pdf")) {
    return Response.json({ error: "Upload a PDF" }, { status: 400 });
  }

  const owner = await courseOwner(true);
  const pset = await savePsetPdf(file, "", owner!);
  return Response.json({
    id: pset.id,
    courseId: pset.courseId,
    title: pset.title,
    fileUrl: `/api/pset/${pset.id}/file`,
  });
}
