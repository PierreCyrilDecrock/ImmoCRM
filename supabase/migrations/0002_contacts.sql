-- 0002_contacts
-- Table « contacts » : une personne ou une société, avec ses coordonnées, ses rôles,
-- ses étiquettes, son origine (source) et sa température.
-- Règle du cadrage : une personne et son projet sont deux choses distinctes. Cette table
-- ne porte donc aucune étape de pipeline : les projets auront leurs propres tables.
-- Conventions : voir docs/donnees.md.

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  -- Identité
  type text not null default 'personne'
    constraint contacts_type_connu check (type in ('personne', 'societe')),
  civilite text
    constraint contacts_civilite_connue check (civilite in ('m', 'mme')),
  prenom text not null default ''
    constraint contacts_prenom_longueur check (char_length(prenom) <= 80),
  nom text not null default ''
    constraint contacts_nom_longueur check (char_length(nom) <= 80),
  raison_sociale text not null default ''
    constraint contacts_raison_sociale_longueur check (char_length(raison_sociale) <= 120),

  -- Coordonnées. Les téléphones sont enregistrés au format international (+33612345678).
  telephones text[] not null default '{}'
    constraint contacts_telephones_nombre check (cardinality(telephones) <= 5),
  courriels text[] not null default '{}'
    constraint contacts_courriels_nombre check (cardinality(courriels) <= 5),
  adresse text not null default ''
    constraint contacts_adresse_longueur check (char_length(adresse) <= 200),
  code_postal text not null default ''
    constraint contacts_code_postal_longueur check (char_length(code_postal) <= 10),
  ville text not null default ''
    constraint contacts_ville_longueur check (char_length(ville) <= 80),
  notes text not null default ''
    constraint contacts_notes_longueur check (char_length(notes) <= 5000),

  -- Qualification
  roles text[] not null default '{}'
    constraint contacts_roles_connus
      check (roles <@ array['vendeur', 'acquereur', 'notaire', 'prescripteur', 'autre']),
  etiquettes text[] not null default '{}'
    constraint contacts_etiquettes_nombre check (cardinality(etiquettes) <= 20),

  -- Origine du contact
  source text
    constraint contacts_source_connue check (source in (
      'pige', 'porte_a_porte', 'boitage', 'recommandation',
      'demande_entrante', 'reseaux_sociaux_site', 'sphere_personnelle'
    )),
  source_detail text not null default ''
    constraint contacts_source_detail_longueur check (char_length(source_detail) <= 200),
  recommande_par_id uuid,

  -- Température : quand le contact aura un projet (rythme de relance par défaut)
  temperature text
    constraint contacts_temperature_connue
      check (temperature in ('chaud', 'tiede', 'froid', 'veille')),

  -- Une personne a un nom ; une société a une raison sociale.
  constraint contacts_nomme check (
    (type = 'personne' and btrim(nom) <> '')
    or (type = 'societe' and btrim(raison_sociale) <> '')
  ),
  constraint contacts_pas_recommande_par_lui_meme check (recommande_par_id <> id),

  -- Sert au lien « recommandé par » : le contact cité doit appartenir au même compte.
  constraint contacts_user_id_id_unique unique (user_id, id),
  constraint contacts_recommande_par_fk
    foreign key (user_id, recommande_par_id)
    references public.contacts (user_id, id)
    on delete set null (recommande_par_id)
);

comment on table public.contacts is
  'Personnes et sociétés suivies par le mandataire. Aucune étape de pipeline ici : les projets sont des tables distinctes.';
comment on column public.contacts.telephones is
  'Numéros au format international sans espace (+33612345678). Le premier est le numéro principal.';
comment on column public.contacts.courriels is
  'Adresses de courriel. La première est l''adresse principale.';
comment on column public.contacts.roles is
  'Rôles du contact, plusieurs possibles : vendeur, acquereur, notaire, prescripteur, autre.';
comment on column public.contacts.etiquettes is
  'Étiquettes libres, saisies par l''utilisateur.';
comment on column public.contacts.source is
  'D''où vient le contact (les sept sources du cadrage).';
comment on column public.contacts.source_detail is
  'Précision sur la source : annonce, rue, portail, publication, lien avec la personne…';
comment on column public.contacts.recommande_par_id is
  'Contact qui a recommandé celui-ci.';
comment on column public.contacts.temperature is
  'chaud : projet dans les 3 mois ; tiede : 3 à 12 mois ; froid : lointain ; veille : pas de projet déclaré.';

create index contacts_user_id_idx on public.contacts (user_id);
create index contacts_recommande_par_idx on public.contacts (user_id, recommande_par_id);

create trigger contacts_maj_updated_at
  before update on public.contacts
  for each row execute function public.maj_updated_at();

-- Droits : rien pour un visiteur sans session ; lecture, création et modification
-- pour un compte connecté (pas de suppression : une fiche s'archive).
revoke all on table public.contacts from public, anon, authenticated;
grant select, insert, update on table public.contacts to authenticated;

-- Règles d'accès par ligne : chacun ne voit et ne modifie que ses propres contacts.
alter table public.contacts enable row level security;

create policy contacts_lecture_proprietaire on public.contacts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy contacts_creation_proprietaire on public.contacts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy contacts_modification_proprietaire on public.contacts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
