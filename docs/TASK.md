# Active task

Updated: 2026-10-09
State: complete
Branch: lane/post-hackathon-local
Base: ad35fcede0bb3f52b6eb5aa209f29f247523d064

## Objective

Protect main, place PR #11 on hold, and identify the remaining product work.

## Scope and constraints

David explicitly requested GitHub main protection and holding PR #11. No product implementation, deployment or public reopening in this slice. Main integration is already complete through PR #15 and checkpoint ad35fce. This task changes repository settings and CODEOWNERS, not product code. David explicitly clarified that he must retain direct-push access and all other contributors need his review. Groundtrack unavailable.

## Progress

GitHub main had no branch protection or rulesets. Applied and read back protection through the GitHub API: require PR plus one approving review, dismiss stale approvals, require latest push approval by someone other than its pusher, require David's CODEOWNER review, exempt his administrator account, resolve review conversations, disallow force pushes and deletion. `.github/CODEOWNERS` assigns every path to @Alienware2000, including changes to CODEOWNERS itself. No other admins or review bypass allowances were found. Merge commits remain supported. There is no .github CI workflow, so required status checks are not configured yet.

PR #11 converted to DRAFT using gh pr ready 11 --undo. API verifies OPEN, isDraft=true, autoMergeRequest=null. It stays excluded from main and cannot merge while draft. Do not mark ready or merge until David explicitly reopens this work. It proposes mandatory Google auth and Supabase course context/recap storage, not full session/whiteboard sync.

The product integration remains ad35fce; this maintenance change publishes CODEOWNERS and current checkpoint docs to main. No app/runtime changes or browser-save migrations occurred. Branch-protection/PR settings are effective on GitHub.

## Decisions

David corrected the initial admin-enforcement choice: he wants direct push access, but every other contributor must receive his review. One required code-owner approval implements that rule; generic collaborator approval alone is insufficient. Do not require a nonexistent CI check that would block every merge. Other contributors must use PRs with David approval. David may push directly as admin; agents still need the applicable publication authorization. Never weaken protection merely to publish a checkpoint.

## Validation

GitHub API readback confirms all enabled/disabled settings. PR API confirms draft, unmerged and no auto-merge. Published CODEOWNERS and main SHA verified through GitHub; branch protection readback has code-owner reviews enabled and admin enforcement disabled. No product tests needed for settings/documentation-only work. Context checks pass; current source/data and public pause preserved.

## Next action

Archive this completed TASK before the next bounded user request. Recommended next product slice: one real voice learning session at localhost:3120, including explanation, confusion, student ink, interruption and reopen, recording useful-audio latency. Repository safeguard still missing: automated PR lint/build/offline checks, then require those checks. Do not implement the whole roadmap without a new bounded request.

## Blockers

No blocker to protection or holding PR #11. Human acoustic testing, broad graded/STEM correctness, short speech and voice/visual timing remain product release work. Cross-device persistence, lasting learner memory and PR #11 reconciliation remain deferred. Public Vercel stays paused.
