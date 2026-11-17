-- 0009_taches
-- Tâches et rendez-vous (étape 1.6).
--   1. Table « taches » : toute action à venir, avec une date et un motif. Un rendez-vous est
--      une tâche qui a une heure (pas d'objet séparé). Liens facultatifs vers un contact et un
--      bien ; le lien vers un projet viendra avec les projets (étape 1.9).
--   2. Fonction « cloturer_tache » : marque une tâche faite ou annulée et, pour une tâche
--      récurrente, crée l'occurrence suivante dans la même opération (tout ou rien).
--   3. La fusion de deux contacts transfère les tâches de la fiche absorbée à la fiche gardée.
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « taches »
-- ---------------------------------------------------------------------------
create table public.taches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Ce qu'il faut faire, et pourquoi
  titre text not null
    constraint taches_titre_renseigne check (btrim(titre) <> '')
    constraint taches_titre_longueur check (char_length(titre) <= 200),
  motif text not null default ''
    constraint taches_motif_longueur check (char_length(motif) <= 2000),
  categorie text not null default 'autre'
    constraint taches_categorie_connue check (categorie in (
      'relance', 'rendez_vous', 'visite', 'estimation', 'administratif', 'prospection', 'autre'
    )),
  priorite smallint not null default 2
    constraint taches_priorite_connue check (priorite between 1 and 3),

  -- Quand et où
  echeance date not null,
  heure time
    constraint taches_heure_ronde check (heure = date_trunc('minute', heure)),
  duree smallint
    constraint taches_duree_plausible check (duree between 1 and 1440),
  lieu text not null default ''
    constraint taches_lieu_longueur check (char_length(lieu) <= 300),

  -- Où en est la tâche
  etat text not null default 'a_faire'
    constraint taches_etat_connu check (etat in ('a_faire', 'faite', 'annulee')),
  cloturee_le timestamptz,

  -- Liens facultatifs
  contact_id uuid,
  bien_id uuid,

  -- Récurrence
  recurrence text
    constraint taches_recurrence_connue
      check (recurrence in ('jour', 'semaine', 'deux_semaines', 'mois', 'an')),
  recurrence_ancre date,
  recurrence_rang integer not null default 0
    constraint taches_recurrence_rang_positif check (recurrence_rang >= 0),

  -- Une durée n'a de sens qu'avec une heure de début.
  constraint taches_duree_avec_heure check (duree is null or heure is not null),
  -- Une tâche close porte la date de sa clôture ; une tâche à faire n'en a pas.
  constraint taches_cloture_coherente check ((etat = 'a_faire') = (cloturee_le is null)),
  -- Une tâche récurrente connaît le point de départ de sa série.
  constraint taches_recurrence_complete check ((recurrence is null) = (recurrence_ancre is null)),

  -- Le contact et le bien appartiennent au même compte que la tâche.
  constraint taches_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade,
  constraint taches_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.taches is
  'Tâches et rendez-vous : toute action à venir, avec une date et un motif. Un rendez-vous est une tâche qui a une heure.';
comment on column public.taches.motif is 'Pourquoi cette tâche : le contexte à avoir sous les yeux.';
comment on column public.taches.categorie is
  'relance, rendez_vous, visite, estimation, administratif, prospection, autre.';
comment on column public.taches.priorite is '1 : haute, 2 : normale, 3 : basse.';
comment on column public.taches.echeance is 'Jour où la tâche est à faire.';
comment on column public.taches.heure is
  'Heure de début, à l''heure de Paris (heure affichée sur la montre). Vide : tâche sans heure.';
comment on column public.taches.duree is 'Durée prévue, en minutes. Seulement avec une heure.';
comment on column public.taches.etat is 'a_faire, faite, annulee.';
comment on column public.taches.cloturee_le is 'Moment où la tâche a été faite ou annulée.';
comment on column public.taches.recurrence is
  'Vide : tâche unique. Sinon jour, semaine, deux_semaines, mois ou an.';
comment on column public.taches.recurrence_ancre is
  'Date de la première occurrence de la série : les suivantes en sont déduites (le 31 du mois reste le 31, ou le dernier jour du mois).';
comment on column public.taches.recurrence_rang is
  'Place de cette occurrence dans la série : 0 pour la première, 1 pour la suivante…';

create index taches_user_id_idx on public.taches (user_id);
-- Vues de la page Tâches : les tâches à faire, par date puis par heure.
create index taches_a_faire_idx
  on public.taches (user_id, echeance, heure, priorite, created_at, id)
  where etat = 'a_faire' and archived_at is null;
-- Vue « Terminées » : les plus récemment closes d'abord.
create index taches_closes_idx
  on public.taches (user_id, cloturee_le desc, id)
  where etat <> 'a_faire' and archived_at is null;
-- Rubriques Tâches des fiches Contact et Bien.
create index taches_contact_idx on public.taches (user_id, contact_id) where contact_id is not null;
create index taches_bien_idx on public.taches (user_id, bien_id) where bien_id is not null;

create trigger taches_maj_updated_at
  before update on public.taches
  for each row execute function public.maj_updated_at();

revoke all on table public.taches from public, anon, authenticated;
grant select, insert, update on table public.taches to authenticated;

alter table public.taches enable row level security;

create policy taches_lecture_proprietaire on public.taches
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy taches_creation_proprietaire on public.taches
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy taches_modification_proprietaire on public.taches
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Clôture d'une tâche : faite ou annulée. Pour une tâche récurrente, l'application
-- calcule la date de l'occurrence suivante (règles testées dans
-- src/features/taches/recurrence.ts) et la passe ici : la clôture et la création de la
-- suivante réussissent ensemble, ou rien ne change. Une tâche déjà close est refusée, ce qui
-- évite de créer deux fois la suivante (double appui, deux appareils).
-- S'exécute avec les droits du compte connecté : les règles d'accès par ligne s'appliquent.
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
      contact_id, bien_id, recurrence, recurrence_ancre, recurrence_rang
    )
    values (
      t.user_id, t.titre, t.motif, t.categorie, t.priorite, p_suivante_echeance, t.heure,
      t.duree, t.lieu, t.contact_id, t.bien_id, t.recurrence, t.recurrence_ancre,
      p_suivante_rang
    )
    returning *;
end;
$$;

comment on function public.cloturer_tache(uuid, text, date, integer) is
  'Marque une tâche faite ou annulée ; pour une tâche récurrente, crée l''occurrence suivante à la date donnée. Renvoie l''occurrence créée, ou rien.';

revoke all on function public.cloturer_tache(uuid, text, date, integer) from public, anon;
grant execute on function public.cloturer_tache(uuid, text, date, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fusion de deux contacts : même fonction qu'à la migration 0007, complétée par le
-- transfert des tâches de la fiche absorbée vers la fiche gardée.
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
