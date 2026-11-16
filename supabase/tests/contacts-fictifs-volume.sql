-- Essai de volume : ajoute 30 000 contacts fictifs, pour mesurer les temps de réponse
-- de la recherche et des listes (étape 1.2).
--
-- !!! PROJET DE TEST UNIQUEMENT (« Immo CRM - test »). Ne jamais lancer sur le projet réel. !!!
--
-- Tout est inventé et reconnaissable : noms factices (« Fictif du Lac », « Pseudo des Moulins »),
-- code postal 00000, courriels en « exemple.invalid », téléphones pris dans les tranches que
-- l'Arcep réserve aux œuvres de fiction (06 39 98, 01 99 00 et 02 61 91 : aucun abonné).
-- Chaque fiche porte les étiquettes « fictif » et « essai de volume ».
--
-- Garde-fous : le script s'arrête si la base a plusieurs comptes, si elle contient plus de
-- 20 fiches qui ne sont pas étiquetées « fictif », ou si l'essai a déjà été chargé.
--
-- Pour retirer ces fiches (éditeur SQL de Supabase, projet de test) :
--   delete from public.contacts c where 'essai de volume' = any(c.etiquettes);

do $volume$
declare
  nombre constant integer := 30000;
  proprietaire uuid;
  prenoms constant text[] := array[
    'Camille', 'Dominique', 'Claude', 'Sacha', 'Alix', 'Maxence', 'Lou', 'Morgan', 'Andréa',
    'Charlie', 'Eden', 'Noa', 'Élie', 'Yaël', 'Swann', 'Louison', 'Ange', 'Céleste', 'Maël',
    'Loïs', 'Jade', 'Léo', 'Inès', 'Hugo', 'Zoé', 'Jules', 'Chloé', 'Nathan', 'Léa', 'Théo',
    'Manon', 'Lucas', 'Emma', 'Paul', 'Anaïs', 'Rémi', 'Hélène', 'François', 'Gaëlle', 'Jérôme'
  ];
  noms_debut constant text[] := array[
    'Fictif', 'Exemple', 'Factice', 'Postiche', 'Simili', 'Pseudo', 'Essai', 'Maquette',
    'Brouillon', 'Mirage', 'Chimère', 'Fable', 'Leurre', 'Illusion', 'Spécimen', 'Imaginaire',
    'Inventé', 'Simulé', 'Supposé', 'Prétendu'
  ];
  noms_fin constant text[] := array[
    'du Test', 'de l''Essai', 'du Mont', 'du Val', 'du Lac', 'du Bois', 'du Pré', 'du Pont',
    'du Clos', 'du Mas', 'de la Roche', 'de la Mare', 'de la Vigne', 'de la Lande',
    'de la Rive', 'de la Combe', 'des Champs', 'des Sources', 'des Vergers', 'des Moulins'
  ];
  voies constant text[] := array[
    'rue de l''Exemple', 'avenue du Test', 'impasse Fictive', 'place de la Démonstration',
    'chemin des Essais', 'boulevard Factice', 'allée des Spécimens', 'quai de la Maquette',
    'rue du Brouillon', 'cours Imaginaire'
  ];
  villes constant text[] := array[
    'Villefictive', 'Exemple-sur-Test', 'Saint-Factice', 'Bourg-Imaginaire', 'Essai-les-Bains'
  ];
  tranches constant text[] := array['+3363998', '+3319900', '+3326191'];
  lots_roles constant text[] := array[
    '{vendeur}', '{acquereur}', '{vendeur,acquereur}', '{prescripteur}', '{}', '{}'
  ];
  lots_etiquettes constant text[] := array[
    '{investisseur}', '{}', '{résidence secondaire,retraité}', '{primo-accédant}', '{}'
  ];
  sources constant text[] := array[
    'pige', 'porte_a_porte', 'boitage', 'demande_entrante', 'reseaux_sociaux_site',
    'sphere_personnelle'
  ];
  temperatures constant text[] := array['chaud', 'tiede', 'froid', 'veille', 'veille', 'veille'];
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Essai de volume refusé : la base doit avoir un seul compte.';
  end if;
  select id into proprietaire from auth.users;

  if (select count(*) from public.contacts c where not ('fictif' = any(c.etiquettes))) > 20 then
    raise exception 'Essai de volume refusé : cette base contient des fiches non fictives. Est-ce bien le projet de test ?';
  end if;
  if exists (select 1 from public.contacts c where 'essai de volume' = any(c.etiquettes)) then
    raise exception 'Essai de volume déjà chargé.';
  end if;

  insert into public.contacts (
    user_id, type, civilite, prenom, nom, raison_sociale, telephones, courriels,
    adresse, code_postal, ville, notes, roles, etiquettes, source, source_detail, temperature
  )
  select
    proprietaire,
    case when f.societe then 'societe' else 'personne' end,
    case when f.rang % 2 = 0 then 'mme' else 'm' end,
    f.prenom,
    f.nom,
    case when f.societe then 'Étude ' || f.nom || ' et associés' else '' end,
    array[tranches[1 + f.rang / 10000] || lpad((f.rang % 10000)::text, 4, '0')],
    array[
      replace(public.normaliser_recherche(f.prenom || '.' || split_part(f.nom, ' ', 1)), ' ', '')
      || f.rang || '@exemple.invalid'
    ],
    (1 + f.h3 % 98) || ' ' || voies[1 + f.h4 % 10],
    '00000',
    villes[1 + f.h5 % 5],
    'Fiche fictive, créée pour l''essai de volume.',
    case when f.societe then '{notaire}'::text[] else lots_roles[1 + f.h4 % 6]::text[] end,
    array['fictif', 'essai de volume'] || lots_etiquettes[1 + f.h3 % 5]::text[],
    sources[1 + f.h5 % 6],
    'Origine fictive',
    temperatures[1 + f.h1 % 6]
  from (
    select
      g.rang,
      g.rang % 12 = 11 as societe,
      prenoms[1 + h.h1 % 40] as prenom,
      noms_debut[1 + h.h2 % 20] || ' ' || noms_fin[1 + h.h3 % 20] as nom,
      h.h1, h.h3, h.h4, h.h5
    from generate_series(0, nombre - 1) as g(rang)
    cross join lateral (
      -- Cinq tirages indépendants et reproductibles : le même rang donne la même fiche.
      select
        hashint4(g.rang) & 2147483647 as h1,
        hashint4(g.rang + 100000) & 2147483647 as h2,
        hashint4(g.rang + 200000) & 2147483647 as h3,
        hashint4(g.rang + 300000) & 2147483647 as h4,
        hashint4(g.rang + 400000) & 2147483647 as h5
    ) as h
  ) as f;
end
$volume$;

analyze public.contacts;

select count(*) as contacts_dans_la_base from public.contacts;
