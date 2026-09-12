# Deployment and recording handoff

Deadline decision at 22:56 EDT: Google and Supabase are deferred by David. Record the full PDF/course workflow locally on :3102. The hosted guest concept tutor is usable, but hosted PDF/course persistence is unavailable. Configuration instructions below are for follow-up work, not prerequisites for recording.

Verified application: https://better-office-hours.vercel.app

Vercel project: better-office-hours, team alienware2000s-projects. The checked-in vercel.json selects Next.js explicitly and uses npm ci. A generic Other preset built successfully but served 404; do not reuse it. Deploy source changes with vercel --prod after the relevant checks. CLI deployments do not automatically connect GitHub deployment triggers.

## Configuration

Already configured privately for production and preview: XAI_API_KEY, ELEVENLABS_API_KEY, and INGEST_TOKEN. The last value signs short-lived owner-scoped collector connections. Never give that server value to Grok Bot.

Still needed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, added to the intended Vercel project and local .env.local privately, followed by redeployment. The current implementation uses private Supabase Storage and automatically creates boh-private. It does not require PR #11's database migration. The service key remains server-only. Production refuses course/PDF writes without storage configuration.

Google is optional for the guest demo. If enabled later, configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET and the correct production NextAuth URL/callback. Recheck identity isolation before promoting it. Do not add a root login gate to unblock unrelated Canvas collection.

## Final live checks

1. Open the hosted origin, allow the microphone, and start a concept conversation. Speak naturally, interrupt, pause, and resume. Existing automated hosted checks use a synthetic microphone and cannot establish acoustic reliability.
2. After storage setup, upload a PDF, mark it, reload, and confirm its bytes and annotations return. Verify another browser cannot access its private file.
3. For the full cloud flow after storage configuration: in Grok Bot, take over Course Pack Collector's computer and complete NetID/Duo. Then select I'm done. Open Connect Canvas in the intended hosted browser and copy its scoped two-hour task to the collector. Send documents sequentially as specified in grokbot/TASK.md. Do not share credentials, private course contents, or the connection token in the demo/README.
4. Verify one real course appears and one tutor explanation uses an actual non-solution source. The bot has not completed a live collection as of 22:56 EDT.
5. Close a substantive session by voice, offer a short student takeaway if desired, and verify the spoken/saved recap. Leaving remains available without it. Export the session before recording more tests.

## Evidence and limits

Remote clean install, build and typecheck pass. Public root, real Grok response, ElevenLabs speech generation and transcription pass. Fresh Chrome passes real Silero startup, actual service playback, concept desk entry, desktop/phone layout, and paused session recovery. No actual hosted course/PDF write or human microphone rehearsal has passed yet.

Saved conversations, boards and recaps remain browser-local. Localhost and production have separate storage; existing local sessions do not automatically appear on the hosted origin. Cross-device history and cross-session learning memory are not implemented. New PR #11 proposes database persistence but needs reconciliation with the current optional identity and scoped ingestion flow.

Reserve time before 23:59 for the human-recorded video, required Cursor screenshot, verified Grok Bot share link/GIF, accurate README and submission. Keep the frozen localhost:3102 release as the local rehearsal fallback.

For a local collector demo, the cloud bot cannot upload to localhost. It can export its actual collected profile and page-text JSON for download and local import through the existing scoped API. That transfer has not been verified; do not claim live automatic collection until it has.
