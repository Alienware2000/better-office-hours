import { trialEnabled } from "@/lib/agent/trial";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    grok: Boolean(trialEnabled() ? process.env.OPENROUTER_API_KEY : process.env.XAI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
  });
}
