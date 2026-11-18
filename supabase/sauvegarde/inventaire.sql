-- Inventaire de la base : nombre de lignes de chaque table de l'application (schéma public),
-- une ligne « table=nombre » par table. Ne lit aucune donnée, compte seulement.
-- Utilisé par sauvegarder.sh (rangé DANS l'archive chiffrée) et par restaurer.sh (pour
-- comparer, sans afficher les nombres dans le journal public du workflow).
select format(
  '%s=%s',
  t.table_name,
  (xpath(
    '/row/n/text()',
    query_to_xml(format('select count(*) as n from public.%I', t.table_name), false, true, '')
  ))[1]::text
)
from information_schema.tables t
where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
order by t.table_name;
