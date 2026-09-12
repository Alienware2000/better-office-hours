import { redirect } from "next/navigation";
import { getServerIdentity } from "@/lib/auth";
import { VoiceSession } from "./(session)/voice/VoiceSession";

export default async function Home() {
  const identity = await getServerIdentity();
  if (!identity) redirect("/sign-in");
  return <VoiceSession />;
}
