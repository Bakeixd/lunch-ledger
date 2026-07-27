create table if not exists public.app_state (
  id integer primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- 브라우저에서는 이 테이블에 직접 접근하지 않습니다.
-- Vercel 서버의 SUPABASE_SERVICE_ROLE_KEY를 통해서만 읽고 씁니다.
