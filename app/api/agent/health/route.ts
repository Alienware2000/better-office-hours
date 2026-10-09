import { tutorConfigured, tutorProvider, tutorModel } from "@/lib/agent/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    grok: tutorConfigured(), // Legacy client field means the selected tutor is configured.
    provider: tutorProvider(),
    model: tutorModel(true),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
  });
}
