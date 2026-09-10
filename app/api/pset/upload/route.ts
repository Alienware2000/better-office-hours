import { savePsetPdf } from "@/lib/pdf/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

  const pset = await savePsetPdf(file);
  return Response.json({
    id: pset.id,
    courseId: pset.courseId,
    title: pset.title,
    fileUrl: `/api/pset/${pset.id}/file`,
  });
}
