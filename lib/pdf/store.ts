import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getPrivate, putPrivate, putJson, signedUpload } from '@/lib/storage/private';

export type StoredPset = { id: string; courseId: string; title: string; filename: string };
export async function savePsetPdf(file: File, courseId = '', owner = 'legacy'): Promise<StoredPset> {
  const id = randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw new Error('Upload a valid PDF.');
  const meta = { id, courseId, title: file.name.replace(/\.pdf$/i, '') || 'Problem set', filename: file.name };
  await putPrivate(`${owner}/psets/${id}/source.pdf`, bytes, 'application/pdf');
  await putJson(`${owner}/psets/${id}/meta.json`, meta);
  return meta;
}
export async function readPsetPdf(id: string, owner: string | null = null): Promise<Buffer> {
  if (owner) {
    const bytes = await getPrivate(`${owner}/psets/${id}/source.pdf`);
    if (bytes) return bytes;
  }
  // Existing anonymous localhost saves predate scoped storage. Never serve
  // these old demo files from a deployed or authenticated account context.
  if (!process.env.VERCEL && !owner?.startsWith('users/')) {
    try { return await readFile(join(process.cwd(), '.data', 'psets', id, 'source.pdf')); } catch { /* Missing legacy file. */ }
  }
  throw new Error('Not found');
}

export async function preparePsetUpload(filename: string, owner: string) {
  const id = randomUUID();
  const meta = { id, courseId: '', title: filename.replace(/\.pdf$/i, '') || 'Problem set', filename };
  const uploadUrl = await signedUpload(`${owner}/psets/${id}/source.pdf`);
  await putJson(`${owner}/psets/${id}/meta.json`, meta);
  return { ...meta, fileUrl: `/api/pset/${id}/file`, uploadUrl };
}
