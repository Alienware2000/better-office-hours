# Deployment and recording handoff

Verified application: https://better-office-hours.vercel.app

Vercel project: better-office-hours, team alienware2000s-projects. vercel.json explicitly selects Next.js and npm ci. The initial generic preset produced a successful build but 404 routes. Current private-storage deployment: dpl_4pjLaz26juco8JFjzeKPFBeXMroe.

## Storage and identity

Private Vercel Blob store boh-private is linked to production and preview. No Google or Supabase setup is needed for the current guest demo. The linked BLOB_READ_WRITE_TOKEN (or BLOB_STORE_ID with OIDC) stays on the server. Source/profile JSON and PDF bytes persist under owner-scoped paths. A private Supabase adapter remains an optional alternative; unconfigured local runs use .data/private.

INGEST_TOKEN is the server's connection-signing secret, never the token handed to a bot. Connect Canvas creates a two-hour connection scoped to the intended app browser or account. Only that task goes to Course Pack Collector. The guest ownership cookie is an opaque browser capability, not a signed-in identity. Google remains optional and requires separate configuration if enabled later.

PDF uploads use signed single-file URLs restricted to application/pdf, 20 MB, ten minutes and no overwrite. Downloads receive a one-minute signed URL after the app checks the owning browser/account. Large file bytes bypass Vercel function body limits. Blob profile/course reads bypass CDN cache because sequential ingestion updates these JSON objects in place.

See [Vercel private storage](https://vercel.com/docs/vercel-blob/private-storage) and [signed URLs](https://vercel.com/docs/vercel-blob/vercel-signed-urls). Mutable pack ingestion is sequential; do not run concurrent collectors into the same course.

## Verified checks

Remote npm ci, build and typecheck pass. Real hosted Grok, ElevenLabs TTS and STT pass. Fresh Chrome passes real Silero startup, actual service playback, concept entry, desktop/phone layout, and paused saved-session recovery with a muted synthetic microphone.

scripts/check-deployed-storage.mjs verifies real private source/profile writes, fresh sequential updates, solution exclusion, guest isolation, >4.5 MB direct PDF upload/download, raw private URL denial and overwrite denial. It requires BOH_TEST_BASE_URL and BOH_ALLOW_STORAGE_WRITES=1 and creates isolated synthetic data. A separate fresh-browser check uploaded a valid synthetic PDF through the actual UI, rendered it, drew student ink and restored both after refresh. The screenshot was inspected.

## Remaining recording checks

1. Course Pack Collector's actual ten-course profile and PHYS 180 syllabus (6 pages), Class 1 lecture notes (8 pages), and Homework 1 (3 pages) are verified in the intended public browser. PHYS 180 99254 is selected. Do not repeat completed NetID/Duo or connection setup.
2. Select the actual course and rehearse one human voice/PDF/diagram exchange against its real source. Check interruption and student ink. Synthetic tests cannot establish human acoustic reliability.
3. If useful, close by voice with a short student takeaway and inspect the recap. Leaving does not require a recap. Export the session for later analysis.
4. Record, add the real video and Cursor screenshot plus verified reusable bot link/GIF to README, and submit before 23:59. Never share a bot conversation or screenshot containing credentials, connection tokens or private course data as the reusable bot link.

Saved conversation, board and recap archives remain browser-local. Localhost and production have separate histories; cloud course/PDF storage does not move old local sessions or implement cross-session learning memory. Keep the frozen :3102 release as a fallback. New PR #11 needs reconciliation with current optional identity/scoped ingestion before database session work.
