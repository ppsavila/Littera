-- Store per-line highlight rects instead of a single bounding box
alter table error_markers
  add column if not exists rects jsonb; -- [{x, y, x2, y2}] normalized 0-1 per line
