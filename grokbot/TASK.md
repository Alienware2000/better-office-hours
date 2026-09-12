# Grok Bot: Course Pack Collector

Bot name: Course Pack Collector
Purpose: collect everything around a course so Better Office Hours can tutor with real context.

Status: David assigned the live collector integration. The authenticated JSON ingest boundary is implemented on `lane/persistence-auth`; run only after Supabase, the production URL, and `INGEST_TOKEN` are configured.

## Task text

You are collecting course materials for Better Office Hours.

1. Open Yale Canvas at canvas.yale.edu and sign in. If Duo asks for approval, wait for me to approve it.
2. On the Dashboard, confirm the signed-in Yale email is "{USER_EMAIL}". Stop if it does not match.
3. Phase 2, course pack. Go to Courses, then All Courses, and find the course named "{COURSE_NAME}". It may be under Past Enrollments.
4. Inside the course, open Files, Modules, Syllabus, Assignments, and Pages. Download:
   - the syllabus and any course policy documents
   - all lecture notes and slides
   - all problem sets
   - any posted problem set solutions
   - any exam review or practice exam materials
5. Name each file by kind and number: syllabus.pdf, policy_*.pdf, lecture_04.pdf, pset_03.pdf, solution_03.pdf, exam_review_01.pdf. Use other_*.pdf for anything else useful.
6. Extract text page by page from each collected file. Use the printed page or slide number when available; otherwise use the file's 1-based page number. Do not send empty pages.
7. POST JSON to {INGEST_URL} with the header Authorization: Bearer {INGEST_TOKEN} and Content-Type: application/json. Use batches of at most 500 page sources and 20 million text characters. Use this shape:

```json
{
  "userEmail": "{USER_EMAIL}",
  "userName": "{USER_NAME}",
  "course": {
    "courseId": "{COURSE_ID}",
    "courseName": "{COURSE_NAME}",
    "term": "{TERM}"
  },
  "sources": [
    {
      "courseId": "{COURSE_ID}",
      "documentId": "lecture-04",
      "documentKind": "lecture",
      "documentTitle": "Lecture 4: Projectile Motion",
      "storagePath": "canvas://{COURSE_ID}/lecture_04.pdf",
      "page": 10,
      "text": "Extracted text for this page",
      "isSolution": false
    }
  ]
}
```

Use only these `documentKind` values: `syllabus`, `lecture`, `pset`, `solution`, `exam_review`, or `other`. Mark every posted solution with `documentKind: "solution"` and `isSolution: true`.
8. Require an HTTP 200 response with `{ "ok": true, "chunkCount": number }` for every batch. Otherwise report the status and stop instead of retrying indefinitely.
9. Report back with file names and page counts grouped by kind, plus anything you could not access. Do not include solution text in the report.

Do not modify anything in Canvas. Do not download grades or other students' data.

## Rehearsal checklist
- Run once with Duo before recording.
- Record a 10 to 15 second GIF of the bot navigating Canvas and the report coming back, for the README.
- Copy the bot share link into the README.
