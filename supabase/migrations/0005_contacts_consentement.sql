-- 0005_contacts_consentement
-- Consentement et RGPD sur les contacts (étape 1.3).
--   1. Sur chaque contact : origine et date de collecte des données, accord pour être appelé
--      (oui, non, inconnu) avec sa date et sa preuve, indicateur « client existant »,
--      opposition au démarchage, date du dernier contact (calculée par la base).
--   2. Table « appels_sans_accord » : chaque appel passé sans accord enregistré, avec son motif.
--   3. Droit à l'effacement : droit de suppression sur les contacts, réservé au propriétaire,
--      et fonction qui supprime une fiche avec tout ce qui lui est lié.
--   4. La fusion de deux fiches reprend les nouvelles colonnes et les appels sans accord.
-- Fiches déjà enregistrées : accord « inconnu », données réputées collectées le jour de la
-- création de la fiche. Aucune donnée n'est supprimée. Conventions : voir docs/donnees.md.
--
-- Les règles juridiques que ces colonnes servent (RGPD, démarchage téléphonique) sont
-- résumées dans docs/cadrage.md et restent à faire valider par un juriste.

-- ---------------------------------------------------------------------------
-- 1. Nouvelles colonnes des contacts
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column collecte_origine text not null default ''
    constraint contacts_collecte_origine_longueur check (char_length(collecte_origine) <= 200),
  add column collecte_date date,
  add column accord_appel text not null default 'inconnu'
    constraint contacts_accord_appel_connu check (accord_appel in ('oui', 'non', 'inconnu')),
  add column accord_appel_date date,
  add column accord_appel_preuve text not null default ''
    constraint contacts_accord_appel_preuve_longueur check (char_length(accord_appel_preuve) <= 500),
  add column client_existant boolean not null default false,
  add column opposition_demarchage boolean not null default false,
  add column opposition_demarchage_date date,
  add column dernier_contact_le date,
  -- Un accord n'est enregistré « oui » qu'avec sa date et la façon dont il a été obtenu.
  add constraint contacts_accord_appel_prouve check (
    accord_appel <> 'oui'
    or (accord_appel_date is not null and btrim(accord_appel_preuve) <> '')
  );

comment on column public.contacts.collecte_origine is
  'Comment les données de la fiche ont été obtenues (texte libre), en complément de la source.';
comment on column public.contacts.collecte_date is
  'Date à laquelle les données ont été collectées. Par défaut : le jour de création de la fiche.';
comment on column public.contacts.accord_appel is
  'Accord de la personne pour être appelée : oui, non ou inconnu. Sans « oui », l''application bloque l''appel direct.';
comment on column public.contacts.accord_appel_date is
  'Date à laquelle l''accord (ou le refus) a été exprimé. Obligatoire pour un accord.';
comment on column public.contacts.accord_appel_preuve is
  'Comment l''accord a été obtenu (texte libre). Obligatoire pour un accord.';
comment on column public.contacts.client_existant is
  'Client existant : un contrat est en cours avec cette personne (exception à documenter à chaque appel).';
comment on column public.contacts.opposition_demarchage is
  'La personne s''oppose à toute prospection (téléphone, courriel, SMS, courrier).';
comment on column public.contacts.opposition_demarchage_date is
  'Date à laquelle la personne a exprimé son opposition.';
comment on column public.contacts.dernier_contact_le is
  'Date du dernier échange connu avec la personne. Calculée par la base ; servira à la purge des fiches inactives.';

-- ---------------------------------------------------------------------------
-- 2. Table « appels_sans_accord » : le motif de chaque appel passé sans accord enregistré.
-- ---------------------------------------------------------------------------
create table public.appels_sans_accord (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  contact_id uuid not null,
  motif text not null
    constraint appels_sans_accord_motif_connu
      check (motif in ('client_existant', 'appel_entrant', 'professionnel', 'autre')),
  detail text not null default ''
    constraint appels_sans_accord_detail_longueur check (char_length(detail) <= 300),
  telephone text not null default ''
    constraint appels_sans_accord_telephone_longueur check (char_length(telephone) <= 20),

  -- Un motif « autre » s'explique.
  constraint appels_sans_accord_autre_explique check (motif <> 'autre' or btrim(detail) <> ''),
  -- Le contact appartient au même compte ; ses appels disparaissent avec lui (effacement).
  constraint appels_sans_accord_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade
);

comment on table public.appels_sans_accord is
  'Appels passés à un contact sans accord enregistré pour être appelé, avec le motif indiqué au moment de l''appel.';
comment on column public.appels_sans_accord.motif is
  'client_existant, appel_entrant (la personne a appelé ou demandé à être rappelée), professionnel, autre.';
comment on column public.appels_sans_accord.detail is
  'Précision libre sur le motif. Obligatoire pour le motif « autre ».';
comment on column public.appels_sans_accord.telephone is
  'Numéro appelé, au format international.';

create index appels_sans_accord_user_id_idx on public.appels_sans_accord (user_id);
create index appels_sans_accord_contact_idx
  on public.appels_sans_accord (user_id, contact_id, created_at desc);

create trigger appels_sans_accord_maj_updated_at
  before update on public.appels_sans_accord
  for each row execute function public.maj_updated_at();

revoke all on table public.appels_sans_accord from public, anon, authenticated;
grant select, insert, update on table public.appels_sans_accord to authenticated;

alter table public.appels_sans_accord enable row level security;

create policy appels_sans_accord_lecture_proprietaire on public.appels_sans_accord
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy appels_sans_accord_creation_proprietaire on public.appels_sans_accord
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy appels_sans_accord_modification_proprietaire on public.appels_sans_accord
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Date du dernier contact : la plus récente parmi la collecte des données, l'accord (ou le
-- refus), l'opposition et les appels passés sans accord. Recalculée à chaque enregistrement ;
-- ce que l'application enverrait dans cette colonne est ignoré. Le journal d'activité
-- (étape 1.7) viendra s'ajouter à ce calcul.
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
    )
  );
  return new;
end;
$$;

comment on function public.contacts_maj_dernier_contact() is
  'Déclencheur : tient à jour la date du dernier contact (et la date de collecte si elle manque).';

revoke all on function public.contacts_maj_dernier_contact() from public, anon, authenticated;

create trigger contacts_maj_dernier_contact
  before insert or update on public.contacts
  for each row execute function public.contacts_maj_dernier_contact();

-- Un appel enregistré fait recalculer la date du dernier contact de la fiche.
create or replace function public.appels_sans_accord_maj_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.contacts
    set dernier_contact_le = dernier_contact_le
    where id = new.contact_id;
  return null;
end;
$$;

comment on function public.appels_sans_accord_maj_contact() is
  'Déclencheur : fait recalculer la date du dernier contact après un appel enregistré.';

revoke all on function public.appels_sans_accord_maj_contact() from public, anon, authenticated;

create trigger appels_sans_accord_maj_contact
  after insert on public.appels_sans_accord
  for each row execute function public.appels_sans_accord_maj_contact();

-- Fiches déjà enregistrées : données réputées collectées le jour de création de la fiche.
-- Le déclencheur calcule la date du dernier contact ; la date de dernière modification
-- n'est pas touchée (déclencheur « updated_at » suspendu le temps du calcul).
alter table public.contacts disable trigger contacts_maj_updated_at;
update public.contacts
  set collecte_date = (created_at at time zone 'Europe/Paris')::date;
alter table public.contacts enable trigger contacts_maj_updated_at;

alter table public.contacts
  alter column collecte_date set not null,
  alter column dernier_contact_le set not null;

-- ---------------------------------------------------------------------------
-- 3. Droit à l'effacement
-- Les contacts reçoivent un droit et une règle de suppression, réservés au propriétaire.
-- L'application ne s'en sert que par la fonction ci-dessous, après une double confirmation.
-- ---------------------------------------------------------------------------
grant delete on table public.contacts to authenticated;

create policy contacts_suppression_proprietaire on public.contacts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Supprime définitivement une fiche et tout ce qui lui est lié :
--   - les fiches qui ont été fusionnées dans celle-ci (elles décrivent la même personne) ;
--   - les appels sans accord (suppression en cascade) ;
--   - le lien « recommandé par » des contacts qu'elle avait recommandés (vidé, sans les supprimer).
-- Renvoie le nombre de fiches supprimées (0 : fiche introuvable). S'exécute avec les droits
-- de celui qui l'appelle : chacun ne peut supprimer que ses propres fiches.
-- Chaque table liée aux contacts, créée à une étape suivante, devra disparaître avec la fiche
-- (clé étrangère « on delete cascade ») ou être traitée ici.
create or replace function public.supprimer_contact_definitivement(p_id uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  nb integer;
begin
  with recursive fiches as (
    select c.id from public.contacts c where c.id = p_id
    union
    select c.id from public.contacts c join fiches f on c.fusionne_dans_id = f.id
  )
  delete from public.contacts where id in (select id from fiches);
  get diagnostics nb = row_count;
  return nb;
end;
$$;

comment on function public.supprimer_contact_definitivement(uuid) is
  'Droit à l''effacement : supprime définitivement un contact, les fiches fusionnées dans celui-ci et tout ce qui leur est lié.';

revoke all on function public.supprimer_contact_definitivement(uuid) from public, anon;
grant execute on function public.supprimer_contact_definitivement(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Fusion de deux fiches : même fonction qu'à la migration 0003, complétée par les
-- colonnes de consentement et par le transfert des appels sans accord vers la fiche gardée.
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
