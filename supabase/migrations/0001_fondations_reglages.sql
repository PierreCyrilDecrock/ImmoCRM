-- 0001_fondations_reglages
-- Fondations de la base : fonction utilitaire commune et table « reglages ».
-- Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- Fonction utilitaire : met à jour « updated_at » à chaque modification.
-- À brancher sur chaque table par un déclencheur « before update ».
-- ---------------------------------------------------------------------------
create or replace function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.maj_updated_at() is
  'Déclencheur : inscrit la date de dernière modification dans updated_at.';

-- La fonction ne sert qu'aux déclencheurs : personne n'a besoin de l'appeler directement.
revoke all on function public.maj_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Table « reglages » : les préférences de l'utilisateur, une seule ligne par compte.
-- Pas de colonne archived_at : des réglages se modifient, ils ne s'archivent pas.
-- ---------------------------------------------------------------------------
create table public.reglages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nom_affiche text not null default '' check (char_length(nom_affiche) <= 80),
  constraint reglages_une_ligne_par_utilisateur unique (user_id)
);

comment on table public.reglages is
  'Préférences de l''utilisateur. Une ligne par compte.';
comment on column public.reglages.nom_affiche is
  'Nom du mandataire tel qu''il apparaît dans l''application et, plus tard, dans ses messages.';

create trigger reglages_maj_updated_at
  before update on public.reglages
  for each row execute function public.maj_updated_at();

-- Droits : rien pour un visiteur sans session ; lecture, création et modification
-- pour un compte connecté (pas de suppression).
revoke all on table public.reglages from public, anon, authenticated;
grant select, insert, update on table public.reglages to authenticated;

-- Règles d'accès par ligne : chacun ne voit et ne modifie que sa propre ligne.
alter table public.reglages enable row level security;

create policy reglages_lecture_proprietaire on public.reglages
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy reglages_creation_proprietaire on public.reglages
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy reglages_modification_proprietaire on public.reglages
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
