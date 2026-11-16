-- 0007_biens
-- Biens : fiche et liste (étape 1.4).
--   1. Table « biens » : un logement, un local ou un terrain, qu'il soit en mandat, en veille
--      ou simplement repéré. Adresse, caractéristiques, prix affiché, statut, DPE et GES,
--      puis les champs propres à chaque type (ancien, neuf, viager, commerce, terrain).
--   2. Table « biens_proprietaires » : le lien entre un bien et ses propriétaires (contacts),
--      plusieurs possibles, avec une quote-part facultative.
--   3. Table « biens_prix » : l'historique des prix, rempli par la base à chaque changement.
--   4. La fusion de deux contacts transfère les biens de la fiche absorbée à la fiche gardée.
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Table « biens »
-- ---------------------------------------------------------------------------
create table public.biens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Adresse
  adresse text not null
    constraint biens_adresse_renseignee check (btrim(adresse) <> '')
    constraint biens_adresse_longueur check (char_length(adresse) <= 200),
  complement text not null default ''
    constraint biens_complement_longueur check (char_length(complement) <= 200),
  etage smallint
    constraint biens_etage_plausible check (etage between -5 and 200),
  code_postal text not null default ''
    constraint biens_code_postal_longueur check (char_length(code_postal) <= 10),
  ville text not null default ''
    constraint biens_ville_longueur check (char_length(ville) <= 80),

  -- Nature et suivi
  type text not null
    constraint biens_type_connu check (type in ('ancien', 'neuf', 'viager', 'commerce', 'terrain')),
  statut text not null default 'repere'
    constraint biens_statut_connu check (statut in (
      'repere', 'en_veille', 'en_estimation', 'en_mandat', 'sous_offre', 'vendu', 'retire'
    )),
  prix integer
    constraint biens_prix_positif check (prix >= 0),

  -- Caractéristiques
  surface numeric(9, 2)
    constraint biens_surface_positive check (surface > 0),
  pieces smallint
    constraint biens_pieces_plausible check (pieces between 0 and 99),
  chambres smallint
    constraint biens_chambres_plausible check (chambres between 0 and 99),
  annee_construction smallint
    constraint biens_annee_plausible check (annee_construction between 1000 and 2200),
  etat text
    constraint biens_etat_connu check (etat in (
      'neuf', 'tres_bon', 'bon', 'a_rafraichir', 'a_renover'
    )),
  description text not null default ''
    constraint biens_description_longueur check (char_length(description) <= 5000),

  -- Diagnostics : performance énergétique (DPE) et gaz à effet de serre (GES)
  dpe_classe text
    constraint biens_dpe_classe_connue check (dpe_classe in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  dpe_valeur integer
    constraint biens_dpe_valeur_positive check (dpe_valeur >= 0),
  dpe_date date,
  ges_classe text
    constraint biens_ges_classe_connue check (ges_classe in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  ges_valeur integer
    constraint biens_ges_valeur_positive check (ges_valeur >= 0),
  ges_date date,

  -- Propre à l'ancien
  copropriete boolean,
  charges_annuelles integer
    constraint biens_charges_positives check (charges_annuelles >= 0),
  taxe_fonciere integer
    constraint biens_taxe_fonciere_positive check (taxe_fonciere >= 0),

  -- Propre au neuf
  programme text not null default ''
    constraint biens_programme_longueur check (char_length(programme) <= 120),
  lot text not null default ''
    constraint biens_lot_longueur check (char_length(lot) <= 60),
  date_livraison date,

  -- Propre au viager
  viager_bouquet integer
    constraint biens_viager_bouquet_positif check (viager_bouquet >= 0),
  viager_rente integer
    constraint biens_viager_rente_positive check (viager_rente >= 0),
  viager_occupation text
    constraint biens_viager_occupation_connue check (viager_occupation in ('occupe', 'libre')),
  viager_ages smallint[] not null default '{}'
    constraint biens_viager_ages_nombre check (cardinality(viager_ages) <= 4)
    constraint biens_viager_ages_plausibles check (18 <= all (viager_ages) and 130 >= all (viager_ages)),

  -- Propre au commerce et au local
  commerce_nature text
    constraint biens_commerce_nature_connue
      check (commerce_nature in ('murs', 'fonds', 'murs_et_fonds')),
  commerce_bail text not null default ''
    constraint biens_commerce_bail_longueur check (char_length(commerce_bail) <= 200),
  commerce_loyer integer
    constraint biens_commerce_loyer_positif check (commerce_loyer >= 0),
  commerce_activite text not null default ''
    constraint biens_commerce_activite_longueur check (char_length(commerce_activite) <= 120),

  -- Propre au terrain
  surface_terrain numeric(11, 2)
    constraint biens_surface_terrain_positive check (surface_terrain > 0),
  constructible boolean,
  viabilise boolean,

  -- Texte cherchable, calculé par la base
  recherche text not null default '',

  -- Sert aux liens venant d'autres tables : le bien cité doit appartenir au même compte.
  constraint biens_user_id_id_unique unique (user_id, id)
);

comment on table public.biens is
  'Biens suivis par le mandataire : logements, locaux et terrains, en mandat, en veille ou simplement repérés. Transactions uniquement, ni location ni gestion.';
comment on column public.biens.adresse is 'Numéro et voie.';
comment on column public.biens.complement is 'Complément d''adresse : bâtiment, résidence, porte…';
comment on column public.biens.etage is 'Étage du bien ; 0 pour le rez-de-chaussée.';
comment on column public.biens.type is
  'ancien, neuf, viager, commerce (commerce ou local), terrain. Le type décide des champs utilisés.';
comment on column public.biens.statut is
  'repere, en_veille, en_estimation, en_mandat, sous_offre, vendu, retire.';
comment on column public.biens.prix is
  'Prix affiché, en euros. Chaque changement est conservé dans biens_prix.';
comment on column public.biens.surface is 'Surface du bien, en m².';
comment on column public.biens.etat is 'neuf, tres_bon, bon, a_rafraichir, a_renover.';
comment on column public.biens.dpe_valeur is 'Consommation d''énergie, en kWh/m²/an.';
comment on column public.biens.ges_valeur is 'Émissions de gaz à effet de serre, en kg de CO₂/m²/an.';
comment on column public.biens.copropriete is 'Ancien : le bien est en copropriété (vide : non précisé).';
comment on column public.biens.charges_annuelles is 'Ancien : charges de copropriété, en euros par an.';
comment on column public.biens.taxe_fonciere is 'Ancien : taxe foncière, en euros par an.';
comment on column public.biens.programme is 'Neuf : nom du programme.';
comment on column public.biens.lot is 'Neuf : numéro ou nom du lot.';
comment on column public.biens.date_livraison is 'Neuf : date de livraison prévue.';
comment on column public.biens.viager_bouquet is 'Viager : bouquet, en euros.';
comment on column public.biens.viager_rente is 'Viager : rente, en euros par mois.';
comment on column public.biens.viager_occupation is 'Viager : occupe ou libre.';
comment on column public.biens.viager_ages is
  'Viager : âge de chaque crédirentier, tel que noté le jour de la saisie.';
comment on column public.biens.commerce_nature is 'Commerce : vente des murs, du fonds, ou des deux.';
comment on column public.biens.commerce_bail is 'Commerce : type de bail et échéance (texte libre).';
comment on column public.biens.commerce_loyer is 'Commerce : loyer, en euros par an.';
comment on column public.biens.commerce_activite is 'Commerce : activité exercée dans le local.';
comment on column public.biens.surface_terrain is 'Terrain : surface, en m².';
comment on column public.biens.recherche is
  'Texte cherchable : adresse, complément, code postal, ville, programme. Sans accent ni majuscule. Calculé par la base.';

create index biens_user_id_idx on public.biens (user_id);
-- Liste des biens actifs, les plus récents d'abord, lue page par page.
create index biens_liste_idx
  on public.biens (user_id, created_at desc, id) where archived_at is null;

create trigger biens_maj_updated_at
  before update on public.biens
  for each row execute function public.maj_updated_at();

-- Déclencheur : recalcule « recherche » à chaque enregistrement. Ce que l'application
-- enverrait dans cette colonne est ignoré. Même mise en forme que pour les contacts.
create or replace function public.biens_maj_recherche()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.recherche := public.normaliser_recherche(concat_ws(' ',
    new.adresse, new.complement, new.code_postal, new.ville, new.programme
  ));
  return new;
end;
$$;

comment on function public.biens_maj_recherche() is
  'Déclencheur : tient à jour la colonne recherche d''un bien.';

revoke all on function public.biens_maj_recherche() from public, anon, authenticated;

create trigger biens_maj_recherche
  before insert or update on public.biens
  for each row execute function public.biens_maj_recherche();

revoke all on table public.biens from public, anon, authenticated;
grant select, insert, update on table public.biens to authenticated;

alter table public.biens enable row level security;

create policy biens_lecture_proprietaire on public.biens
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy biens_creation_proprietaire on public.biens
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy biens_modification_proprietaire on public.biens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Table « biens_proprietaires » : qui possède quel bien.
-- Retirer un propriétaire archive le lien (rien ne se supprime). La suppression définitive
-- d'un contact (droit à l'effacement) emporte ses liens ; le bien, lui, reste.
-- ---------------------------------------------------------------------------
create table public.biens_proprietaires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  bien_id uuid not null,
  contact_id uuid not null,
  quote_part numeric(5, 2)
    constraint biens_proprietaires_quote_part_plausible check (quote_part > 0 and quote_part <= 100),

  -- Le bien et le contact appartiennent au même compte que le lien.
  constraint biens_proprietaires_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade,
  constraint biens_proprietaires_contact_fk
    foreign key (user_id, contact_id)
    references public.contacts (user_id, id)
    on delete cascade
);

comment on table public.biens_proprietaires is
  'Propriétaires d''un bien : un lien par contact, avec sa quote-part si elle est connue.';
comment on column public.biens_proprietaires.quote_part is
  'Part du bien détenue par ce propriétaire, en pourcentage. Facultative.';

create index biens_proprietaires_user_id_idx on public.biens_proprietaires (user_id);
create index biens_proprietaires_contact_idx
  on public.biens_proprietaires (user_id, contact_id);
-- Un contact n'est inscrit qu'une fois, à un moment donné, comme propriétaire d'un bien.
create unique index biens_proprietaires_lien_unique
  on public.biens_proprietaires (user_id, bien_id, contact_id) where archived_at is null;

create trigger biens_proprietaires_maj_updated_at
  before update on public.biens_proprietaires
  for each row execute function public.maj_updated_at();

revoke all on table public.biens_proprietaires from public, anon, authenticated;
grant select, insert, update on table public.biens_proprietaires to authenticated;

alter table public.biens_proprietaires enable row level security;

create policy biens_proprietaires_lecture_proprietaire on public.biens_proprietaires
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy biens_proprietaires_creation_proprietaire on public.biens_proprietaires
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy biens_proprietaires_modification_proprietaire on public.biens_proprietaires
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. Table « biens_prix » : l'historique des prix d'un bien.
-- Une ligne par prix affiché, datée par « created_at ». L'application n'y écrit pas :
-- le déclencheur ci-dessous s'en charge à chaque fois que le prix d'un bien change.
-- ---------------------------------------------------------------------------
create table public.biens_prix (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  bien_id uuid not null,
  prix integer not null
    constraint biens_prix_prix_positif check (prix >= 0),

  constraint biens_prix_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.biens_prix is
  'Historique des prix affichés d''un bien : une ligne à chaque changement, datée par created_at.';

create index biens_prix_user_id_idx on public.biens_prix (user_id);
create index biens_prix_bien_idx on public.biens_prix (user_id, bien_id, created_at desc);

create trigger biens_prix_maj_updated_at
  before update on public.biens_prix
  for each row execute function public.maj_updated_at();

revoke all on table public.biens_prix from public, anon, authenticated;
grant select, insert, update on table public.biens_prix to authenticated;

alter table public.biens_prix enable row level security;

create policy biens_prix_lecture_proprietaire on public.biens_prix
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy biens_prix_creation_proprietaire on public.biens_prix
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy biens_prix_modification_proprietaire on public.biens_prix
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Déclencheur : note le prix dans l'historique à la création d'un bien qui en a un, puis à
-- chaque changement. Un prix effacé ne crée pas de ligne. S'exécute avec les droits du
-- compte connecté : les règles d'accès par ligne de « biens_prix » s'appliquent.
create or replace function public.biens_noter_prix()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.prix is not null and (tg_op = 'INSERT' or new.prix is distinct from old.prix) then
    insert into public.biens_prix (user_id, bien_id, prix)
    values (new.user_id, new.id, new.prix);
  end if;
  return null;
end;
$$;

comment on function public.biens_noter_prix() is
  'Déclencheur : conserve chaque prix affiché d''un bien dans biens_prix.';

revoke all on function public.biens_noter_prix() from public, anon, authenticated;

create trigger biens_noter_prix
  after insert or update of prix on public.biens
  for each row execute function public.biens_noter_prix();

-- ---------------------------------------------------------------------------
-- 4. Fusion de deux contacts : même fonction qu'à la migration 0005, complétée par le
-- transfert des biens. Si les deux fiches étaient propriétaires du même bien, le lien de
-- la fiche absorbée est archivé plutôt que transféré (un seul lien actif par bien).
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
