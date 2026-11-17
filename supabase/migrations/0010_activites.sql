-- 0010_activites
-- Journal d'activité (étape 1.7).
--   1. Table « activites » : tout événement passé (appel, message, visite, note, document
--      envoyé…), daté et heuré, avec son compte rendu. Liens facultatifs vers un contact et un
--      bien ; le lien vers un projet viendra avec les projets (étape 1.9). Une activité (le
--      passé) et une tâche (le futur) sont deux objets distincts.
--   2. La date du dernier contact d'une fiche tient compte du journal : toute activité liée
--      au contact, sauf une simple note, compte comme un échange. Elle est recalculée dès
--      qu'une activité est ajoutée, redatée, déplacée vers une autre fiche ou retirée.
--   3. La fusion de deux contacts transfère le journal de la fiche absorbée à la fiche gardée.
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « activites »
-- ---------------------------------------------------------------------------
create table public.activites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Ce qui s'est passé
  type text not null
    constraint activites_type_connu check (type in (
      'appel', 'sms', 'courriel', 'rendez_vous', 'visite', 'estimation', 'porte_a_porte',
      'note', 'document', 'autre'
    )),
  resultat text
    constraint activites_resultat_connu
      check (resultat in ('joint', 'messagerie', 'pas_de_reponse', 'rappeler')),
  compte_rendu text not null default ''
    constraint activites_compte_rendu_longueur check (char_length(compte_rendu) <= 5000),

  -- Quand : jour et heure de Paris (heure affichée sur la montre), durée facultative
  date_activite date not null default ((now() at time zone 'Europe/Paris')::date),
  heure time not null default (date_trunc('minute', (now() at time zone 'Europe/Paris'))::time)
    constraint activites_heure_ronde check (heure = date_trunc('minute', heure)),
  duree smallint
    constraint activites_duree_plausible check (duree between 1 and 1440),

  -- Liens facultatifs
  contact_id uuid,
  bien_id uuid,

  -- Le résultat (joint, messagerie…) n'existe que pour un appel.
  constraint activites_resultat_appel check (resultat is null or type = 'appel'),

  -- Le contact et le bien appartiennent au même compte que l'activité.
  constraint activites_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade,
  constraint activites_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.activites is
  'Journal d''activité : tout événement passé (appel, message, visite, note, document envoyé…), avec son compte rendu.';
comment on column public.activites.type is
  'appel, sms, courriel, rendez_vous, visite, estimation, porte_a_porte, note, document (document envoyé), autre.';
comment on column public.activites.resultat is
  'Pour un appel seulement : joint, messagerie, pas_de_reponse, rappeler. Vide sinon.';
comment on column public.activites.compte_rendu is 'Ce qui a été dit ou fait.';
comment on column public.activites.date_activite is 'Jour de l''activité, à Paris.';
comment on column public.activites.heure is
  'Heure de l''activité, à l''heure de Paris (heure affichée sur la montre).';
comment on column public.activites.duree is 'Durée, en minutes. Facultative.';

create index activites_user_id_idx on public.activites (user_id);
-- Page Journal : les activités les plus récentes d'abord.
create index activites_chronologie_idx
  on public.activites (user_id, date_activite desc, heure desc, created_at desc, id desc)
  where archived_at is null;
-- Fils des fiches Contact et Bien, et calcul de la date du dernier contact.
create index activites_contact_idx
  on public.activites (user_id, contact_id, date_activite desc, heure desc)
  where contact_id is not null and archived_at is null;
create index activites_bien_idx
  on public.activites (user_id, bien_id, date_activite desc, heure desc)
  where bien_id is not null and archived_at is null;

create trigger activites_maj_updated_at
  before update on public.activites
  for each row execute function public.maj_updated_at();

revoke all on table public.activites from public, anon, authenticated;
grant select, insert, update on table public.activites to authenticated;

alter table public.activites enable row level security;

create policy activites_lecture_proprietaire on public.activites
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy activites_creation_proprietaire on public.activites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy activites_modification_proprietaire on public.activites
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Date du dernier contact : la plus récente parmi la collecte des données, l'accord (ou
-- le refus), l'opposition, les appels passés sans accord et, désormais, les activités du
-- journal liées au contact. Une note n'est pas un échange avec la personne : elle ne compte
-- pas. Une activité retirée du journal (archivée) ne compte plus.
-- ---------------------------------------------------------------------------
create or replace function public.contacts_maj_dernier_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.collecte_date is null then
    new.collecte_date := (now() at time zone 'Europe/Paris')::date;
  end if;
  new.dernier_contact_le := greatest(
    new.collecte_date,
    new.accord_appel_date,
    new.opposition_demarchage_date,
    (
      select max((a.created_at at time zone 'Europe/Paris')::date)
      from public.appels_sans_accord a
      where a.contact_id = new.id
    ),
    (
      select max(j.date_activite)
      from public.activites j
      where j.contact_id = new.id
        and j.archived_at is null
        and j.type <> 'note'
    )
  );
  return new;
end;
$$;

comment on function public.contacts_maj_dernier_contact() is
  'Déclencheur : tient à jour la date du dernier contact (et la date de collecte si elle manque).';

revoke all on function public.contacts_maj_dernier_contact() from public, anon, authenticated;

-- Une activité ajoutée, redatée, retirée ou rattachée à une autre fiche fait recalculer la
-- date du dernier contact de la fiche concernée (des deux fiches, si le lien a changé).
-- Modifier seulement le compte rendu ne touche pas à la fiche.
create or replace function public.activites_maj_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.contact_id is not null then
    update public.contacts
      set dernier_contact_le = dernier_contact_le
      where id = new.contact_id;
  end if;
  if tg_op = 'UPDATE' and old.contact_id is not null
     and old.contact_id is distinct from new.contact_id then
    update public.contacts
      set dernier_contact_le = dernier_contact_le
      where id = old.contact_id;
  end if;
  return null;
end;
$$;

comment on function public.activites_maj_contact() is
  'Déclencheur : fait recalculer la date du dernier contact après un changement dans le journal.';

revoke all on function public.activites_maj_contact() from public, anon, authenticated;

create trigger activites_maj_contact
  after insert or update of contact_id, date_activite, type, archived_at
  on public.activites
  for each row execute function public.activites_maj_contact();

-- ---------------------------------------------------------------------------
-- 3. Fusion de deux contacts : même fonction qu'à la migration 0009, complétée par le
-- transfert du journal de la fiche absorbée vers la fiche gardée.
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
