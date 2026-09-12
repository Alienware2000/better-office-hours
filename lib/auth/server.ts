import { createHash } from 'node:crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from './options';
import { getAuthenticatedIdentity } from './identity';

export function authConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET);
}
export async function currentIdentity() {
  return authConfigured() ? getAuthenticatedIdentity(await getServerSession(authOptions)) : null;
}
export function identityKey(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}
