-- 0012_projets_vendeurs
-- Projets vendeurs et pipeline vendeur (étape 1.9). Un projet vendeur est l'intention de
-- vendre un bien donné ; un même contact peut en avoir plusieurs, un par bien.
--   1. Table « projets_vendeurs » : contact principal, bien, étape du pipeline et date
--      d'entrée dans l'étape (tenue par la base), motif de vente, échéance souhaitée, prix
--      espéré, estimation, avis de valeur, concurrence, mandat signé (type et date), état
--      (actif, à recontacter, perdu, gagné). Les critères de sortie de chaque étape sont
--      vérifiés par la base : un projet ne peut pas être à une étape sans les informations
--      des étapes précédentes.
--   2. Les tâches et les activités peuvent être liées à un projet vendeur.
--   3. Fonction « sortir_projet_vendeur » : « À recontacter » (avec la tâche de relance) ou
--      « Perdu » (avec son motif, et une relance avant la fin d'un mandat concurrent), en
--      une seule opération.
--   4. La clôture d'une tâche et la boucle de relance gardent le lien vers le projet.
--   5. La fusion de deux contacts transfère les projets de la fiche absorbée.
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « projets_vendeurs »
-- ---------------------------------------------------------------------------
create table public.projets_vendeurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Qui vend quoi
  contact_id uuid not null,
  bien_id uuid not null,

  -- Où en est le projet
  etape text not null default 'premier_contact'
    constraint projets_vendeurs_etape_connue check (etape in (
      'premier_contact', 'decouverte', 'estimation', 'suivi', 'mandat_signe'
    )),
  etape_le date not null default ((now() at time zone 'Europe/Paris')::date),
  etat text not null default 'actif'
    constraint projets_vendeurs_etat_connu
      check (etat in ('actif', 'a_recontacter', 'perdu', 'gagne')),

  -- Découverte
  motif_vente text not null default ''
    constraint projets_vendeurs_motif_longueur check (char_length(motif_vente) <= 500),
  echeance_souhaitee date,
  prix_espere integer
    constraint projets_vendeurs_prix_espere_plausible check (prix_espere between 0 and 2000000000),

  -- Estimation et avis de valeur
  estimation_basse integer
    constraint projets_vendeurs_estimation_basse_plausible
      check (estimation_basse between 0 and 2000000000),
  estimation_haute integer
    constraint projets_vendeurs_estimation_haute_plausible
      check (estimation_haute between 0 and 2000000000),
  estimation_le date,
  avis_remis_le date,

  -- Concurrence
  agences_consultees text not null default ''
    constraint projets_vendeurs_agences_longueur check (char_length(agences_consultees) <= 500),
  mandat_ailleurs boolean not null default false,
  mandat_ailleurs_fin date,

  -- Mandat signé (le détail du mandat viendra en version 2)
  mandat_type text
    constraint projets_vendeurs_mandat_type_connu check (mandat_type in ('simple', 'exclusif')),
  mandat_le date,

  -- Sorties du pipeline
  recontacter_le date,
  motif_perte text
    constraint projets_vendeurs_motif_perte_connu check (motif_perte in (
      'mandat_ailleurs', 'vente_particuliers', 'abandon', 'achat_confrere', 'autre'
    )),
  motif_perte_detail text not null default ''
    constraint projets_vendeurs_motif_perte_detail_longueur
      check (char_length(motif_perte_detail) <= 500),

  notes text not null default ''
    constraint projets_vendeurs_notes_longueur check (char_length(notes) <= 5000),

  constraint projets_vendeurs_user_id_id_unique unique (user_id, id),

  -- Une fourchette va du bas vers le haut.
  constraint projets_vendeurs_fourchette_ordonnee
    check (estimation_basse is null or estimation_haute is null
           or estimation_basse <= estimation_haute),
  -- La fin d'un mandat concurrent suppose un mandat concurrent.
  constraint projets_vendeurs_mandat_ailleurs_coherent
    check (mandat_ailleurs_fin is null or mandat_ailleurs),
  -- Chaque état porte ce qui le décrit, et seulement lui.
  constraint projets_vendeurs_recontacter_coherent
    check ((etat = 'a_recontacter') = (recontacter_le is not null)),
  constraint projets_vendeurs_perte_coherente
    check ((etat = 'perdu') = (motif_perte is not null)),
  constraint projets_vendeurs_gagne_coherent
    check ((etat = 'gagne') = (etape = 'mandat_signe')),

  -- Critères de sortie : une étape suppose ceux des étapes précédentes.
  -- Découverte → Estimation : le motif et le délai sont connus.
  constraint projets_vendeurs_critere_decouverte
    check (etape in ('premier_contact', 'decouverte')
           or (btrim(motif_vente) <> '' and echeance_souhaitee is not null)),
  -- Estimation → Suivi : l'avis de valeur est remis.
  constraint projets_vendeurs_critere_estimation
    check (etape in ('premier_contact', 'decouverte', 'estimation')
           or (estimation_basse is not null and estimation_haute is not null
               and avis_remis_le is not null)),
  -- Mandat signé : son type et sa date.
  constraint projets_vendeurs_critere_mandat
    check (etape <> 'mandat_signe' or (mandat_type is not null and mandat_le is not null)),

  -- Le contact et le bien appartiennent au même compte que le projet.
  constraint projets_vendeurs_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade,
  constraint projets_vendeurs_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.projets_vendeurs is
  'Projets vendeurs : l''intention de vendre un bien donné, avec son étape dans le pipeline vendeur.';
comment on column public.projets_vendeurs.contact_id is 'Contact principal : le vendeur.';
comment on column public.projets_vendeurs.etape is
  'premier_contact, decouverte, estimation, suivi, mandat_signe.';
comment on column public.projets_vendeurs.etape_le is
  'Jour d''entrée dans l''étape, à Paris. Tenu par la base.';
comment on column public.projets_vendeurs.etat is
  'actif (dans le pipeline), a_recontacter, perdu, gagne (mandat signé).';
comment on column public.projets_vendeurs.echeance_souhaitee is
  'Date à laquelle le vendeur souhaite avoir vendu.';
comment on column public.projets_vendeurs.prix_espere is 'Prix espéré par le vendeur, en euros.';
comment on column public.projets_vendeurs.avis_remis_le is
  'Jour de remise de l''avis de valeur au vendeur.';
comment on column public.projets_vendeurs.agences_consultees is
  'Autres agences consultées par le vendeur.';
comment on column public.projets_vendeurs.mandat_ailleurs is
  'Le vendeur a signé un mandat avec une autre agence.';
comment on column public.projets_vendeurs.mandat_ailleurs_fin is
  'Fin du mandat concurrent : une relance est prévue peu avant.';
comment on column public.projets_vendeurs.mandat_type is 'Mandat signé : simple ou exclusif.';
comment on column public.projets_vendeurs.mandat_le is 'Jour de signature du mandat.';
comment on column public.projets_vendeurs.recontacter_le is
  'État « à recontacter » : jour de la relance.';
comment on column public.projets_vendeurs.motif_perte is
  'État « perdu » : mandat_ailleurs, vente_particuliers, abandon, achat_confrere, autre.';

create index projets_vendeurs_user_id_idx on public.projets_vendeurs (user_id);
-- Page Pipelines : les projets d'un état, par étape.
create index projets_vendeurs_pipeline_idx
  on public.projets_vendeurs (user_id, etat, etape, etape_le)
  where archived_at is null;
-- Rubriques Projets des fiches Contact et Bien.
create index projets_vendeurs_contact_idx on public.projets_vendeurs (user_id, contact_id);
create index projets_vendeurs_bien_idx on public.projets_vendeurs (user_id, bien_id);
-- Un seul projet en cours (ou à recontacter) par bien.
create unique index projets_vendeurs_bien_en_cours_unique
  on public.projets_vendeurs (user_id, bien_id)
  where etat in ('actif', 'a_recontacter') and archived_at is null;

create trigger projets_vendeurs_maj_updated_at
  before update on public.projets_vendeurs
  for each row execute function public.maj_updated_at();

-- La date d'entrée dans l'étape change avec l'étape, et seulement avec elle : l'application
-- ne l'envoie jamais.
create or replace function public.projets_vendeurs_maj_etape_le()
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

comment on function public.projets_vendeurs_maj_etape_le() is
  'Déclencheur : date d''entrée dans l''étape, remise au jour à chaque changement d''étape.';

revoke all on function public.projets_vendeurs_maj_etape_le() from public, anon, authenticated;

create trigger projets_vendeurs_maj_etape_le
  before update on public.projets_vendeurs
  for each row execute function public.projets_vendeurs_maj_etape_le();

revoke all on table public.projets_vendeurs from public, anon, authenticated;
grant select, insert, update on table public.projets_vendeurs to authenticated;

alter table public.projets_vendeurs enable row level security;

create policy projets_vendeurs_lecture_proprietaire on public.projets_vendeurs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy projets_vendeurs_creation_proprietaire on public.projets_vendeurs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy projets_vendeurs_modification_proprietaire on public.projets_vendeurs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Tâches et activités liées à un projet vendeur. Si le projet disparaît (suppression
-- définitive de son contact), le lien seul est vidé : la tâche ou l'activité reste, sauf
-- si elle était aussi liée à ce contact (elle part alors avec lui).
-- ---------------------------------------------------------------------------
alter table public.taches
  add column projet_vendeur_id uuid,
  add constraint taches_projet_vendeur_fk
    foreign key (user_id, projet_vendeur_id)
    references public.projets_vendeurs (user_id, id)
    on delete set null (projet_vendeur_id);

comment on column public.taches.projet_vendeur_id is 'Projet vendeur lié, facultatif.';

create index taches_projet_vendeur_idx
  on public.taches (user_id, projet_vendeur_id) where projet_vendeur_id is not null;

alter table public.activites
  add column projet_vendeur_id uuid,
  add constraint activites_projet_vendeur_fk
    foreign key (user_id, projet_vendeur_id)
    references public.projets_vendeurs (user_id, id)
    on delete set null (projet_vendeur_id);

comment on column public.activites.projet_vendeur_id is 'Projet vendeur lié, facultatif.';

create index activites_projet_vendeur_idx
  on public.activites (user_id, projet_vendeur_id, date_activite desc, heure desc)
  where projet_vendeur_id is not null and archived_at is null;

-- ---------------------------------------------------------------------------
-- 3. Sorties du pipeline, possibles à toute étape d'un projet actif, sans suppression :
--   - « À recontacter » : le projet sort du pipeline et une tâche de relance est créée à
--     la date choisie (liée au contact, au bien et au projet) ;
--   - « Perdu » : le motif est enregistré ; si un mandat concurrent a une date de fin, elle
--     est notée et une tâche de relance peut être créée (l'application calcule sa date,
--     peu avant la fin du mandat).
-- Tout réussit ensemble, ou rien ne change. Renvoie la tâche créée, ou rien.
-- S'exécute avec les droits du compte connecté : les règles d'accès par ligne s'appliquent.
-- ---------------------------------------------------------------------------
create or replace function public.sortir_projet_vendeur(
  p_id uuid,
  p_etat text,
  p_recontacter_le date default null,
  p_motif_perte text default null,
  p_motif_perte_detail text default '',
  p_mandat_ailleurs_fin date default null,
  p_relance_le date default null,
  p_relance_titre text default null,
  p_relance_motif text default ''
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  p public.projets_vendeurs;
  relance date;
begin
  select * into p
  from public.projets_vendeurs
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
      raise exception 'Choisissez la date à laquelle recontacter le vendeur.' using errcode = '22023';
    end if;
    update public.projets_vendeurs
      set etat = 'a_recontacter', recontacter_le = p_recontacter_le
      where id = p_id;
    relance := p_recontacter_le;
  elsif p_etat = 'perdu' then
    if p_motif_perte is null then
      raise exception 'Indiquez pourquoi le projet est perdu.' using errcode = '22023';
    end if;
    update public.projets_vendeurs
      set etat = 'perdu',
          motif_perte = p_motif_perte,
          motif_perte_detail = coalesce(p_motif_perte_detail, ''),
          mandat_ailleurs = mandat_ailleurs or p_mandat_ailleurs_fin is not null,
          mandat_ailleurs_fin = coalesce(p_mandat_ailleurs_fin, mandat_ailleurs_fin)
      where id = p_id;
    relance := p_relance_le;
  else
    raise exception 'Sortie inconnue.' using errcode = '22023';
  end if;

  if relance is null then
    return;
  end if;

  return query
    insert into public.taches (
      user_id, titre, motif, categorie, echeance, contact_id, bien_id, projet_vendeur_id
    )
    values (
      p.user_id,
      coalesce(nullif(btrim(p_relance_titre), ''), 'Recontacter le vendeur'),
      coalesce(p_relance_motif, ''),
      'relance',
      relance,
      p.contact_id,
      p.bien_id,
      p.id
    )
    returning *;
end;
$$;

comment on function public.sortir_projet_vendeur(
  uuid, text, date, text, text, date, date, text, text
) is
  'Sort un projet vendeur du pipeline : à recontacter (avec sa relance) ou perdu (avec son motif et, s''il y a lieu, une relance avant la fin du mandat concurrent).';

revoke all on function public.sortir_projet_vendeur(
  uuid, text, date, text, text, date, date, text, text
) from public, anon;
grant execute on function public.sortir_projet_vendeur(
  uuid, text, date, text, text, date, date, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Clôture d'une tâche et boucle de relance : mêmes fonctions qu'aux migrations 0009 et
-- 0011, complétées pour que l'occurrence suivante, l'activité consignée et la prochaine
-- action gardent le lien vers le projet de la tâche.
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
      contact_id, bien_id, projet_vendeur_id, recurrence, recurrence_ancre, recurrence_rang
    )
    values (
      t.user_id, t.titre, t.motif, t.categorie, t.priorite, p_suivante_echeance, t.heure,
      t.duree, t.lieu, t.contact_id, t.bien_id, t.projet_vendeur_id, t.recurrence,
      t.recurrence_ancre, p_suivante_rang
    )
    returning *;
end;
$$;

comment on function public.cloturer_tache(uuid, text, date, integer) is
  'Marque une tâche faite ou annulée ; pour une tâche récurrente, crée l''occurrence suivante à la date donnée. Renvoie l''occurrence créée, ou rien.';

revoke all on function public.cloturer_tache(uuid, text, date, integer) from public, anon;
grant execute on function public.cloturer_tache(uuid, text, date, integer) to authenticated;

-- La boucle de relance (migration 0011), avec le lien vers le projet.
create or replace function public.boucler_tache(
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
  p_sans_prochaine_action boolean default false
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  t public.taches;
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

  -- 2. Ce qui s'est passé entre dans le journal, daté de maintenant.
  insert into public.activites (
    user_id, type, resultat, compte_rendu, contact_id, bien_id, projet_vendeur_id
  )
  values (
    t.user_id, p_type, p_resultat, coalesce(p_compte_rendu, ''), t.contact_id, t.bien_id,
    t.projet_vendeur_id
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
        projet_vendeur_id
      )
      values (
        t.user_id, p_prochaine_titre, coalesce(p_prochaine_motif, ''), p_prochaine_categorie,
        p_prochaine_echeance, p_prochaine_heure, t.contact_id, t.bien_id,
        t.projet_vendeur_id
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
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) is
  'Boucle de relance : tâche faite, activité consignée, prochaine action créée (ou refus confirmé), en une seule opération.';

revoke all on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) from public, anon;
grant execute on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Fusion de deux contacts : même fonction qu'à la migration 0010, complétée par le
-- transfert des projets vendeurs de la fiche absorbée vers la fiche gardée.
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
