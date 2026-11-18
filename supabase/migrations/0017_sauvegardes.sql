-- 0017_sauvegardes
-- Étape 1.13 : sauvegardes et export.
-- Deux dates dans les réglages du compte :
--   - « dernier_export_le » : le dernier export complet fait depuis Réglages (inscrit par
--     l'application) ; l'écran Aujourd'hui rappelle d'exporter au-delà de 7 jours ;
--   - « derniere_sauvegarde_le » : la dernière sauvegarde automatique chiffrée réussie
--     (inscrite par le workflow GitHub « Sauvegarde », voir docs/sauvegarde.md).
-- Aucune donnée existante n'est modifiée. Les droits et règles d'accès par ligne de la
-- table « reglages » (migration 0001) s'appliquent tels quels aux nouvelles colonnes.

alter table public.reglages
  add column dernier_export_le timestamptz,
  add column derniere_sauvegarde_le timestamptz;

comment on column public.reglages.dernier_export_le is
  'Moment du dernier export complet des données (bouton « Exporter toutes mes données »).';
comment on column public.reglages.derniere_sauvegarde_le is
  'Moment de la dernière sauvegarde automatique chiffrée réussie (workflow GitHub « Sauvegarde »).';
