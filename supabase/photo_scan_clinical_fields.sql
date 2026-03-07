alter table if exists public.photo_scans
  add column if not exists redness_score int,
  add column if not exists pore_size_score int,
  add column if not exists acne_grade int;
