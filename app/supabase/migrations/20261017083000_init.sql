-- MotherTongue schema: workspaces own brands and campaigns; every audience version is a row the worker fills in.
-- The app never waits on the worker: it inserts a job, the worker claims it, and the app watches `versions` (Realtime).

create extension if not exists pgcrypto;

-- ── Tenancy ────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'My workspace',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.workspaces(owner_id);

create or replace function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspaces w where w.id = ws and w.owner_id = auth.uid());
$$;

-- ── Brand ──────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  about         text not null default '',
  tone          text not null default '',
  never_change  text[] not null default '{}',
  colours       jsonb not null default '{"accent": "#F2B33D", "ink": "#1B1B1B"}',
  -- per language: {"bn": {"attrs": "female, young adult"}} or {"bn": {"consent_id": "..."}} for a consented own voice
  voices        jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index on public.brands(workspace_id);

-- ── Campaigns, audiences, versions ─────────────────────────────────────────────────────────────────────────────────
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  brand_id      uuid not null references public.brands(id) on delete cascade,
  name          text not null,
  source        text not null check (source in ('template', 'upload')),
  template_id   text,
  -- the master ad: canvas, scenes (timing, clip, master line), facts, music — same shape as worker templates
  master        jsonb not null,
  master_path   text,            -- uploaded MP4 in storage, when source = 'upload'
  seen          jsonb,           -- what Gemma saw in each scene + where text goes
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.campaigns(workspace_id, updated_at desc);

create table public.audiences (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  preset_id    text,
  label        text not null,
  city         text not null default '',
  language     text not null,
  tone         text not null default '',
  notes        text not null default '',
  voice        text not null default 'female, young adult',
  created_at   timestamptz not null default now()
);
create index on public.audiences(campaign_id);

create table public.versions (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  audience_id  uuid not null references public.audiences(id) on delete cascade,
  n            int not null default 1,
  parent_id    uuid references public.versions(id) on delete set null,
  status       text not null default 'queued' check (status in
                 ('queued', 'waiting', 'making', 'ready', 'needs_look', 'approved', 'failed')),
  stage        text not null default 'queued',  -- seeing · writing · voicing · checking · rendering · checking the picture
  status_note  text not null default '',
  -- lines, issues, picture check, summary, understood, changes, fact_requests, applied rules, cost
  record       jsonb not null default '{}',
  mp4_path     text,
  srt_path     text,
  thumb_path   text,
  opened_at    timestamptz,
  approved_at  timestamptz,
  approved_by  uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (audience_id, n)
);
create index on public.versions(campaign_id);

-- ── Review + brand memory ──────────────────────────────────────────────────────────────────────────────────────────
create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references public.versions(id) on delete cascade,
  kind        text not null check (kind in ('request', 'edit', 'approve', 'fact_change')),
  text        text not null default '',
  chips       text[] not null default '{}',
  scene       text,
  detail      jsonb not null default '{}',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index on public.feedback(version_id);

create table public.memory_rules (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid not null references public.brands(id) on delete cascade,
  text                text not null,
  scope               jsonb not null default '{}',   -- {} all · {"language": "bn"} · {"audience_id": "..."}
  scope_label         text not null default 'All versions',
  why                 text not null default '',
  source_feedback_id  uuid references public.feedback(id) on delete set null,
  source_campaign_id  uuid references public.campaigns(id) on delete set null,
  enabled             boolean not null default true,
  created_at          timestamptz not null default now()
);
create index on public.memory_rules(brand_id);

-- ── Job queue (worker only; the app inserts through its server with the service role) ────────────────────────────
create table public.jobs (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('see', 'make_version', 'revise', 'edit_line', 'rerender')),
  campaign_id  uuid references public.campaigns(id) on delete cascade,
  version_id   uuid references public.versions(id) on delete cascade,
  payload      jsonb not null default '{}',
  state        text not null default 'queued' check (state in ('queued', 'running', 'done', 'failed')),
  attempts     int not null default 0,
  run_after    timestamptz not null default now(),
  locked_by    text,
  locked_at    timestamptz,
  error        text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create index on public.jobs(state, run_after);

-- Claim the oldest runnable job; jobs stuck "running" for 15 minutes (a crashed worker) are claimable again.
create or replace function public.claim_job(worker text) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs j set state = 'running', locked_by = worker, locked_at = now(), attempts = j.attempts + 1
  where j.id = (
    select id from public.jobs
    where (state = 'queued' and run_after <= now())
       or (state = 'running' and locked_at < now() - interval '15 minutes')
    order by created_at
    for update skip locked
    limit 1
  )
  returning j.*;
$$;
revoke all on function public.claim_job(text) from public, anon, authenticated;

-- ── Row level security: you see only your own workspaces ───────────────────────────────────────────────────────────
alter table public.workspaces   enable row level security;
alter table public.brands       enable row level security;
alter table public.campaigns    enable row level security;
alter table public.audiences    enable row level security;
alter table public.versions     enable row level security;
alter table public.feedback     enable row level security;
alter table public.memory_rules enable row level security;
alter table public.jobs         enable row level security;   -- no policies: service role only

create policy "own workspaces" on public.workspaces for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "brands in my workspaces" on public.brands for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "campaigns in my workspaces" on public.campaigns for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "audiences of my campaigns" on public.audiences for all
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id)))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id)));
create policy "versions of my campaigns" on public.versions for select
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.workspace_id)));
create policy "feedback on my versions" on public.feedback for select
  using (exists (select 1 from public.versions v join public.campaigns c on c.id = v.campaign_id
                 where v.id = version_id and public.is_member(c.workspace_id)));
create policy "rules of my brands" on public.memory_rules for all
  using (exists (select 1 from public.brands b where b.id = brand_id and public.is_member(b.workspace_id)))
  with check (exists (select 1 from public.brands b where b.id = brand_id and public.is_member(b.workspace_id)));

-- Live status for the app.
alter publication supabase_realtime add table public.versions;

-- ── Storage: private media, files live under <workspace_id>/... ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 52428800)
on conflict (id) do nothing;

create policy "read my media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "upload my media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
