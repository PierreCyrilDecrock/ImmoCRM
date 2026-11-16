-- 0004_contacts_recherche_ajustements
-- Ajustements après les mesures faites sur 30 000 contacts fictifs (étape 1.2).
--
-- Constat : avec les règles d'accès par ligne, la base vérifie d'abord à qui appartient
-- chaque fiche, puis seulement applique la recherche. Elle ne peut donc pas se servir des
-- index « contient », « ressemble » et « tableau » créés par la migration 0003 : ils
-- occupaient de la place et ralentissaient chaque enregistrement pour rien. La recherche
-- lit les fiches du compte une à une, ce qui prend environ 20 millisecondes pour 30 000 fiches.
--
--   1. Retire ces cinq index inutilisés. L'index de la liste alphabétique, lui, sert et reste.
--   2. Réécrit la recherche des doublons, qui recalculait le nom cherché à chaque fiche lue
--      (0,7 seconde) : le nom est désormais mis en forme une seule fois.
-- Aucune donnée n'est modifiée.

drop index if exists public.contacts_recherche_trgm_idx;
drop index if exists public.contacts_nom_tri_trgm_idx;
drop index if exists public.contacts_telephones_idx;
drop index if exists public.contacts_courriels_idx;
drop index if exists public.contacts_etiquettes_idx;

-- Doublons probables : même téléphone, même courriel, ou nom très proche.
-- « p_sauf » écarte une fiche (celle qu'on est en train de modifier).
-- Les fiches déjà fusionnées dans une autre ne sont pas proposées.
-- S'exécute avec les droits de celui qui l'appelle : les règles d'accès par ligne s'appliquent.
create or replace function public.doublons_contact(
  p_telephones text[],
  p_courriels text[],
  p_nom text,
  p_sauf uuid default null
)
returns setof public.contacts
language plpgsql
stable
set search_path = ''
as $$
declare
  v_nom constant text := public.normaliser_recherche(p_nom);
  v_telephones constant text[] := coalesce(p_telephones, '{}');
  v_courriels constant text[] := coalesce(p_courriels, '{}');
begin
  return query
  select c.*
  from public.contacts c
  where c.fusionne_dans_id is null
    and (p_sauf is null or c.id <> p_sauf)
    and (
      c.telephones && v_telephones
      or c.courriels && v_courriels
      or (v_nom <> '' and extensions.similarity(c.nom_tri, v_nom) >= 0.6)
    )
  order by
    (c.telephones && v_telephones or c.courriels && v_courriels) desc,
    (c.archived_at is not null),
    extensions.similarity(c.nom_tri, v_nom) desc,
    c.id
  limit 5;
end;
$$;

comment on function public.doublons_contact(text[], text[], text, uuid) is
  'Fiches qui ressemblent à celle qu''on s''apprête à enregistrer : même téléphone, même courriel ou nom très proche.';

revoke all on function public.doublons_contact(text[], text[], text, uuid) from public, anon;
grant execute on function public.doublons_contact(text[], text[], text, uuid) to authenticated;
