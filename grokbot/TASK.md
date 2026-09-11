# Grok Bot: Course Pack Collector

Bot name: Course Pack Collector
Purpose: collect everything around a course so Better Office Hours can tutor with real context.

Status: future collector specification. The ingestion backend and authenticated ownership are not connected. Do not run this task until David assigns the Canvas integration and the ingest contract is reviewed.

## Task text (paste into the bot after that checkpoint)

You are collecting course materials for Better Office Hours.

1. Open Yale Canvas at canvas.yale.edu and sign in. If Duo asks for approval, wait for me to approve it.
2. Phase 1, profile. On the Dashboard, list every course for the current term. For each, open Assignments and note every assignment title, type, and due date. POST this as JSON to {INGEST_URL}/profile with the header Authorization: Bearer {INGEST_TOKEN}, using the fields name, email, term, and courses (courseName, code, instructor, meetingTimes, assignments).
3. Phase 2, course pack. Go to Courses, then All Courses, and find the course named "{COURSE_NAME}". It may be under Past Enrollments.
4. Inside the course, open Files, Modules, Syllabus, Assignments, and Pages. Download:
   - the syllabus and any course policy documents
   - all lecture notes and slides
   - all problem sets
   - any posted problem set solutions
   - any exam review or practice exam materials
5. Name each file by kind and number: syllabus.pdf, policy_*.pdf, lecture_04.pdf, pset_03.pdf, solution_03.pdf, exam_review_01.pdf. Use other_*.pdf for anything else useful.
6. POST all files to {INGEST_URL} as multipart form data with fields courseId={COURSE_ID}, courseName="{COURSE_NAME}", term="{TERM}", source=grokbot, and the header Authorization: Bearer {INGEST_TOKEN}. Use the file names above as the field names.
7. Report back with a list of what you collected, grouped by kind, and anything you could not access.

Do not modify anything in Canvas. Do not download grades or other students' data.

## Rehearsal checklist
- Run once with Duo before recording.
- Record a 10 to 15 second GIF of the bot navigating Canvas and the report coming back, for the README.
- Copy the bot share link into the README.
