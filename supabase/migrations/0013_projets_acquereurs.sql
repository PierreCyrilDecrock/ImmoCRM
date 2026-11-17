-- 0013_projets_acquereurs
-- Projets acquéreurs et pipeline acquéreur (étape 1.10). Un projet acquéreur est une
-- recherche : critères, budget, financement, urgence. Un même contact peut en avoir
-- plusieurs, et peut être aussi vendeur (une fiche, plusieurs projets).
--   1. Table « projets_acquereurs » : contact principal, co-acquéreur facultatif, étape du
--      pipeline (demande, qualification, sélection, visites) et date d'entrée dans l'étape
--      (tenue par la base), critères de recherche, financement, origine de la demande
--      (canal, portail, bien concerné, heure de réception), état (actif, à recontacter,
--      perdu, gagné : offre acceptée). Les critères de sortie sont vérifiés par la base.
--   2. Table « biens_proposes » : les biens proposés à un acquéreur, avec la date et sa
--      réaction (intéressé, à visiter, refusé avec la raison).
--   3. Les tâches et les activités peuvent être liées à un projet acquéreur. Une visite est
--      une activité de type « visite », avec un compte rendu structuré (points positifs et
--      négatifs, niveau d'intérêt, suite envisagée).
--   4. Fonctions « planifier_visite » (rendez-vous de visite, bien noté « à visiter ») et
--      « sortir_projet_acquereur » (à recontacter avec sa relance, ou perdu avec son motif).
--   5. La clôture d'une tâche et la boucle de relance gardent le lien vers le projet ; la
--      boucle enregistre le compte rendu structuré d'une visite.
--   6. La fusion de deux contacts transfère les projets acquéreurs de la fiche absorbée
--      (comme acquéreur principal ou comme co-acquéreur).
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « projets_acquereurs »
-- ---------------------------------------------------------------------------
create table public.projets_acquereurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Qui cherche
  contact_id uuid not null,
  co_acquereur_id uuid,

  -- Où en est le projet
  etape text not null default 'demande'
    constraint projets_acquereurs_etape_connue
      check (etape in ('demande', 'qualification', 'selection', 'visites')),
  etape_le date not null default ((now() at time zone 'Europe/Paris')::date),
  etat text not null default 'actif'
    constraint projets_acquereurs_etat_connu
      check (etat in ('actif', 'a_recontacter', 'perdu', 'gagne')),

  -- Origine de la demande
  origine text
    constraint projets_acquereurs_origine_connue check (origine in (
      'appel', 'portail', 'courriel', 'site', 'recommandation', 'autre'
    )),
  portail text not null default ''
    constraint projets_acquereurs_portail_longueur check (char_length(portail) <= 100),
  bien_origine_id uuid,
  recue_le timestamptz,

  -- Ce qu'il cherche
  types_biens text[] not null default '{}'
    constraint projets_acquereurs_types_connus check (
      types_biens <@ array['ancien', 'neuf', 'viager', 'commerce', 'terrain']::text[]
    ),
  secteurs text[] not null default '{}'
    constraint projets_acquereurs_secteurs_nombre check (cardinality(secteurs) <= 20),
  budget_min integer
    constraint projets_acquereurs_budget_min_plausible check (budget_min between 0 and 2000000000),
  budget_max integer
    constraint projets_acquereurs_budget_max_plausible check (budget_max between 0 and 2000000000),
  surface_min integer
    constraint projets_acquereurs_surface_plausible check (surface_min between 1 and 1000000),
  pieces_min smallint
    constraint projets_acquereurs_pieces_plausible check (pieces_min between 1 and 50),
  criteres_indispensables text not null default ''
    constraint projets_acquereurs_indispensables_longueur
      check (char_length(criteres_indispensables) <= 2000),
  criteres_souhaites text not null default ''
    constraint projets_acquereurs_souhaites_longueur check (char_length(criteres_souhaites) <= 2000),
  urgence text
    constraint projets_acquereurs_urgence_connue
      check (urgence in ('moins_3_mois', 'trois_six_mois', 'plus_6_mois', 'sans_date')),

  -- Financement
  financement text
    constraint projets_acquereurs_financement_connu check (financement in ('comptant', 'pret')),
  accord_principe boolean not null default false,
  apport integer
    constraint projets_acquereurs_apport_plausible check (apport between 0 and 2000000000),
  bien_a_vendre boolean not null default false,

  -- Sorties du pipeline
  recontacter_le date,
  motif_perte text
    constraint projets_acquereurs_motif_perte_connu check (motif_perte in (
      'achat_confrere', 'achat_particuliers', 'abandon', 'financement', 'autre'
    )),
  motif_perte_detail text not null default ''
    constraint projets_acquereurs_motif_perte_detail_longueur
      check (char_length(motif_perte_detail) <= 500),
  -- Gagné : l'offre acceptée (le dossier de transaction viendra en version 2)
  offre_bien_id uuid,
  offre_le date,

  notes text not null default ''
    constraint projets_acquereurs_notes_longueur check (char_length(notes) <= 5000),

  constraint projets_acquereurs_user_id_id_unique unique (user_id, id),

  constraint projets_acquereurs_co_acquereur_distinct check (co_acquereur_id <> contact_id),
  constraint projets_acquereurs_budget_ordonne
    check (budget_min is null or budget_max is null or budget_min <= budget_max),
  -- Chaque état porte ce qui le décrit, et seulement lui.
  constraint projets_acquereurs_recontacter_coherent
    check ((etat = 'a_recontacter') = (recontacter_le is not null)),
  constraint projets_acquereurs_perte_coherente
    check ((etat = 'perdu') = (motif_perte is not null)),
  constraint projets_acquereurs_gagne_coherent
    check ((etat = 'gagne') = (offre_le is not null)),
  constraint projets_acquereurs_gagne_apres_visites
    check (etat <> 'gagne' or etape = 'visites'),

  -- Critères de sortie : une étape suppose ceux des étapes précédentes.
  -- Demande → Qualification : l'origine de la demande et le budget sont connus.
  constraint projets_acquereurs_critere_demande
    check (etape = 'demande' or (origine is not null and budget_max is not null)),
  -- Qualification → Sélection : les critères (types, secteurs) et le financement.
  constraint projets_acquereurs_critere_qualification
    check (etape in ('demande', 'qualification')
           or (cardinality(types_biens) > 0 and cardinality(secteurs) > 0
               and financement is not null)),
  -- Sélection → Visites (au moins un bien proposé) et Visites → gagné (au moins une
  -- visite consignée) : vérifiés par le déclencheur « projets_acquereurs_verifier ».

  -- Les fiches liées appartiennent au même compte que le projet.
  constraint projets_acquereurs_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade,
  constraint projets_acquereurs_co_acquereur_fk
    foreign key (user_id, co_acquereur_id)
    references public.contacts (user_id, id)
    on delete set null (co_acquereur_id),
  constraint projets_acquereurs_bien_origine_fk
    foreign key (user_id, bien_origine_id)
    references public.biens (user_id, id)
    on delete set null (bien_origine_id),
  constraint projets_acquereurs_offre_bien_fk
    foreign key (user_id, offre_bien_id)
    references public.biens (user_id, id)
    on delete set null (offre_bien_id)
);

comment on table public.projets_acquereurs is
  'Projets acquéreurs : une recherche (critères, budget, financement, urgence), avec son étape dans le pipeline acquéreur.';
comment on column public.projets_acquereurs.contact_id is 'Contact principal : l''acquéreur.';
comment on column public.projets_acquereurs.co_acquereur_id is 'Co-acquéreur, facultatif.';
comment on column public.projets_acquereurs.etape is 'demande, qualification, selection, visites.';
comment on column public.projets_acquereurs.etape_le is
  'Jour d''entrée dans l''étape, à Paris. Tenu par la base.';
comment on column public.projets_acquereurs.etat is
  'actif (dans le pipeline), a_recontacter, perdu, gagne (offre acceptée).';
comment on column public.projets_acquereurs.origine is
  'Canal de la demande : appel, portail, courriel, site, recommandation, autre.';
comment on column public.projets_acquereurs.portail is 'Portail d''origine de la demande.';
comment on column public.projets_acquereurs.bien_origine_id is 'Bien concerné par la demande.';
comment on column public.projets_acquereurs.recue_le is 'Moment de réception de la demande.';
comment on column public.projets_acquereurs.types_biens is
  'Types de biens recherchés : ancien, neuf, viager, commerce, terrain.';
comment on column public.projets_acquereurs.secteurs is 'Secteurs ou communes recherchés.';
comment on column public.projets_acquereurs.urgence is
  'moins_3_mois, trois_six_mois, plus_6_mois, sans_date.';
comment on column public.projets_acquereurs.financement is 'comptant ou pret.';
comment on column public.projets_acquereurs.accord_principe is
  'Accord de principe de la banque obtenu.';
comment on column public.projets_acquereurs.bien_a_vendre is
  'L''acquéreur doit vendre un bien avant d''acheter.';
comment on column public.projets_acquereurs.motif_perte is
  'État « perdu » : achat_confrere, achat_particuliers, abandon, financement, autre.';
comment on column public.projets_acquereurs.offre_bien_id is 'État « gagné » : bien de l''offre.';
comment on column public.projets_acquereurs.offre_le is
  'État « gagné » : jour où l''offre a été acceptée.';

create index projets_acquereurs_user_id_idx on public.projets_acquereurs (user_id);
-- Page Pipelines : les projets d'un état, par étape.
create index projets_acquereurs_pipeline_idx
  on public.projets_acquereurs (user_id, etat, etape, etape_le)
  where archived_at is null;
-- Rubriques des fiches Contact et Bien.
create index projets_acquereurs_contact_idx on public.projets_acquereurs (user_id, contact_id);
create index projets_acquereurs_co_acquereur_idx
  on public.projets_acquereurs (user_id, co_acquereur_id) where co_acquereur_id is not null;
create index projets_acquereurs_bien_origine_idx
  on public.projets_acquereurs (user_id, bien_origine_id) where bien_origine_id is not null;
create index projets_acquereurs_offre_bien_idx
  on public.projets_acquereurs (user_id, offre_bien_id) where offre_bien_id is not null;

create trigger projets_acquereurs_maj_updated_at
  before update on public.projets_acquereurs
  for each row execute function public.maj_updated_at();

-- La date d'entrée dans l'étape change avec l'étape, et seulement avec elle.
create or replace function public.projets_acquereurs_maj_etape_le()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.etape is distinct from old.etape then
    new.etape_le := (now() at time zone 'Europe/Paris')::date;
  else
    new.etape_le := old.etape_le;
  end if;
  return new;
end;
$$;

comment on function public.projets_acquereurs_maj_etape_le() is
  'Déclencheur : date d''entrée dans l''étape, remise au jour à chaque changement d''étape.';

revoke all on function public.projets_acquereurs_maj_etape_le() from public, anon, authenticated;

create trigger projets_acquereurs_maj_etape_le
  before update on public.projets_acquereurs
  for each row execute function public.projets_acquereurs_maj_etape_le();

revoke all on table public.projets_acquereurs from public, anon, authenticated;
grant select, insert, update on table public.projets_acquereurs to authenticated;

alter table public.projets_acquereurs enable row level security;

create policy projets_acquereurs_lecture_proprietaire on public.projets_acquereurs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy projets_acquereurs_creation_proprietaire on public.projets_acquereurs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy projets_acquereurs_modification_proprietaire on public.projets_acquereurs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Table « biens_proposes » : les biens proposés à un acquéreur et sa réaction.
-- Retirer un bien de la sélection l'archive.
-- ---------------------------------------------------------------------------
create table public.biens_proposes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  projet_acquereur_id uuid not null,
  bien_id uuid not null,
  propose_le date not null default ((now() at time zone 'Europe/Paris')::date),
  -- Vide : pas encore de réponse.
  reaction text
    constraint biens_proposes_reaction_connue
      check (reaction in ('interesse', 'a_visiter', 'refuse')),
  raison_refus text not null default ''
    constraint biens_proposes_raison_longueur check (char_length(raison_refus) <= 500),

  -- La raison n'existe que pour un refus.
  constraint biens_proposes_raison_si_refus check (raison_refus = '' or reaction = 'refuse'),

  constraint biens_proposes_projet_fk
    foreign key (user_id, projet_acquereur_id)
    references public.projets_acquereurs (user_id, id)
    on delete cascade,
  constraint biens_proposes_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.biens_proposes is
  'Biens proposés à un acquéreur (projet acquéreur), avec la date et sa réaction.';
comment on column public.biens_proposes.reaction is
  'interesse, a_visiter, refuse ; vide : pas encore de réponse.';
comment on column public.biens_proposes.raison_refus is 'Pourquoi le bien est refusé.';

create index biens_proposes_user_id_idx on public.biens_proposes (user_id);
create index biens_proposes_projet_idx on public.biens_proposes (user_id, projet_acquereur_id);
create index biens_proposes_bien_idx on public.biens_proposes (user_id, bien_id);
-- Un bien n'est proposé qu'une fois à un même projet.
create unique index biens_proposes_unique
  on public.biens_proposes (user_id, projet_acquereur_id, bien_id)
  where archived_at is null;

create trigger biens_proposes_maj_updated_at
  before update on public.biens_proposes
  for each row execute function public.maj_updated_at();

revoke all on table public.biens_proposes from public, anon, authenticated;
grant select, insert, update on table public.biens_proposes to authenticated;

alter table public.biens_proposes enable row level security;

create policy biens_proposes_lecture_proprietaire on public.biens_proposes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy biens_proposes_creation_proprietaire on public.biens_proposes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy biens_proposes_modification_proprietaire on public.biens_proposes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. Tâches et activités liées à un projet acquéreur ; compte rendu structuré des visites.
-- Si le projet disparaît (suppression définitive de son contact), le lien seul est vidé.
-- Une tâche ou une activité est liée à un projet au plus (de vente ou d'achat).
-- ---------------------------------------------------------------------------
alter table public.taches
  add column projet_acquereur_id uuid,
  add constraint taches_projet_acquereur_fk
    foreign key (user_id, projet_acquereur_id)
    references public.projets_acquereurs (user_id, id)
    on delete set null (projet_acquereur_id),
  add constraint taches_un_seul_projet
    check (projet_vendeur_id is null or projet_acquereur_id is null);

comment on column public.taches.projet_acquereur_id is 'Projet acquéreur lié, facultatif.';

create index taches_projet_acquereur_idx
  on public.taches (user_id, projet_acquereur_id) where projet_acquereur_id is not null;

alter table public.activites
  add column projet_acquereur_id uuid,
  add column visite_points_positifs text not null default ''
    constraint activites_visite_positifs_longueur check (char_length(visite_points_positifs) <= 2000),
  add column visite_points_negatifs text not null default ''
    constraint activites_visite_negatifs_longueur check (char_length(visite_points_negatifs) <= 2000),
  add column visite_interet text
    constraint activites_visite_interet_connu
      check (visite_interet in ('fort', 'moyen', 'faible', 'aucun')),
  add column visite_suite text
    constraint activites_visite_suite_connue check (visite_suite in (
      'offre', 'contre_visite', 'reflexion', 'autres_biens', 'abandon'
    )),
  add constraint activites_projet_acquereur_fk
    foreign key (user_id, projet_acquereur_id)
    references public.projets_acquereurs (user_id, id)
    on delete set null (projet_acquereur_id),
  add constraint activites_un_seul_projet
    check (projet_vendeur_id is null or projet_acquereur_id is null),
  -- Le compte rendu structuré n'existe que pour une visite.
  add constraint activites_compte_rendu_visite check (
    type = 'visite'
    or (visite_points_positifs = '' and visite_points_negatifs = ''
        and visite_interet is null and visite_suite is null)
  );

comment on column public.activites.projet_acquereur_id is 'Projet acquéreur lié, facultatif.';
comment on column public.activites.visite_points_positifs is 'Visite : ce qui a plu.';
comment on column public.activites.visite_points_negatifs is 'Visite : ce qui a déplu.';
comment on column public.activites.visite_interet is 'Visite : fort, moyen, faible, aucun.';
comment on column public.activites.visite_suite is
  'Visite : offre, contre_visite, reflexion, autres_biens, abandon.';

create index activites_projet_acquereur_idx
  on public.activites (user_id, projet_acquereur_id, date_activite desc, heure desc)
  where projet_acquereur_id is not null and archived_at is null;

-- Critères de sortie qui portent sur d'autres tables :
--   - arriver à « Visites » demande au moins un bien proposé ;
--   - gagner (offre acceptée) demande au moins une visite consignée au journal.
create or replace function public.projets_acquereurs_verifier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.etape = 'visites'
     and (tg_op = 'INSERT' or old.etape is distinct from 'visites')
     and not exists (
       select 1 from public.biens_proposes
       where projet_acquereur_id = new.id and archived_at is null
     ) then
    raise exception 'Proposez au moins un bien avant de passer aux visites.'
      using errcode = '23514';
  end if;
  if new.etat = 'gagne'
     and (tg_op = 'INSERT' or old.etat is distinct from 'gagne')
     and not exists (
       select 1 from public.activites
       where projet_acquereur_id = new.id and type = 'visite' and archived_at is null
     ) then
    raise exception 'Consignez au moins une visite avant de marquer l''offre acceptée.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function public.projets_acquereurs_verifier() is
  'Déclencheur : un projet n''arrive aux visites qu''avec un bien proposé, et n''est gagné qu''avec une visite consignée.';

revoke all on function public.projets_acquereurs_verifier() from public, anon, authenticated;

create trigger projets_acquereurs_verifier
  before insert or update on public.projets_acquereurs
  for each row execute function public.projets_acquereurs_verifier();

-- ---------------------------------------------------------------------------
-- 4a. Planifier une visite : un rendez-vous (tâche « visite » avec une heure) lié à
-- l'acquéreur, au bien et au projet ; le bien entre dans la sélection, noté « à visiter ».
-- Tout réussit ensemble, ou rien ne change. Renvoie le rendez-vous créé.
-- ---------------------------------------------------------------------------
create or replace function public.planifier_visite(
  p_projet uuid,
  p_bien uuid,
  p_echeance date,
  p_heure time,
  p_duree smallint default null,
  p_lieu text default '',
  p_titre text default null,
  p_motif text default ''
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  p public.projets_acquereurs;
begin
  select * into p
  from public.projets_acquereurs
  where id = p_projet and archived_at is null;
  if not found then
    raise exception 'Projet introuvable.' using errcode = 'P0002';
  end if;
  if p_echeance is null or p_heure is null then
    raise exception 'Choisissez le jour et l''heure de la visite.' using errcode = '22023';
  end if;

  -- Le bien entre dans la sélection, ou y passe « à visiter ».
  update public.biens_proposes
    set reaction = 'a_visiter', raison_refus = ''
    where projet_acquereur_id = p_projet and bien_id = p_bien and archived_at is null;
  if not found then
    insert into public.biens_proposes (user_id, projet_acquereur_id, bien_id, reaction)
    values (p.user_id, p_projet, p_bien, 'a_visiter');
  end if;

  return query
    insert into public.taches (
      user_id, titre, motif, categorie, echeance, heure, duree, lieu,
      contact_id, bien_id, projet_acquereur_id
    )
    values (
      p.user_id,
      coalesce(nullif(btrim(p_titre), ''), 'Visite'),
      coalesce(p_motif, ''),
      'visite',
      p_echeance,
      p_heure,
      p_duree,
      coalesce(p_lieu, ''),
      p.contact_id,
      p_bien,
      p.id
    )
    returning *;
end;
$$;

comment on function public.planifier_visite(uuid, uuid, date, time, smallint, text, text, text) is
  'Planifie une visite : rendez-vous lié à l''acquéreur, au bien et au projet ; le bien est noté « à visiter » dans la sélection.';

revoke all on function public.planifier_visite(uuid, uuid, date, time, smallint, text, text, text)
  from public, anon;
grant execute on function public.planifier_visite(uuid, uuid, date, time, smallint, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4b. Sorties du pipeline acquéreur, possibles à toute étape d'un projet actif :
--   - « À recontacter » : le projet sort du pipeline, une relance est créée à la date
--     choisie (liée à l'acquéreur et au projet) ;
--   - « Perdu » : le motif est enregistré.
-- ---------------------------------------------------------------------------
create or replace function public.sortir_projet_acquereur(
  p_id uuid,
  p_etat text,
  p_recontacter_le date default null,
  p_motif_perte text default null,
  p_motif_perte_detail text default '',
  p_relance_titre text default null,
  p_relance_motif text default ''
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  p public.projets_acquereurs;
begin
  select * into p
  from public.projets_acquereurs
  where id = p_id and archived_at is null
  for update;
  if not found then
    raise exception 'Projet introuvable.' using errcode = 'P0002';
  end if;
  if p.etat <> 'actif' then
    raise exception 'Ce projet n''est plus dans le pipeline.' using errcode = '22023';
  end if;

  if p_etat = 'a_recontacter' then
    if p_recontacter_le is null then
      raise exception 'Choisissez la date à laquelle recontacter l''acquéreur.'
        using errcode = '22023';
    end if;
    update public.projets_acquereurs
      set etat = 'a_recontacter', recontacter_le = p_recontacter_le
      where id = p_id;
    return query
      insert into public.taches (
        user_id, titre, motif, categorie, echeance, contact_id, projet_acquereur_id
      )
      values (
        p.user_id,
        coalesce(nullif(btrim(p_relance_titre), ''), 'Recontacter l''acquéreur'),
        coalesce(p_relance_motif, ''),
        'relance',
        p_recontacter_le,
        p.contact_id,
        p.id
      )
      returning *;
  elsif p_etat = 'perdu' then
    if p_motif_perte is null then
      raise exception 'Indiquez pourquoi le projet est perdu.' using errcode = '22023';
    end if;
    update public.projets_acquereurs
      set etat = 'perdu',
          motif_perte = p_motif_perte,
          motif_perte_detail = coalesce(p_motif_perte_detail, '')
      where id = p_id;
  else
    raise exception 'Sortie inconnue.' using errcode = '22023';
  end if;
end;
$$;

comment on function public.sortir_projet_acquereur(uuid, text, date, text, text, text, text) is
  'Sort un projet acquéreur du pipeline : à recontacter (avec sa relance) ou perdu (avec son motif).';

revoke all on function public.sortir_projet_acquereur(uuid, text, date, text, text, text, text)
  from public, anon;
grant execute on function public.sortir_projet_acquereur(uuid, text, date, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Clôture d'une tâche et boucle de relance : mêmes fonctions qu'à la migration 0012,
-- complétées par le lien vers le projet acquéreur et le compte rendu de visite.
-- ---------------------------------------------------------------------------
create or replace function public.cloturer_tache(
  p_id uuid,
  p_etat text,
  p_suivante_echeance date default null,
  p_suivante_rang integer default null
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  t public.taches;
begin
  if p_etat is null or p_etat not in ('faite', 'annulee') then
    raise exception 'Clôture impossible : état inconnu.' using errcode = '22023';
  end if;

  select * into t
  from public.taches
  where id = p_id and archived_at is null
  for update;
  if not found then
    raise exception 'Tâche introuvable.' using errcode = 'P0002';
  end if;
  if t.etat <> 'a_faire' then
    raise exception 'Cette tâche est déjà close.' using errcode = '22023';
  end if;

  update public.taches
    set etat = p_etat, cloturee_le = now()
    where id = p_id;

  if p_suivante_echeance is null then
    return;
  end if;

  if t.recurrence is null then
    raise exception 'Cette tâche n''est pas récurrente.' using errcode = '22023';
  end if;
  if p_suivante_echeance <= t.echeance
     or p_suivante_rang is null or p_suivante_rang <= t.recurrence_rang then
    raise exception 'Occurrence suivante incohérente.' using errcode = '22023';
  end if;

  return query
    insert into public.taches (
      user_id, titre, motif, categorie, priorite, echeance, heure, duree, lieu,
      contact_id, bien_id, projet_vendeur_id, projet_acquereur_id, recurrence,
      recurrence_ancre, recurrence_rang
    )
    values (
      t.user_id, t.titre, t.motif, t.categorie, t.priorite, p_suivante_echeance, t.heure,
      t.duree, t.lieu, t.contact_id, t.bien_id, t.projet_vendeur_id, t.projet_acquereur_id,
      t.recurrence, t.recurrence_ancre, p_suivante_rang
    )
    returning *;
end;
$$;

comment on function public.cloturer_tache(uuid, text, date, integer) is
  'Marque une tâche faite ou annulée ; pour une tâche récurrente, crée l''occurrence suivante à la date donnée. Renvoie l''occurrence créée, ou rien.';

revoke all on function public.cloturer_tache(uuid, text, date, integer) from public, anon;
grant execute on function public.cloturer_tache(uuid, text, date, integer) to authenticated;

-- La boucle de relance reçoit quatre paramètres de plus (compte rendu de visite) : l'ancienne
-- version est retirée, pour qu'un seul appel possible existe.
drop function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
);

create function public.boucler_tache(
  p_id uuid,
  p_type text,
  p_resultat text default null,
  p_compte_rendu text default '',
  p_suivante_echeance date default null,
  p_suivante_rang integer default null,
  p_prochaine_titre text default null,
  p_prochaine_categorie text default 'relance',
  p_prochaine_echeance date default null,
  p_prochaine_heure time default null,
  p_prochaine_motif text default '',
  p_temperature text default null,
  p_sans_prochaine_action boolean default false,
  p_visite_points_positifs text default '',
  p_visite_points_negatifs text default '',
  p_visite_interet text default null,
  p_visite_suite text default null
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  t public.taches;
  visite boolean := p_type = 'visite';
begin
  select * into t
  from public.taches
  where id = p_id and archived_at is null;
  if not found then
    raise exception 'Tâche introuvable.' using errcode = 'P0002';
  end if;
  if t.contact_id is null then
    raise exception 'Cette tâche n''est liée à aucun contact.' using errcode = '22023';
  end if;
  if p_prochaine_titre is not null and coalesce(p_sans_prochaine_action, false) then
    raise exception 'Choix contradictoire : une prochaine action et son refus.'
      using errcode = '22023';
  end if;
  if p_prochaine_titre is not null and p_prochaine_echeance is null then
    raise exception 'La prochaine action n''a pas de date.' using errcode = '22023';
  end if;

  -- 1. La tâche est faite (refusée si elle est déjà close : pas de double boucle).
  return query
    select * from public.cloturer_tache(p_id, 'faite', p_suivante_echeance, p_suivante_rang);

  -- 2. Ce qui s'est passé entre dans le journal, daté de maintenant ; pour une visite, avec
  -- son compte rendu structuré.
  insert into public.activites (
    user_id, type, resultat, compte_rendu, contact_id, bien_id, projet_vendeur_id,
    projet_acquereur_id, visite_points_positifs, visite_points_negatifs, visite_interet,
    visite_suite
  )
  values (
    t.user_id, p_type, p_resultat, coalesce(p_compte_rendu, ''), t.contact_id, t.bien_id,
    t.projet_vendeur_id, t.projet_acquereur_id,
    case when visite then coalesce(p_visite_points_positifs, '') else '' end,
    case when visite then coalesce(p_visite_points_negatifs, '') else '' end,
    case when visite then p_visite_interet end,
    case when visite then p_visite_suite end
  );

  -- 3. La température, si elle a changé pendant l'échange.
  if p_temperature is not null then
    update public.contacts
      set temperature = p_temperature
      where id = t.contact_id and temperature is distinct from p_temperature;
  end if;

  -- 4. La suite.
  if p_prochaine_titre is not null then
    return query
      insert into public.taches (
        user_id, titre, motif, categorie, echeance, heure, contact_id, bien_id,
        projet_vendeur_id, projet_acquereur_id
      )
      values (
        t.user_id, p_prochaine_titre, coalesce(p_prochaine_motif, ''), p_prochaine_categorie,
        p_prochaine_echeance, p_prochaine_heure, t.contact_id, t.bien_id,
        t.projet_vendeur_id, t.projet_acquereur_id
      )
      returning *;
  elsif coalesce(p_sans_prochaine_action, false) then
    -- Le refus n'est noté que si plus rien n'est prévu pour ce contact.
    update public.contacts
      set sans_prochaine_action_le = now()
      where id = t.contact_id and prochaine_action_le is null;
  elsif not exists (
    select 1 from public.taches
    where contact_id = t.contact_id and etat = 'a_faire' and archived_at is null
  ) then
    raise exception 'Prévoyez la prochaine action, ou confirmez qu''il n''y en aura pas.'
      using errcode = '22023';
  end if;
end;
$$;

comment on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text
) is
  'Boucle de relance : tâche faite, activité consignée (avec le compte rendu d''une visite), prochaine action créée (ou refus confirmé), en une seule opération.';

revoke all on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text
) from public, anon;
grant execute on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Fusion de deux contacts : même fonction qu'à la migration 0012, complétée par le
-- transfert des projets acquéreurs de la fiche absorbée (acquéreur principal ou
-- co-acquéreur). Une fiche ne peut pas être son propre co-acquéreur : le lien est alors vidé.
-- ---------------------------------------------------------------------------
create or replace function public.fusionner_contacts(
  p_garde uuid,
  p_absorbe uuid,
  p_valeurs jsonb
)
returns public.contacts
language plpgsql
set search_path = ''
as $$
declare
  v public.contacts;
  resultat public.contacts;
  nb integer;
begin
  if p_garde is null or p_absorbe is null or p_garde = p_absorbe then
    raise exception 'Fusion impossible : il faut deux fiches différentes.' using errcode = '22023';
  end if;

  -- Verrouille les deux fiches le temps de la fusion.
  select count(*) into nb
  from (
    select 1 from public.contacts
    where id in (p_garde, p_absorbe) and fusionne_dans_id is null
    for update
  ) fiches;
  if nb <> 2 then
    raise exception 'Fusion impossible : fiche introuvable ou déjà fusionnée.' using errcode = '22023';
  end if;

  v := jsonb_populate_record(null::public.contacts, p_valeurs);

  update public.contacts
    set recommande_par_id = p_garde
    where recommande_par_id = p_absorbe and id <> p_garde;

  -- Les appels sans accord de la fiche absorbée suivent la personne.
  update public.appels_sans_accord
    set contact_id = p_garde
    where contact_id = p_absorbe;

  -- Les biens de la fiche absorbée suivent la personne. Bien déjà possédé par la fiche
  -- gardée : le lien en double est archivé.
  update public.biens_proprietaires a
    set archived_at = now()
    where a.contact_id = p_absorbe
      and a.archived_at is null
      and exists (
        select 1 from public.biens_proprietaires g
        where g.contact_id = p_garde and g.bien_id = a.bien_id and g.archived_at is null
      );
  update public.biens_proprietaires
    set contact_id = p_garde
    where contact_id = p_absorbe;

  -- Les tâches de la fiche absorbée suivent la personne.
  update public.taches
    set contact_id = p_garde
    where contact_id = p_absorbe;

  -- Le journal de la fiche absorbée suit la personne (la date du dernier contact de la
  -- fiche gardée est recalculée en même temps).
  update public.activites
    set contact_id = p_garde
    where contact_id = p_absorbe;

  -- Les projets vendeurs de la fiche absorbée suivent la personne.
  update public.projets_vendeurs
    set contact_id = p_garde
    where contact_id = p_absorbe;

  -- Les projets acquéreurs aussi, comme acquéreur principal ou comme co-acquéreur.
  update public.projets_acquereurs
    set contact_id = p_garde,
        co_acquereur_id = nullif(co_acquereur_id, p_garde)
    where contact_id = p_absorbe;
  update public.projets_acquereurs
    set co_acquereur_id = nullif(p_garde, contact_id)
    where co_acquereur_id = p_absorbe;

  update public.contacts
    set archived_at = coalesce(archived_at, now()),
        fusionne_dans_id = p_garde
    where id = p_absorbe;

  update public.contacts
    set type = v.type,
        civilite = v.civilite,
        prenom = v.prenom,
        nom = v.nom,
        raison_sociale = v.raison_sociale,
        telephones = v.telephones,
        courriels = v.courriels,
        adresse = v.adresse,
        code_postal = v.code_postal,
        ville = v.ville,
        notes = v.notes,
        roles = v.roles,
        etiquettes = v.etiquettes,
        source = v.source,
        source_detail = v.source_detail,
        -- Une fiche ne peut être recommandée ni par elle-même, ni par celle qu'elle absorbe.
        recommande_par_id = nullif(nullif(v.recommande_par_id, p_garde), p_absorbe),
        temperature = v.temperature,
        -- Consentement : ce que l'application n'envoie pas reste tel quel sur la fiche gardée.
        collecte_origine = coalesce(v.collecte_origine, collecte_origine),
        collecte_date = coalesce(v.collecte_date, collecte_date),
        accord_appel = coalesce(v.accord_appel, accord_appel),
        accord_appel_date = case when v.accord_appel is null then accord_appel_date else v.accord_appel_date end,
        accord_appel_preuve = case when v.accord_appel is null then accord_appel_preuve else coalesce(v.accord_appel_preuve, '') end,
        client_existant = coalesce(v.client_existant, client_existant),
        opposition_demarchage = coalesce(v.opposition_demarchage, opposition_demarchage),
        opposition_demarchage_date = case when v.opposition_demarchage is null then opposition_demarchage_date else v.opposition_demarchage_date end
    where id = p_garde
    returning * into resultat;

  return resultat;
end;
$$;

comment on function public.fusionner_contacts(uuid, uuid, jsonb) is
  'Fusionne deux contacts : la fiche gardée reçoit les valeurs réunies, l''autre est archivée et pointe vers elle.';

revoke all on function public.fusionner_contacts(uuid, uuid, jsonb) from public, anon;
grant execute on function public.fusionner_contacts(uuid, uuid, jsonb) to authenticated;
