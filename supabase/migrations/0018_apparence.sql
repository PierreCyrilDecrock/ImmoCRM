-- 0018_apparence
-- Page « Apparence » (menu Plus) : les thèmes du compte, partagés entre les appareils.
-- Une colonne dans les réglages du compte :
--   - « apparence » : un objet JSON qui garde le thème choisi (« theme_choisi ») et la liste
--     des thèmes créés (« themes ») ; chaque thème porte son nom, cinq couleurs pour le mode
--     clair et cinq pour le mode sombre, sa police, sa taille de texte et ses arrondis.
--     L'application vérifie chaque valeur à la lecture (src/features/apparence/themes.ts) :
--     une valeur inconnue ou abîmée est remplacée par celle d'origine.
-- Le mode (auto, clair, sombre) et le zoom restent propres à chaque appareil : ils ne sont
-- pas dans la base.
-- Aucune donnée existante n'est modifiée. Les droits et règles d'accès par ligne de la
-- table « reglages » (migration 0001) s'appliquent tels quels à la nouvelle colonne.

alter table public.reglages
  add column apparence jsonb not null default '{}'::jsonb;

alter table public.reglages
  add constraint reglages_apparence_objet check (jsonb_typeof(apparence) = 'object'),
  add constraint reglages_apparence_taille check (pg_column_size(apparence) <= 65536);

comment on column public.reglages.apparence is
  'Thèmes du compte (page Apparence) : thème choisi et thèmes créés (couleurs, police, taille du texte, arrondis).';
