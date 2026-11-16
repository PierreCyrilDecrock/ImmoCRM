-- 0003_contacts_recherche
-- Recherche, filtres, doublons et fusion des contacts (étape 1.2).
--   1. Deux colonnes tenues à jour par la base : « recherche » (tout le texte cherchable,
--      sans accent ni majuscule, téléphones compris) et « nom_tri » (nom de classement).
--   2. Les index qui gardent recherche et listes rapides avec des dizaines de milliers de fiches.
--   3. Trois fonctions : étiquettes utilisées, doublons probables, fusion de deux fiches.
-- Aucune donnée n'est supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- Extensions : « unaccent » retire les accents, « pg_trgm » indexe les morceaux de mots
-- (recherche « contient » et ressemblance entre deux noms).
-- ---------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Mise en forme commune du texte cherché et du texte dans lequel on cherche :
-- minuscules, sans accent, tirets et apostrophes remplacés par des espaces.
-- Les caractères jokers (% _ \ *) sont retirés. Même règle dans l'application
-- (src/lib/recherche.ts).
-- ---------------------------------------------------------------------------
create or replace function public.normaliser_recherche(texte text)
returns text
language sql
stable
set search_path = ''
as $$
  select btrim(regexp_replace(
    translate(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texte, ''))),
      '-''’%_\*',
      '       '
    ),
    '\s+', ' ', 'g'
  ));
$$;

comment on function public.normaliser_recherche(text) is
  'Met un texte en forme pour la recherche : minuscules, sans accent, ponctuation de liaison retirée.';

revoke all on function public.normaliser_recherche(text) from public, anon;
grant execute on function public.normaliser_recherche(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Nouvelles colonnes
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column nom_tri text not null default '',
  add column recherche text not null default '',
  add column fusionne_dans_id uuid,
  add constraint contacts_pas_fusionne_dans_lui_meme check (fusionne_dans_id <> id),
  add constraint contacts_fusionne_dans_fk
    foreign key (user_id, fusionne_dans_id)
    references public.contacts (user_id, id)
    on delete set null (fusionne_dans_id);

comment on column public.contacts.nom_tri is
  'Nom de classement (« nom prénom » ou raison sociale), sans accent ni majuscule. Calculé par la base.';
comment on column public.contacts.recherche is
  'Texte cherchable : nom, prénom, société, courriels, adresse, téléphones (06… et 33…). Calculé par la base.';
comment on column public.contacts.fusionne_dans_id is
  'Si la fiche a été fusionnée dans une autre : la fiche qui a tout repris. La fiche fusionnée est archivée.';

-- ---------------------------------------------------------------------------
-- Déclencheur : recalcule « nom_tri » et « recherche » à chaque enregistrement.
-- Ce que l'application enverrait dans ces deux colonnes est ignoré.
-- ---------------------------------------------------------------------------
create or replace function public.contacts_maj_recherche()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  telephones text;
begin
  new.nom_tri := public.normaliser_recherche(
    case when new.type = 'societe' then new.raison_sociale else new.nom || ' ' || new.prenom end
  );

  -- Chaque numéro sous ses deux écritures, en chiffres seuls : nationale (0612345678) et
  -- internationale (33612345678). « 0612 », « 06 12 » et « +33612 » trouvent ainsi la même fiche.
  select coalesce(string_agg(
    case when t like '+33%' then '0' || substr(t, 4) || ' ' || substr(t, 2) else substr(t, 2) end,
    ' '
  ), '')
  into telephones
  from unnest(new.telephones) as t;

  new.recherche := btrim(
    public.normaliser_recherche(concat_ws(' ',
      new.nom, new.prenom, new.raison_sociale,
      array_to_string(new.courriels, ' '),
      new.adresse, new.code_postal, new.ville
    )) || ' ' || telephones
  );
  return new;
end;
$$;

comment on function public.contacts_maj_recherche() is
  'Déclencheur : tient à jour les colonnes nom_tri et recherche d''un contact.';

revoke all on function public.contacts_maj_recherche() from public, anon, authenticated;

create trigger contacts_maj_recherche
  before insert or update on public.contacts
  for each row execute function public.contacts_maj_recherche();

-- Fiches déjà enregistrées : on fait calculer les deux colonnes, sans toucher à leur date
-- de dernière modification (déclencheur « updated_at » suspendu le temps du calcul).
alter table public.contacts disable trigger contacts_maj_updated_at;
update public.contacts set recherche = '';
alter table public.contacts enable trigger contacts_maj_updated_at;

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------
-- Recherche « contient » sur tout le texte cherchable.
create index contacts_recherche_trgm_idx
  on public.contacts using gin (recherche extensions.gin_trgm_ops);
-- Ressemblance entre deux noms (détection des doublons).
create index contacts_nom_tri_trgm_idx
  on public.contacts using gin (nom_tri extensions.gin_trgm_ops);
-- Liste des fiches actives par ordre alphabétique, lue page par page.
create index contacts_liste_idx
  on public.contacts (user_id, nom_tri, id) where archived_at is null;
-- Même téléphone, même courriel (doublons) ; filtre par étiquette.
create index contacts_telephones_idx on public.contacts using gin (telephones);
create index contacts_courriels_idx on public.contacts using gin (courriels);
create index contacts_etiquettes_idx on public.contacts using gin (etiquettes);
-- Lien « fusionnée dans ».
create index contacts_fusionne_dans_idx
  on public.contacts (user_id, fusionne_dans_id) where fusionne_dans_id is not null;

-- ---------------------------------------------------------------------------
-- Les fonctions ci-dessous s'exécutent avec les droits de celui qui les appelle :
-- les règles d'accès par ligne de la table s'appliquent, chacun n'agit que sur ses fiches.
-- ---------------------------------------------------------------------------

-- Étiquettes utilisées par les fiches actives, les plus fréquentes d'abord (filtre de la liste).
create or replace function public.etiquettes_contacts()
returns table (etiquette text, nombre bigint)
language sql
stable
set search_path = ''
as $$
  select e.etiquette, count(*) as nombre
  from public.contacts c
  cross join lateral unnest(c.etiquettes) as e(etiquette)
  where c.archived_at is null
  group by e.etiquette
  order by nombre desc, e.etiquette
  limit 200;
$$;

comment on function public.etiquettes_contacts() is
  'Étiquettes portées par les contacts actifs, avec leur nombre de fiches.';

revoke all on function public.etiquettes_contacts() from public, anon;
grant execute on function public.etiquettes_contacts() to authenticated;

-- Doublons probables : même téléphone, même courriel, ou nom très proche.
-- « p_sauf » écarte une fiche (celle qu'on est en train de modifier).
-- Les fiches déjà fusionnées dans une autre ne sont pas proposées.
create or replace function public.doublons_contact(
  p_telephones text[],
  p_courriels text[],
  p_nom text,
  p_sauf uuid default null
)
returns setof public.contacts
language sql
stable
set search_path = ''
as $$
  with cible as (
    select public.normaliser_recherche(p_nom) as nom
  )
  select c.*
  from public.contacts c, cible
  where c.fusionne_dans_id is null
    and (p_sauf is null or c.id <> p_sauf)
    and (
      c.telephones && coalesce(p_telephones, '{}')
      or c.courriels && coalesce(p_courriels, '{}')
      or (
        cible.nom <> ''
        and c.nom_tri operator(extensions.%) cible.nom
        and extensions.similarity(c.nom_tri, cible.nom) >= 0.6
      )
    )
  order by
    (c.telephones && coalesce(p_telephones, '{}') or c.courriels && coalesce(p_courriels, '{}')) desc,
    (c.archived_at is not null),
    extensions.similarity(c.nom_tri, cible.nom) desc,
    c.id
  limit 5;
$$;

comment on function public.doublons_contact(text[], text[], text, uuid) is
  'Fiches qui ressemblent à celle qu''on s''apprête à enregistrer : même téléphone, même courriel ou nom très proche.';

revoke all on function public.doublons_contact(text[], text[], text, uuid) from public, anon;
grant execute on function public.doublons_contact(text[], text[], text, uuid) to authenticated;

-- Fusion de deux fiches, en une seule opération (tout réussit ou rien ne change) :
--   1. les contacts recommandés par la fiche absorbée le deviennent par la fiche gardée ;
--   2. la fiche absorbée est archivée et pointe vers la fiche gardée ;
--   3. la fiche gardée reçoit les valeurs réunies, préparées par l'application.
-- Rien n'est supprimé. Chaque table liée aux contacts, créée à une étape suivante,
-- viendra ajouter ici le transfert de ses lignes.
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
        temperature = v.temperature
    where id = p_garde
    returning * into resultat;

  return resultat;
end;
$$;

comment on function public.fusionner_contacts(uuid, uuid, jsonb) is
  'Fusionne deux contacts : la fiche gardée reçoit les valeurs réunies, l''autre est archivée et pointe vers elle.';

revoke all on function public.fusionner_contacts(uuid, uuid, jsonb) from public, anon;
grant execute on function public.fusionner_contacts(uuid, uuid, jsonb) to authenticated;
