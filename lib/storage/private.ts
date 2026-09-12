import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { get, put, issueSignedToken, presignUrl } from '@vercel/blob';

const bucket = 'boh-private';
export const vercelStorageConfigured = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
export const cloudStorageConfigured = () => vercelStorageConfigured() || Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
let ready: Promise<void> | undefined;
async function ensureBucket() {
  return ready ??= (async () => {
    const storage = client().storage;
    const current = await storage.getBucket(bucket);
    if (current.data?.public) throw new Error('Course storage must be private.');
    if (!current.data) {
      const result = await storage.createBucket(bucket, { public: false, fileSizeLimit: 25 * 1024 * 1024 });
      if (result.error && !/already exists/i.test(result.error.message)) throw new Error('Could not prepare private course storage.');
    }
  })().catch(error => { ready = undefined; throw error; });
}
function safePath(path: string) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid storage path');
  return path;
}
export async function putPrivate(path: string, bytes: Uint8Array, contentType: string) {
  safePath(path);
  if (vercelStorageConfigured()) {
    await put(path, Buffer.from(bytes), { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true });
  } else if (cloudStorageConfigured()) {
    await ensureBucket();
    const { error } = await client().storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
    if (error) throw new Error('Could not save to private storage.');
  } else {
    if (process.env.VERCEL) throw new Error('Private course storage is not configured yet.');
    const file = join(process.cwd(), '.data', 'private', path);
    await mkdir(dirname(file), { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, bytes); await rename(temp, file);
  }
}
export async function getPrivate(path: string): Promise<Buffer | null> {
  safePath(path);
  if (vercelStorageConfigured()) {
    // Profiles and course packs are updated in place. Read through to origin
    // so sequential ingestion cannot overwrite a newer pack with cached data.
    const result = await get(path, { access: 'private', useCache: false });
    return result?.statusCode === 200 ? Buffer.from(await new Response(result.stream).arrayBuffer()) : null;
  }
  if (cloudStorageConfigured()) {
    const { data, error } = await client().storage.from(bucket).download(path);
    if (error) {
      if (String(error.statusCode) === '404' || /not found|does not exist/i.test(error.message)) return null;
      throw new Error('Could not read private storage.');
    }
    return Buffer.from(await data.arrayBuffer());
  }
  if (process.env.VERCEL) return null;
  try { return await readFile(join(process.cwd(), '.data', 'private', path)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}
export async function putJson(path: string, value: unknown) { await putPrivate(path, Buffer.from(JSON.stringify(value)), 'application/json'); }
export async function getJson<T>(path: string): Promise<T | null> {
  const bytes = await getPrivate(path); return bytes ? JSON.parse(bytes.toString('utf8')) as T : null;
}

export async function signedUpload(path: string) {
  safePath(path);
  if (vercelStorageConfigured()) {
    const constraints = { allowedContentTypes: ['application/pdf'], maximumSizeInBytes: 20 * 1024 * 1024 };
    const token = await issueSignedToken({ pathname: path, operations: ['put'], validUntil: Date.now() + 10 * 60_000, ...constraints });
    const { presignedUrl } = await presignUrl(token, { pathname: path, operation: 'put', access: 'private', addRandomSuffix: false, allowOverwrite: false, ...constraints });
    return presignedUrl;
  }
  await ensureBucket();
  const { data, error } = await client().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error('Could not prepare PDF upload.');
  return data.signedUrl;
}
export async function signedDownload(path: string) {
  safePath(path);
  if (vercelStorageConfigured()) {
    const token = await issueSignedToken({ pathname: path, operations: ['get'], validUntil: Date.now() + 60_000 });
    return (await presignUrl(token, { pathname: path, operation: 'get', access: 'private' })).presignedUrl;
  }
  const { data, error } = await client().storage.from(bucket).createSignedUrl(path, 60);
  return error ? null : data?.signedUrl ?? null;
}
