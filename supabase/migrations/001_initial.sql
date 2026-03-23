-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (extends Supabase auth.users)
create table profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  full_name    text not null default '',
  school       text,
  created_at   timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email, ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STUDENTS
create table students (
  id           uuid default uuid_generate_v4() primary key,
  teacher_id   uuid references profiles(id) on delete cascade not null,
  name         text not null,
  class_name   text,
  created_at   timestamptz default now()
);
alter table students enable row level security;
create policy "Teachers manage own students"
  on students for all using (auth.uid() = teacher_id);

-- ESSAYS
create table essays (
  id              uuid default uuid_generate_v4() primary key,
  teacher_id      uuid references profiles(id) on delete cascade not null,
  student_id      uuid references students(id) on delete set null,
  title           text not null,
  source_type     text check (source_type in ('pdf','image','text')) not null,
  storage_path    text,
  raw_text        text,
  theme           text,
  status          text check (status in (
                    'pending','analyzing','analyzed','correcting','done'
                  )) default 'pending' not null,
  score_c1        smallint check (score_c1 in (0,40,80,120,160,200)),
  score_c2        smallint check (score_c2 in (0,40,80,120,160,200)),
  score_c3        smallint check (score_c3 in (0,40,80,120,160,200)),
  score_c4        smallint check (score_c4 in (0,40,80,120,160,200)),
  score_c5        smallint check (score_c5 in (0,40,80,120,160,200)),
  total_score     smallint generated always as (
                    coalesce(score_c1,0) + coalesce(score_c2,0) +
                    coalesce(score_c3,0) + coalesce(score_c4,0) +
                    coalesce(score_c5,0)
                  ) stored,
  notes_c1        text,
  notes_c2        text,
  notes_c3        text,
  notes_c4        text,
  notes_c5        text,
  general_comment text,
  ai_analysis     jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table essays enable row level security;
create policy "Teachers manage own essays"
  on essays for all using (auth.uid() = teacher_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger essays_updated_at
  before update on essays
  for each row execute procedure update_updated_at();

-- ANNOTATIONS
create table annotations (
  id           uuid default uuid_generate_v4() primary key,
  essay_id     uuid references essays(id) on delete cascade not null,
  teacher_id   uuid references profiles(id) on delete cascade not null,
  page_number  smallint default 1 not null,
  type         text check (type in (
                 'highlight','freehand','arrow','textbox','marker'
               )) not null,
  shape_data   jsonb not null,
  comment      text,
  competency   smallint check (competency between 1 and 5),
  color        text default '#FACC15' not null,
  created_at   timestamptz default now()
);
alter table annotations enable row level security;
create policy "Teachers manage own annotations"
  on annotations for all using (auth.uid() = teacher_id);

-- Indexes
create index annotations_essay_id_idx on annotations(essay_id);
create index essays_teacher_status_idx on essays(teacher_id, status);
create index essays_student_idx on essays(student_id);

-- Storage bucket for essays
insert into storage.buckets (id, name, public)
values ('essays', 'essays', false)
on conflict do nothing;

create policy "Teachers upload own essays"
  on storage.objects for insert
  with check (bucket_id = 'essays' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers read own essays"
  on storage.objects for select
  using (bucket_id = 'essays' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers delete own essays"
  on storage.objects for delete
  using (bucket_id = 'essays' and auth.uid()::text = (storage.foldername(name))[1]);
