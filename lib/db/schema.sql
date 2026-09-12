create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  name text not null,
  term text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.course_memberships (
  user_id uuid not null references public.app_users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.context_chunks (
  course_id text not null references public.courses(id) on delete cascade,
  chunk_id text not null,
  document_id text not null,
  document_kind text not null check (
    document_kind in (
      'syllabus',
      'lecture',
      'pset',
      'solution',
      'exam_review',
      'other'
    )
  ),
  document_title text not null,
  storage_path text not null,
  page integer check (page is null or page >= 0),
  content text not null,
  is_solution boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (course_id, chunk_id)
);

create table if not exists public.session_recaps (
  user_id uuid not null,
  course_id text not null,
  session_id text not null,
  recap jsonb not null check (jsonb_typeof(recap) = 'object'),
  saved_at timestamptz not null default now(),
  primary key (user_id, course_id, session_id),
  foreign key (user_id, course_id)
    references public.course_memberships(user_id, course_id)
    on delete cascade
);

create index if not exists context_chunks_course_document_idx
  on public.context_chunks (course_id, document_id);
create index if not exists context_chunks_student_safe_idx
  on public.context_chunks (course_id, is_solution)
  where is_solution = false;
create index if not exists session_recaps_recent_idx
  on public.session_recaps (user_id, course_id, saved_at desc);

alter table public.app_users enable row level security;
alter table public.courses enable row level security;
alter table public.course_memberships enable row level security;
alter table public.context_chunks enable row level security;
alter table public.session_recaps enable row level security;

revoke all on public.app_users from anon, authenticated;
revoke all on public.courses from anon, authenticated;
revoke all on public.course_memberships from anon, authenticated;
revoke all on public.context_chunks from anon, authenticated;
revoke all on public.session_recaps from anon, authenticated;

comment on table public.app_users is
  'Server-resolved identities from verified Google sessions. Never browser supplied.';
comment on table public.context_chunks is
  'Course context including hidden solution chunks. Service-role access only.';
comment on table public.session_recaps is
  'Idempotent recap records scoped to an authenticated user and owned course.';
