-- ERROR MARKERS: anotações vinculadas a tipos de erro específicos por competência
create table error_markers (
  id           uuid default uuid_generate_v4() primary key,
  essay_id     uuid references essays(id) on delete cascade not null,
  teacher_id   uuid references profiles(id) on delete cascade not null,
  page_number  smallint default 1 not null,
  x            real not null,  -- normalized 0-1
  y            real not null,  -- normalized 0-1
  error_code   text not null,  -- e.g. 'Ort', 'Conc', 'PA'
  competency   smallint not null check (competency between 1 and 5),
  note         text,
  created_at   timestamptz default now()
);

alter table error_markers enable row level security;
create policy "Teachers manage own error markers"
  on error_markers for all using (auth.uid() = teacher_id);

create index error_markers_essay_idx on error_markers(essay_id);
