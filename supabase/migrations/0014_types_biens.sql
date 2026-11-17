-- 0014_types_biens
-- Deux niveaux de type pour les biens (décision du 17/11/2026) :
--   - le type principal dit ce qu'est le bien : appartement, maison, terrain, commerce ;
--   - le type secondaire (colonne « categorie ») dit comment il se vend : ancien, neuf,
--     viager. Un appartement peut être ancien, neuf ou en viager. Un terrain n'en a pas.
--   1. Table « biens » : nouvelle colonne « categorie » ; nouvelles valeurs de « type ».
--      Les biens déjà enregistrés sont reclassés : un bien ancien, neuf ou en viager garde
--      cette valeur comme type secondaire et devient un appartement s'il est en copropriété,
--      à un étage ou s'il a un numéro de lot, une maison sinon (à vérifier sur chaque
--      fiche) ; commerce et terrain ne changent pas.
--   2. Table « projets_acquereurs » : « types_biens » prend les types principaux, et la
--      nouvelle colonne « categories_biens » les types secondaires recherchés (vide :
--      indifférent). Une recherche « ancien » ou « neuf » devient « appartement, maison »
--      avec ce type secondaire.
-- Aucune ligne n'est supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Biens
-- ---------------------------------------------------------------------------
alter table public.biens drop constraint biens_type_connu;

alter table public.biens
  add column categorie text
    constraint biens_categorie_connue check (categorie in ('ancien', 'neuf', 'viager'));

update public.biens
  set categorie = type,
      type = case
        when copropriete is true or coalesce(etage, 0) <> 0 or lot <> '' then 'appartement'
        else 'maison'
      end
  where type in ('ancien', 'neuf', 'viager');

alter table public.biens
  add constraint biens_type_connu
    check (type in ('appartement', 'maison', 'terrain', 'commerce')),
  add constraint biens_terrain_sans_categorie check (type <> 'terrain' or categorie is null);

comment on column public.biens.type is
  'Type principal : appartement, maison, terrain, commerce (commerce ou local). Avec le type secondaire, il décide des champs utilisés.';
comment on column public.biens.categorie is
  'Type secondaire : ancien, neuf, viager. Vide pour un terrain.';

-- ---------------------------------------------------------------------------
-- 2. Recherche des acquéreurs
-- ---------------------------------------------------------------------------
alter table public.projets_acquereurs drop constraint projets_acquereurs_types_connus;

alter table public.projets_acquereurs
  add column categories_biens text[] not null default '{}'
    constraint projets_acquereurs_categories_connues
      check (categories_biens <@ array['ancien', 'neuf', 'viager']::text[]);

update public.projets_acquereurs
  set categories_biens = array(
        select t from unnest(types_biens) t where t in ('ancien', 'neuf', 'viager') order by t
      ),
      types_biens = array(
        select distinct t from (
          select case when t in ('ancien', 'neuf', 'viager') then x else t end as t
          from unnest(types_biens) t
          left join lateral unnest(array['appartement', 'maison']) x
            on t in ('ancien', 'neuf', 'viager')
        ) types
        order by t
      )
  where types_biens && array['ancien', 'neuf', 'viager']::text[];

alter table public.projets_acquereurs
  add constraint projets_acquereurs_types_connus
    check (types_biens <@ array['appartement', 'maison', 'terrain', 'commerce']::text[]);

comment on column public.projets_acquereurs.types_biens is
  'Types de biens recherchés : appartement, maison, terrain, commerce.';
comment on column public.projets_acquereurs.categories_biens is
  'Types secondaires recherchés : ancien, neuf, viager. Vide : indifférent.';
