
-- 1) A tabela do ranking. Cada linha = uma pontuação enviada.
--    Os "check" são regras que o próprio banco aplica, mesmo que
--    alguém tente enviar dados esquisitos por fora do jogo.
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 12),
  speed text not null check (speed in ('easy', 'normal', 'hard', 'insane', 'extreme')),
  -- O tabuleiro tem 400 casas e a cobra começa com 3, então o máximo
  -- são 397 comidas x 10 pontos = 3970. Pontos são sempre múltiplos de 10.
  score integer not null check (score between 0 and 3970 and score % 10 = 0),
  created_at timestamptz not null default now()
);

-- 2) Um "índice" deixa a busca do Top 10 rápida, mesmo com muita gente.
create index scores_speed_score_idx on public.scores (speed, score desc);

-- 3) Segurança: liga o RLS (Row Level Security).
--    Com ele ligado, NADA é permitido, a não ser o que as policies abaixo liberarem.
alter table public.scores enable row level security;

-- 4) Permissão de acesso à tabela pela API (o Supabase exige isso explicitamente
--    em tabelas novas). Só ler e inserir. Ninguém pode editar nem apagar.
grant select, insert on table public.scores to anon;

-- 5) As regras (policies): qualquer jogador pode VER o ranking e ENVIAR pontuação.
create policy "Qualquer um pode ver o ranking"
  on public.scores for select to anon
  using (true);

create policy "Qualquer um pode enviar pontuacao"
  on public.scores for insert to anon
  with check (true);