import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const root = () => join(process.cwd(), ".data", "psets");

export type StoredPset = {
  id: string;
  courseId: string;
  title: string;
  filename: string;
};

export async function savePsetPdf(
  file: File,
  courseId = "phys180-fall2024",
): Promise<StoredPset> {
  const id = randomUUID();
  const dir = join(root(), id);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, "source.pdf"), bytes);
  const meta: StoredPset = {
    id,
    courseId,
    title: file.name.replace(/\.pdf$/i, "") || "Problem set",
    filename: file.name,
  };
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta));
  return meta;
}

export async function readPsetPdf(id: string): Promise<Buffer> {
  return readFile(join(root(), id, "source.pdf"));
}
