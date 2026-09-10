export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    grok: Boolean(process.env.XAI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
  });
}
