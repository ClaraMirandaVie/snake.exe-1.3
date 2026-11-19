
-- A regra antiga só aceitava easy, normal e hard.
-- Aqui a gente troca por uma regra nova que aceita as 5 dificuldades.
alter table public.scores drop constraint if exists scores_speed_check;

alter table public.scores
  add constraint scores_speed_check
  check (speed in ('easy', 'normal', 'hard', 'insane', 'extreme'));