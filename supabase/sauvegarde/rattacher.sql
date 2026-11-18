-- Restauration, 3e partie : rattache les lignes restaurées au compte du projet cible.
-- Chaque ligne porte l'identifiant du compte qui l'a créée (colonne user_id). Si la
-- sauvegarde vient d'un autre projet (nouveau projet après un incident), cet identifiant
-- diffère : on le remplace par celui de l'unique compte du projet cible, sinon les règles
-- d'accès par ligne cacheraient tout.
-- Les données chargées juste avant se terminent par RESET ALL : on suspend de nouveau les
-- déclencheurs, pour que ce rattachement ne change aucune date de modification.
set local session_replication_role = replica;

do $rattacher$
declare
  compte uuid;
  nb_comptes int;
  t record;
begin
  select count(*) into nb_comptes from auth.users;
  if nb_comptes <> 1 then
    raise exception 'Le projet cible doit avoir exactement un compte (il en a %).', nb_comptes;
  end if;
  select id into compte from auth.users;
  for t in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables tb
        on tb.table_schema = c.table_schema and tb.table_name = c.table_name
     where c.table_schema = 'public' and c.column_name = 'user_id'
       and tb.table_type = 'BASE TABLE'
     order by c.table_name
  loop
    execute format('update public.%I set user_id = $1 where user_id is distinct from $1', t.table_name)
      using compte;
  end loop;
end
$rattacher$;
