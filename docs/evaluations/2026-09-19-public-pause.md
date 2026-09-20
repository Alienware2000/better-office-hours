# Public access paused

David explicitly requested a reversible public pause after posting on LinkedIn because the tutor is not ready for visitors. This is a narrow exception to the publication freeze, not authorization to publish local changes. Keep local development available; resume only at David's request.

Vercel project: better-office-hours, prj_IOWquvgWDDE06vwIxZn4scu6twV1.
Team: alienware2000s-projects, team_eRmAemyR5YRmokOI5zDAzZDT.
Production deployment: dpl_AWysH7j86epXocxZfSayGeafDdQx.

At 2026-09-20 03:24 UTC (September 19 local), authenticated POST to /v1/projects/{projectId}/pause returned HTTP 200. Public unauthenticated GET checks all returned HTTP 503 with x-vercel-error DEPLOYMENT_PAUSED:

- https://better-office-hours.vercel.app
- https://better-office-hours-alienware2000s-projects.vercel.app
- https://better-office-hours-kkn1grq47-alienware2000s-projects.vercel.app

Visitors receive Vercel's pause page, not a custom coming-soon page. No deployment, deletion, credential change, or local restart occurred. This verification covers these production addresses, not an inventory of historical preview links.

To resume after David requests it, select this project in the Vercel dashboard, open Settings, and choose Resume Service in the paused-project banner. Verify public access afterward. No redeployment is required. See [Vercel project pause/resume documentation](https://vercel.com/docs/projects/managing-projects#pausing-a-project).
