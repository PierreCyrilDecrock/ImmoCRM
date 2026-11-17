-- 0016_ecran_aujourdhui
-- Écran « Aujourd'hui » (étape 1.11).
--   1. Table « priorites_du_jour » : les trois actions qui comptent, choisies librement
--      chaque matin, avec leur case « faite ». Une ligne par jour ; elle se retrouve sur le
--      téléphone, la tablette et l'ordinateur.
--   2. Fonction « dernieres_activites » : la dernière activité de chaque contact d'une liste
--      (bloc « À relancer »), en une seule lecture.
--   3. Fonction « projets_sans_activite » : les projets vendeurs et acquéreurs en cours sans
--      activité depuis 15 jours (bloc « Alertes »), les plus anciens d'abord, avec leur nombre.
-- Les deux fonctions s'exécutent avec les droits du compte connecté : les règles d'accès
-- par ligne s'appliquent. Aucune donnée existante n'est modifiée ni supprimée.
-- Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « priorites_du_jour »
-- ---------------------------------------------------------------------------
create table public.priorites_du_jour (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Le jour, à Paris
  jour date not null,

  -- Les trois actions, dans l'ordre choisi ; vide : pas encore choisie
  action_1 text not null default ''
    constraint priorites_du_jour_action_1_longueur check (char_length(action_1) <= 200),
  action_2 text not null default ''
    constraint priorites_du_jour_action_2_longueur check (char_length(action_2) <= 200),
  action_3 text not null default ''
    constraint priorites_du_jour_action_3_longueur check (char_length(action_3) <= 200),
  faite_1 boolean not null default false,
  faite_2 boolean not null default false,
  faite_3 boolean not null default false,

  -- Une ligne par jour et par compte
  constraint priorites_du_jour_un_jour unique (user_id, jour),
  -- Seule une action écrite peut être faite.
  constraint priorites_du_jour_faite_1_ecrite check (not faite_1 or btrim(action_1) <> ''),
  constraint priorites_du_jour_faite_2_ecrite check (not faite_2 or btrim(action_2) <> ''),
  constraint priorites_du_jour_faite_3_ecrite check (not faite_3 or btrim(action_3) <> '')
);

comment on table public.priorites_du_jour is
  'Les trois actions qui comptent, choisies chaque matin sur l''écran Aujourd''hui. Une ligne par jour.';
comment on column public.priorites_du_jour.jour is 'Jour concerné, à Paris.';
comment on column public.priorites_du_jour.action_1 is 'Première action ; vide si non choisie.';
comment on column public.priorites_du_jour.faite_1 is 'La première action est faite.';

-- La contrainte d'unicité (user_id, jour) sert aussi d'index de lecture.

create trigger priorites_du_jour_maj_updated_at
  before update on public.priorites_du_jour
  for each row execute function public.maj_updated_at();

-- Droits : rien pour un visiteur sans session ; lecture, création et modification pour un
-- compte connecté (pas de suppression).
revoke all on table public.priorites_du_jour from public, anon, authenticated;
grant select, insert, update on table public.priorites_du_jour to authenticated;

-- Règles d'accès par ligne : chacun ne voit et ne modifie que ses propres lignes.
alter table public.priorites_du_jour enable row level security;

create policy priorites_du_jour_lecture_proprietaire on public.priorites_du_jour
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy priorites_du_jour_creation_proprietaire on public.priorites_du_jour
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy priorites_du_jour_modification_proprietaire on public.priorites_du_jour
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Fonction « dernieres_activites »
-- ---------------------------------------------------------------------------
-- Pour chaque contact de la liste (200 au plus), sa dernière activité au journal (notes
-- comprises), ou rien s'il n'en a pas. Une activité retirée (archivée) ne compte pas.
create or replace function public.dernieres_activites(p_contacts uuid[])
returns setof public.activites
language sql
stable
set search_path = ''
as $$
  select distinct on (a.contact_id) a.*
  from public.activites a
  where a.contact_id = any (p_contacts[1:200])
    and a.archived_at is null
  order by a.contact_id, a.date_activite desc, a.heure desc, a.created_at desc, a.id desc;
$$;

comment on function public.dernieres_activites(uuid[]) is
  'Écran Aujourd''hui : la dernière activité de chaque contact d''une liste (200 au plus).';

revoke all on function public.dernieres_activites(uuid[]) from public, anon, authenticated;
grant execute on function public.dernieres_activites(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fonction « projets_sans_activite »
-- ---------------------------------------------------------------------------
-- Les projets en cours (état « actif », non archivés) dont la dernière activité date d'au
-- moins `p_jours` jours. La dernière activité est la plus récente du journal liée au projet
-- ou à son contact principal, notes exclues (comme la date du dernier contact) ; l'entrée
-- dans l'étape en cours compte aussi comme une activité (un projet qui vient d'avancer, ou
-- d'être créé, n'est pas signalé). Les plus anciens d'abord, `p_limite` lignes au plus
-- (50 au maximum) ; `total` donne le nombre de projets concernés.
create or replace function public.projets_sans_activite(
  p_aujourdhui date default ((now() at time zone 'Europe/Paris')::date),
  p_jours integer default 15,
  p_limite integer default 10
)
returns table (
  genre text,
  projet_id uuid,
  contact_id uuid,
  bien_id uuid,
  etape text,
  calme_depuis date,
  derniere_activite_le date,
  total bigint
)
language sql
stable
set search_path = ''
as $$
  with projets as (
    select 'vendeur'::text as genre, p.id, p.contact_id, p.bien_id, p.etape, p.etape_le
    from public.projets_vendeurs p
    where p.etat = 'actif' and p.archived_at is null
    union all
    select 'acquereur'::text, p.id, p.contact_id, p.bien_origine_id, p.etape, p.etape_le
    from public.projets_acquereurs p
    where p.etat = 'actif' and p.archived_at is null
  ),
  avec_activite as (
    select pr.*,
      greatest(
        (select max(a.date_activite) from public.activites a
          where pr.genre = 'vendeur' and a.projet_vendeur_id = pr.id
            and a.archived_at is null and a.type <> 'note'),
        (select max(a.date_activite) from public.activites a
          where pr.genre = 'acquereur' and a.projet_acquereur_id = pr.id
            and a.archived_at is null and a.type <> 'note'),
        (select max(a.date_activite) from public.activites a
          where a.contact_id = pr.contact_id
            and a.archived_at is null and a.type <> 'note')
      ) as derniere
    from projets pr
  ),
  calmes as (
    select aa.*, greatest(aa.derniere, aa.etape_le) as depuis
    from avec_activite aa
    where greatest(aa.derniere, aa.etape_le) <= p_aujourdhui - greatest(p_jours, 1)
  )
  select c.genre, c.id, c.contact_id, c.bien_id, c.etape, c.depuis, c.derniere,
         count(*) over ()
  from calmes c
  order by c.depuis, c.genre, c.id
  limit least(greatest(p_limite, 0), 50);
$$;

comment on function public.projets_sans_activite(date, integer, integer) is
  'Écran Aujourd''hui : projets en cours sans activité depuis p_jours jours, les plus anciens d''abord.';

revoke all on function public.projets_sans_activite(date, integer, integer)
  from public, anon, authenticated;
grant execute on function public.projets_sans_activite(date, integer, integer) to authenticated;
