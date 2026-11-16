-- Test de sécurité : que voit-on dans la base SANS être le propriétaire des lignes ?
--
-- Mode d'emploi : coller tout ce fichier dans l'éditeur SQL de Supabase (SQL Editor),
-- cliquer sur « Run », puis lire le tableau affiché. Explications : docs/donnees.md.
--
-- Le test ne modifie rien et n'affiche le contenu d'aucune fiche : il compte seulement.
-- Pour chaque table de l'application, il se met à la place :
--   1. d'un visiteur sans session (celui qui n'a que la clé publique du site) ;
--   2. d'un compte connecté qui n'est pas le vôtre (identifiant tiré au hasard) ;
-- et compte les lignes que chacun parvient à lire.
--
-- Résultat attendu : « OK » sur chaque ligne du tableau.

do $test$
declare
  t record;
  vues_anonyme text;
  vues_autre_compte text;
  nb bigint;
  resultat jsonb := '[]'::jsonb;
begin
  for t in
    select
      c.oid,
      c.relname as nom,
      c.relrowsecurity as rls,
      (select count(*) from pg_catalog.pg_policies p
        where p.schemaname = 'public' and p.tablename = c.relname) as nb_regles,
      (select count(*) from pg_catalog.pg_policies p
        where p.schemaname = 'public' and p.tablename = c.relname
          and (p.roles && array['anon', 'public']::name[])) as nb_regles_ouvertes
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
    order by c.relname
  loop
    -- 1. Visiteur sans session.
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    begin
      execute format('select count(*) from public.%I', t.nom) into nb;
      vues_anonyme := nb::text;
    exception when insufficient_privilege then
      vues_anonyme := 'refus';
    end;
    reset role;

    -- 2. Compte connecté, mais qui n'est pas le propriétaire des lignes.
    perform set_config(
      'request.jwt.claims',
      json_build_object('role', 'authenticated', 'sub', gen_random_uuid())::text,
      true
    );
    set local role authenticated;
    begin
      execute format('select count(*) from public.%I', t.nom) into nb;
      vues_autre_compte := nb::text;
    exception when insufficient_privilege then
      vues_autre_compte := 'refus';
    end;
    reset role;
    perform set_config('request.jwt.claims', '', true);

    -- Nombre réel de lignes, pour savoir si le test a porté sur une table vide.
    execute format('select count(*) from public.%I', t.nom) into nb;

    resultat := resultat || jsonb_build_object(
      'table', t.nom,
      'regles_activees', t.rls,
      'nb_regles', t.nb_regles,
      'lignes_dans_la_table', nb,
      'vues_sans_session', vues_anonyme,
      'vues_par_un_autre_compte', vues_autre_compte,
      'verdict', case
        when not t.rls then 'ÉCHEC : règles d''accès par ligne désactivées'
        when t.nb_regles = 0 then 'ÉCHEC : aucune règle d''accès'
        when t.nb_regles_ouvertes > 0 then 'ÉCHEC : une règle s''applique aux visiteurs sans session'
        when vues_anonyme not in ('0', 'refus') then 'ÉCHEC : lignes visibles sans session'
        when vues_autre_compte not in ('0', 'refus') then 'ÉCHEC : lignes visibles par un autre compte'
        when nb = 0 then 'OK (table vide : à refaire après avoir enregistré une ligne)'
        else 'OK'
      end
    );
  end loop;

  perform set_config('immocrm.test_securite', resultat::text, false);
end
$test$;

select *
from jsonb_to_recordset(current_setting('immocrm.test_securite')::jsonb) as r(
  "table" text,
  regles_activees boolean,
  nb_regles int,
  lignes_dans_la_table bigint,
  vues_sans_session text,
  vues_par_un_autre_compte text,
  verdict text
);
