-- Restauration, 1re partie : vide toutes les tables de l'application (schéma public).
-- Lancé par restaurer.sh dans UNE SEULE transaction avec le chargement des données :
-- si la suite échoue, rien n'est vidé.
-- Les déclencheurs sont suspendus le temps de la restauration : les lignes reviennent
-- telles qu'elles étaient (dates de modification, historiques…).
set local session_replication_role = replica;

do $vider$
declare
  liste text;
begin
  select string_agg(format('public.%I', tablename), ', ' order by tablename)
    into liste
    from pg_catalog.pg_tables
   where schemaname = 'public';
  if liste is not null then
    execute 'truncate table ' || liste;
  end if;
end
$vider$;
