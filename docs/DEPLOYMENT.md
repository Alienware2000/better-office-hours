# Production deployment

The application is ready for a Vercel and Supabase deployment, but production is not configured by source code alone. Keep every value below in provider environment settings or an ignored `.env.local`.

## 1. Create Supabase storage

1. Create a Supabase project.
2. Open its SQL editor and run `lib/db/schema.sql`.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`.
5. Never expose the service-role key through a `NEXT_PUBLIC_` variable.

All tables have row-level security enabled and grant no access to browser roles. Next.js server routes use the service role only after checking NextAuth identity or the collector token.

## 2. Configure Vercel

Set these production environment variables:

```text
XAI_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_TTS_MODEL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
INGEST_TOKEN
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Generate independent, high-entropy values for `INGEST_TOKEN` and `NEXTAUTH_SECRET`. `NEXTAUTH_URL` must be the final HTTPS origin with no path, such as `https://better-office-hours.vercel.app`.

## 3. Update Google OAuth

After the first deployment establishes the final URL, add both values to the existing Google OAuth web client:

```text
Authorized JavaScript origin:
https://your-production-domain

Authorized redirect URI:
https://your-production-domain/api/auth/callback/google
```

The Google Cloud application is currently internal to Yale. Yale Google accounts can sign in after the production callback is added. The reserved non-Yale judge address cannot use this internal Google provider; password-based judge access is not implemented.

## 4. Redeploy and verify

1. Open the production root in a fresh browser and confirm it redirects to `/sign-in`.
2. Sign in with a Yale Google account and confirm the tutor opens.
3. Confirm `/api/retrieve` and `/api/session/recap` return `401` when signed out.
4. Confirm they return an explicit error, never secret values, when storage is unavailable.
5. Ingest a small synthetic course through the collector token, retrieve a non-solution chunk as its owner, and confirm solution text is absent.
6. Save the same recap twice and confirm only one `(user, course, session)` row exists.

Do not add the local OAuth secret, Supabase service key, collector token, uploaded PDFs, or judge credentials to Git, documentation, browser code, or screenshots.
