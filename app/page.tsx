import { courseOwner } from '@/lib/context/ownership';
import { readProfile } from '@/lib/context/catalog';
import { VoiceSession } from "./(session)/voice/VoiceSession";
import { authConfigured, currentIdentity, identityKey } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';
export default async function Home() {
  const identity = await currentIdentity();
  const owner = await courseOwner();
  const profile = owner ? await readProfile(owner).catch(() => null) : null;
  return <VoiceSession studentName={identity?.name || profile?.name || undefined} ownerKey={identity ? identityKey(identity.email) : 'guest'} accountName={identity?.name || identity?.email} signInAvailable={authConfigured()} />;
}
