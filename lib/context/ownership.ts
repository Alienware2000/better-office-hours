import { cookies } from 'next/headers';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { currentIdentity, identityKey } from '@/lib/auth/server';

const cookieName = 'boh-collector-owner';
export async function courseOwner(create = false): Promise<string | null> {
  const identity = await currentIdentity();
  if (identity) return `users/${identityKey(identity.email)}`;
  const jar = await cookies();
  const existing = jar.get(cookieName)?.value;
  if (existing && /^[a-f0-9-]{36}$/.test(existing)) return `guests/${existing}`;
  if (!create) return null;
  const value = randomUUID();
  jar.set(cookieName, value, { httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: 'lax', path: '/', maxAge: 365 * 24 * 3600 });
  return `guests/${value}`;
}
const secret = () => process.env.INGEST_TOKEN || process.env.NEXTAUTH_SECRET;
export function collectorToken(owner: string) {
  if (!secret()) throw new Error('Set INGEST_TOKEN to enable the Canvas connection.');
  const payload = Buffer.from(JSON.stringify({ owner, expires: Date.now() + 2 * 3600_000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()!).update(payload).digest('base64url')}`;
}
export function collectorOwner(authorization: string | null): string | null {
  if (!secret() || !authorization?.startsWith('Bearer ')) return null;
  const [payload, signature, extra] = authorization.slice(7).split('.');
  if (!payload || !signature || extra || payload.length > 500) return null;
  const expected = createHmac('sha256', secret()!).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data.owner === 'string' && /^(users\/[a-f0-9]{64}|guests\/[a-f0-9-]{36})$/.test(data.owner) && Number.isFinite(data.expires) && data.expires > Date.now() ? data.owner : null;
  } catch { return null; }
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return !origin || origin === new URL(req.url).origin;
}
