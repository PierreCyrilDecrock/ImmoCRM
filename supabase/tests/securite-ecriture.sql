-- Test de sécurité, second volet : peut-on ÉCRIRE dans la base sans être le propriétaire ?
--
-- Complète supabase/tests/securite-acces.sql, qui vérifie la lecture. Mode d'emploi : coller
-- tout ce fichier dans l'éditeur SQL de Supabase (SQL Editor), cliquer sur « Run », lire le
-- tableau affiché. Explications : docs/donnees.md.
--
-- Le test ne modifie rien : chaque essai est annulé aussitôt, qu'il réussisse ou non. Il
-- n'affiche le contenu d'aucune fiche. Pour chaque table (et pour les fichiers du stockage),
-- il se met à la place :
--   1. d'un visiteur sans session (celui qui n'a que la clé publique du site) ;
--   2. d'un compte connecté qui n'est pas le vôtre (identifiant tiré au hasard) ;
-- et tente d'ajouter une ligne au nom du vrai propriétaire, de modifier et de supprimer
-- toutes les lignes.
--
-- Résultat attendu : « OK » sur chaque ligne du tableau. « refus » ou « 0 ligne » signifient
-- que la base a bloqué l'essai.

do $test$
declare
  t record;
  proprietaire uuid;
  essai text;
  operation text;
  instruction text;
  jeton text;
  n bigint;
  issue text;
  issues jsonb;
  resultat jsonb := '[]'::jsonb;
begin
  -- Le propriétaire des lignes existantes (ou un inconnu si la base est vide).
  select user_id into proprietaire from public.reglages limit 1;
  proprietaire := coalesce(proprietaire, gen_random_uuid());

  for t in
    select c.relname::text as nom, false as stockage
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and c.relkind in ('r', 'p')
    union all
    select b.id, true from storage.buckets b
    order by 2, 1
  loop
    issues := '{}'::jsonb;
    foreach essai in array array['anon', 'authenticated'] loop
      foreach operation in array array['ajout', 'modification', 'suppression'] loop
        if t.stockage then
          instruction := case operation
            when 'ajout' then format(
              'insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)',
              t.nom, proprietaire::text || '/essai-securite.jpg', proprietaire::text)
            when 'modification' then format(
              'update storage.objects set name = name where bucket_id = %L', t.nom)
            else format('delete from storage.objects where bucket_id = %L', t.nom)
          end;
        else
          instruction := case operation
            when 'ajout' then format(
              'insert into public.%I (user_id) values (%L)', t.nom, proprietaire)
            when 'modification' then format('update public.%I set user_id = user_id', t.nom)
            else format('delete from public.%I', t.nom)
          end;
        end if;
        jeton := case essai
          when 'anon' then '{"role":"anon"}'
          else json_build_object('role', 'authenticated', 'sub', gen_random_uuid())::text
        end;
        begin
          perform set_config('request.jwt.claims', jeton, true);
          execute format('set local role %I', essai);
          execute instruction;
          get diagnostics n = row_count;
          issue := n::text || ' ligne';
          -- Annule l'essai, même s'il a réussi.
          raise exception using errcode = 'IC999', message = 'annulation du test';
        exception
          when sqlstate 'IC999' then null;
          when insufficient_privilege then issue := 'refus';
          when others then issue := 'refus (' || sqlstate || ')';
        end;
        reset role;
        perform set_config('request.jwt.claims', '', true);
        issues := issues || jsonb_build_object(essai || ' ' || operation, issue);
      end loop;
    end loop;

    resultat := resultat || jsonb_build_object(
      'table', case when t.stockage then 'stockage : ' || t.nom else t.nom end,
      'sans_session', concat_ws(' / ', issues ->> 'anon ajout', issues ->> 'anon modification',
        issues ->> 'anon suppression'),
      'autre_compte', concat_ws(' / ', issues ->> 'authenticated ajout',
        issues ->> 'authenticated modification', issues ->> 'authenticated suppression'),
      'verdict', case
        when exists (
          select 1 from jsonb_each_text(issues) e
          where e.value not like 'refus%' and e.value <> '0 ligne'
        ) then 'ÉCHEC : une écriture a réussi'
        else 'OK'
      end
    );
  end loop;

  perform set_config('immocrm.test_ecriture', resultat::text, false);
end
$test$;

-- Chaque case se lit « ajout / modification / suppression ».
select *
from jsonb_to_recordset(current_setting('immocrm.test_ecriture')::jsonb) as r(
  "table" text,
  sans_session text,
  autre_compte text,
  verdict text
);
