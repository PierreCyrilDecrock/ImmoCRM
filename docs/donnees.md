# ImmoCRM — Données et sécurité

Ce document fixe le cadre dans lequel toutes les tables sont créées, et la façon dont l'application y accède. Il s'applique à chaque étape qui touche à la base.

## L'essentiel

- La base vit dans Supabase, en deux exemplaires : le projet **de test** (données fictives) et le projet **réel** (vraies fiches).
- Le site est public et son code lisible par tous : **la sécurité est portée par la base**. Chaque table n'accepte que les requêtes du propriétaire des lignes.
- Rien ne se supprime : une fiche s'**archive**. La suppression définitive est réservée aux demandes RGPD.

## Migrations

Toute modification de la base est un fichier SQL dans `supabase/migrations/`, numéroté sur quatre chiffres et nommé d'après ce qu'il apporte : `0001_fondations_reglages.sql`, `0002_contacts.sql`…

| Règle | Détail |
| --- | --- |
| Le fichier du dépôt est la référence | On n'applique jamais de SQL qui n'y figure pas. |
| Projet de test | Claude Code applique la migration lui-même, par le connecteur Supabase, puis vérifie le résultat. |
| Projet réel | Seulement après votre accord explicite, redonné pour chaque migration, une fois l'étape validée sur le test. |
| Un fichier appliqué ne change plus | Une correction est un nouveau fichier numéroté. |
| Même ordre partout | Le projet réel reçoit les mêmes fichiers, dans le même ordre que le test. |

La procédure pas à pas est dans `.claude/skills/supabase/SKILL.md`.

## Ce que toute table contient

| Colonne | Type | Rôle |
| --- | --- | --- |
| `id` | `uuid`, clé primaire, `gen_random_uuid()` par défaut | Identifiant de la ligne |
| `user_id` | `uuid`, obligatoire, `auth.uid()` par défaut, lié à `auth.users` | Propriétaire : le compte connecté au moment de la création |
| `created_at` | `timestamptz`, `now()` par défaut | Date de création |
| `updated_at` | `timestamptz`, `now()` par défaut | Date de dernière modification, tenue à jour par un déclencheur |
| `archived_at` | `timestamptz`, vide par défaut | Date d'archivage ; vide = fiche active |

L'application n'envoie jamais ces cinq colonnes : la base les remplit. `archived_at` ne change que par les fonctions `archiver` et `restaurer`.

Exception : une table qui n'a qu'une ligne par utilisateur et ne s'archive pas (`reglages`) n'a pas de colonne `archived_at`.

Nommage : tables et colonnes en français, sans accent, en minuscules avec des tirets bas (`projets_vendeurs`, `date_naissance`). Tables au pluriel. Les cinq colonnes communes gardent leur nom anglais, par habitude de l'outil.

## Sécurité de chaque table

Chaque migration qui crée une table fait ces quatre choses, sans exception :

1. **Active les règles d'accès par ligne** (`enable row level security`).
2. **Retire tous les droits** aux visiteurs sans session, puis ne donne au compte connecté que le nécessaire : lire, créer, modifier. Pas de droit de suppression.
3. **Écrit une règle par action** (lecture, création, modification), réservée aux comptes connectés, avec la condition `(select auth.uid()) = user_id` : chacun ne voit et ne touche que ses lignes.
4. **Branche le déclencheur** `maj_updated_at()` avant chaque modification.

Modèle à recopier (remplacer `exemples`) :

```sql
create table public.exemples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
  -- … colonnes propres à la table
);

create index exemples_user_id_idx on public.exemples (user_id);

create trigger exemples_maj_updated_at
  before update on public.exemples
  for each row execute function public.maj_updated_at();

revoke all on table public.exemples from public, anon, authenticated;
grant select, insert, update on table public.exemples to authenticated;

alter table public.exemples enable row level security;

create policy exemples_lecture_proprietaire on public.exemples
  for select to authenticated using ((select auth.uid()) = user_id);
create policy exemples_creation_proprietaire on public.exemples
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy exemples_modification_proprietaire on public.exemples
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

Une table liée à une autre (un bien et son propriétaire) porte elle aussi son `user_id` et ses propres règles : on ne compte jamais sur la table voisine pour la protéger. Toute fonction SQL fixe son `search_path` (`set search_path = ''`).

## Archivage et suppression

- **Archiver** inscrit la date dans `archived_at`. La fiche disparaît des listes, reste consultable et peut être restaurée.
- **Supprimer définitivement** n'existe pas par défaut : aucune table ne donne le droit de suppression. Seule exception, pour le droit à l'effacement : la table `contacts` a un droit et une règle de suppression réservés au propriétaire (migration 0005), utilisés uniquement par la fonction `supprimer_contact_definitivement`, après une double confirmation dans l'application.

Règle pour toute table liée aux contacts : sa clé étrangère vers `contacts` porte `on delete cascade`, pour que la suppression définitive d'une fiche emporte tout ce qui lui est lié sans donner de droit de suppression sur la table elle-même. Voir « Consentement et RGPD » plus bas.

## Accès depuis l'application

Toutes les pages passent par `src/lib/donnees.ts`. Aucune page n'appelle Supabase directement.

| Fonction | Effet |
| --- | --- |
| `lister(client, table, options)` | Lit les lignes ; écarte les archivées sauf `archives: 'avec'` ou `'seulement'` ; tri et limite facultatifs |
| `listerPage(client, table, options)` | Lit une page de lignes filtrées et triées par la base, avec le total si demandé : pour toute liste qui peut grossir. Filtres possibles : `egal`, `contient`, `comprend` (tableau), `parmi` (liste de valeurs), `min` et `max` (nombres) |
| `lire(client, table, id)` | Lit une ligne |
| `creer(client, table, valeurs)` | Crée une ligne et la renvoie complète |
| `modifier(client, table, id, valeurs)` | Modifie une ligne et la renvoie à jour |
| `archiver` / `restaurer(client, table, id)` | Archive une ligne, ou annule l'archivage |
| `enregistrerUnique(client, table, valeurs, colonne)` | Crée ou met à jour la ligne unique (réglages) |
| `appeler(client, fonction, parametres)` | Appelle une fonction de la base (doublons, fusion, étiquettes, suppression définitive) |

Chaque fonction renvoie soit `{ ok: true, donnees }`, soit `{ ok: false, erreur }`, sans jamais lever d'erreur. `erreur.message` est une phrase en français, affichable telle quelle ; `erreur.genre` permet à un écran de réagir (`reseau`, `session`, `droits`, `doublon`, `lien`, `invalide`, `introuvable`, `inconnue`). La traduction est dans `src/lib/erreurs-donnees.ts`.

```ts
const resultat = await lister(exigerSupabase(), 'reglages', { limite: 1 })
if (!resultat.ok) notifier('erreur', resultat.erreur.message)
```

Une valeur choisie dans une liste fermée (type, rôle, source, température) est une colonne de texte, bornée par une contrainte dans la migration ; ses libellés français sont dans le code du domaine (`src/features/contacts/contacts.ts`). Un téléphone est enregistré au format international sans espace (`+33612345678`) et affiché à la française (`src/features/contacts/telephone.ts`).

Supabase renvoie au plus 1 000 lignes par lecture : `lister` ne va pas au-delà. Il est réservé aux petites tables. Une liste qui peut grossir (contacts, biens…) se lit avec `listerPage`, 50 lignes à la fois : l'application ne charge jamais toute une table.

### Recherche, doublons et fusion des contacts

La recherche est faite par la base, pas par le navigateur.

| Élément | Rôle |
| --- | --- |
| Colonne `recherche` | Tout le texte cherchable d'une fiche (nom, prénom, société, courriels, adresse), sans accent ni majuscule, suivi de chaque téléphone en chiffres seuls sous deux écritures : `0612345678` et `33612345678` |
| Colonne `nom_tri` | Nom de classement (« nom prénom » ou raison sociale), sans accent ni majuscule : c'est l'ordre de la liste |
| Colonne `fusionne_dans_id` | Sur une fiche fusionnée : la fiche qui a tout repris |
| Fonction `normaliser_recherche(texte)` | La mise en forme commune (minuscules, sans accent, tirets et apostrophes en espaces) |
| Fonction `etiquettes_contacts()` | Les étiquettes utilisées, pour le filtre |
| Fonction `doublons_contact(…)` | Les fiches au même téléphone, au même courriel ou au nom très proche |
| Fonction `fusionner_contacts(garde, absorbe, valeurs)` | Réunit deux fiches en une seule opération : tout réussit ou rien ne change |

Les colonnes `recherche` et `nom_tri` sont calculées par un déclencheur à chaque enregistrement : l'application ne les envoie jamais. Côté application, `src/lib/recherche.ts` applique la même mise en forme à ce qui est tapé et réunit les morceaux d'un téléphone (« 06 12 » devient `0612`, « +33 6 12 » devient `33612`) ; chaque mot tapé doit figurer dans la fiche. Les deux mises en forme (SQL et TypeScript) doivent rester identiques.

Ces fonctions s'exécutent avec les droits du compte connecté : les règles d'accès par ligne s'y appliquent comme ailleurs, et un visiteur sans session ne peut pas les appeler. Aucune fonction ne contourne ces règles.

Conséquence à connaître : avec les règles d'accès par ligne, la base ne peut pas s'appuyer sur un index pour une recherche « contient ». Elle lit les fiches du compte une à une (20 ms pour 30 000 fiches, mesures dans `docs/avancement.md`). Inutile donc de créer ce type d'index.

**Fusion.** Rien ne se perd : téléphones, courriels, rôles et étiquettes sont réunis ; là où les deux fiches se contredisent, l'utilisateur choisit et la valeur écartée est recopiée dans les notes ; la fiche absorbée est archivée telle quelle, avec un lien vers la fiche gardée. Les règles sont dans `src/features/contacts/fusion.ts`. Toute nouvelle table liée aux contacts doit ajouter, dans sa migration, le transfert de ses lignes à la fonction `fusionner_contacts` (c'est fait pour `appels_sans_accord` et `biens_proprietaires`) ; toute nouvelle colonne des contacts doit y être ajoutée aussi. Le consentement est réuni par prudence (`reunirConsentement`) : la réponse la plus récente sur l'accord l'emporte, un refus l'emporte si les dates ne départagent pas, une opposition notée sur l'une des fiches vaut pour la fiche réunie.

### Biens, propriétaires et historique des prix

Un bien est un logement, un local ou un terrain (table `biens`). Son **type** (`ancien`, `neuf`, `viager`, `commerce`, `terrain`) décide des champs utilisés.

| Élément | Rôle |
| --- | --- |
| Colonnes communes | Adresse (`adresse`, `complement`, `code_postal`, `ville`), `type`, `statut`, `prix` (euros, sans centimes), `description` |
| Colonnes d'un bâtiment (tout sauf un terrain) | `etage` (0 = rez-de-chaussée), `surface`, `pieces`, `annee_construction`, `etat`, DPE et GES (`classe`, `valeur`, `date`) ; `chambres` sauf pour un commerce |
| Colonnes propres à un type | Ancien : `copropriete`, `charges_annuelles`, `taxe_fonciere`. Neuf : `programme`, `lot`, `date_livraison`. Viager : `viager_bouquet`, `viager_rente` (par mois), `viager_occupation`, `viager_ages`. Commerce : `commerce_nature`, `commerce_bail`, `commerce_loyer` (par an), `commerce_activite`. Terrain : `surface_terrain`, `constructible`, `viabilise` |
| Colonne `recherche` | Adresse, complément, code postal, ville et programme, sans accent ni majuscule ; calculée par un déclencheur, jamais envoyée par l'application |
| Table `biens_proprietaires` | Un lien par propriétaire (contact), avec sa `quote_part` facultative. Un seul lien actif par bien et par contact |
| Table `biens_prix` | Une ligne par prix affiché, datée par `created_at`. Remplie par un déclencheur à la création d'un bien qui a un prix, puis à chaque changement : l'application n'y écrit jamais |

**Champs par type.** La règle est dans `CHAMPS_PAR_TYPE` (`src/features/biens/biens.ts`) : le formulaire et la fiche n'affichent que les champs du type ; à l'enregistrement, `preparerBien` vide les autres. La base, elle, accepte tous les champs quel que soit le type : c'est l'application qui fait le tri. Ajouter un champ propre à un type, c'est une colonne dans une migration, une entrée dans `CHAMPS_PAR_TYPE`, un champ dans `FormulaireBien` et une ligne sur la fiche.

**Liste.** Les biens sont lus 50 à la fois, les plus récemment créés d'abord, avec la recherche par morceau d'adresse et les filtres (type, statut, fourchette de prix) faits par la base (`src/features/biens/filtres.ts`). Avec une borne de prix, les biens sans prix ne sont pas listés.

**Propriétaires.** Retirer un propriétaire archive le lien ; ni le contact ni le bien ne changent. Lors d'une fusion de contacts, les biens de la fiche absorbée passent à la fiche gardée (si les deux possédaient le même bien, le lien en double est archivé). La suppression définitive d'un contact emporte ses liens, pas les biens : le bien reste dans la base, sans ce propriétaire. Les biens d'une personne figurent dans son export.

**Historique des prix.** Un prix effacé ne crée pas de ligne ; un prix remis à la même valeur non plus. L'âge des crédirentiers d'un viager est celui noté le jour de la saisie : il ne se met pas à jour tout seul.

### Consentement et RGPD des contacts

Ces règles traduisent la section Conformité du cadrage. Elles sont **à faire valider par un juriste**.

| Élément | Rôle |
| --- | --- |
| Colonnes `collecte_origine`, `collecte_date` | Comment et quand les données ont été obtenues ; la date vaut le jour de création si rien n'est saisi |
| Colonnes `accord_appel`, `accord_appel_date`, `accord_appel_preuve` | Accord pour être appelé : `oui`, `non` ou `inconnu` (par défaut). La base refuse un `oui` sans date ni preuve |
| Colonne `client_existant` | Un contrat est en cours : motif proposé d'office pour appeler, à confirmer à chaque appel |
| Colonnes `opposition_demarchage`, `opposition_demarchage_date` | La personne s'oppose à toute prospection : l'appel est bloqué même avec un accord |
| Colonne `dernier_contact_le` | Date du dernier échange connu, calculée par un déclencheur ; servira à la purge des fiches inactives |
| Table `appels_sans_accord` | Un appel passé sans accord enregistré : contact, numéro, motif (`client_existant`, `appel_entrant`, `professionnel`, `autre`) et précision |
| Fonction `supprimer_contact_definitivement(id)` | Droit à l'effacement : supprime la fiche, les fiches fusionnées dans celle-ci et, en cascade, tout ce qui leur est lié |

**Blocage de l'appel.** La règle est une fonction pure, `droitAppel` (`src/features/contacts/consentement.ts`) : l'appel direct n'est proposé que si l'accord vaut `oui` et qu'il n'y a pas d'opposition. Sinon la fiche affiche un avertissement ; pour passer outre, il faut indiquer un motif, enregistré dans `appels_sans_accord` **avant** que le numéro ne soit proposé. Ce blocage est une aide à la conformité faite par le site, pas une barrière technique : le numéro reste lisible sur la fiche.

**Date du dernier contact.** La plus récente parmi : la date de collecte, la date de l'accord ou du refus, la date d'opposition et les appels sans accord. L'application ne l'envoie jamais. Toute table qui enregistre un échange avec un contact (le journal d'activité, étape 1.7) doit être ajoutée au calcul, dans la fonction `contacts_maj_dernier_contact`, et déclencher le recalcul comme le fait `appels_sans_accord`.

**Export (droit d'accès).** `src/features/contacts/export-contact.ts` fabrique un fichier texte avec toutes les colonnes de la fiche, les appels sans accord et les anciennes fiches fusionnées. Un test échoue si une colonne de `contacts` n'y figure pas. Toute nouvelle table liée aux contacts doit être ajoutée à `rassemblerDonneesContact` et au fichier.

**Suppression définitive (droit à l'effacement).** Elle ne laisse aucune ligne dans la base ; le lien « recommandé par » des autres contacts est vidé. Deux limites à connaître : les sauvegardes automatiques de Supabase gardent les données supprimées jusqu'à leur expiration, et un nom cité dans les notes d'une autre fiche n'est pas retrouvé.

Chaque domaine range ses propres fonctions dans `src/features/<domaine>` (exemple : `src/features/reglages/reglages.ts`), bâties sur cette couche. Pour les tests, `src/lib/faux-client.ts` simule Supabase sans réseau.

### Types TypeScript

`src/lib/types-base.ts` décrit les tables. Il est **généré** à partir du projet de test, jamais écrit à la main. Après chaque migration, Claude Code :

1. le régénère par le connecteur Supabase et remplace le contenu du fichier, en gardant l'en-tête ;
2. lance `npm run format` ;
3. déclare la nouvelle table dans `TABLES` (`src/lib/donnees.ts`) — TypeScript refuse de construire le site si elle manque.

## Test ou réel ?

L'application reconnaît le projet de test à son adresse (`src/lib/environnement.ts`). Tout autre projet est traité comme le projet réel, par prudence. **Plus → Réglages** l'affiche en grand : **TEST** ou **RÉEL**.

## Données fictives

`src/lib/donnees-fictives.ts` fabrique des personnes inventées, reconnaissables au premier coup d'œil :

| Donnée | Ce qui la rend clairement fausse |
| --- | --- |
| Nom | Noms de famille factices : Fictif, Exemple, Factice, Spécimen… |
| Téléphone | `06 39 98 xx xx`, tranche réservée aux œuvres de fiction : aucun abonné |
| Courriel | Domaine `exemple.invalid`, qui ne peut recevoir aucun message |
| Adresse | `00000 Villefictive`, rue de l'Exemple, avenue du Test… |

L'ajout dans la base passe par une seule fonction, `insererDonneesFictives`, qui **refuse d'agir ailleurs que sur le projet de test**. La carte « Données fictives » de la page Réglages n'apparaît que sur le projet de test. Son bouton ajoute 12 contacts fictifs (personnes et sociétés, tous étiquetés « fictif », avec des situations de consentement variées : accord inconnu, accord prouvé, refus, client existant, opposition) ; chaque appui en ajoute 12 de plus. Chaque étape qui crée une table ajoute son lot à la liste `JEUX_FICTIFS`.

Exception : l'essai de volume de l'étape 1.2 (30 000 contacts, pour mesurer les temps de réponse) est un script SQL, `supabase/tests/contacts-fictifs-volume.sql`, lancé par Claude Code sur le seul projet de test. Ses fiches portent l'étiquette « essai de volume » ; leurs téléphones viennent des tranches réservées aux fictions (06 39 98, 01 99 00, 02 61 91). Le script refuse de tourner sur une base qui contient plus de 20 fiches non fictives.

Cette protection est un garde-fou contre une fausse manœuvre, pas une barrière de sécurité : c'est un contrôle fait par le site. Elle évite de mélanger du faux aux vraies fiches.

## Test de sécurité

**Ce qu'on vérifie :** une requête sans session ne renvoie aucune ligne, et un compte connecté ne voit que ses propres lignes.

**Quand :** après chaque migration, sur le projet de test puis sur le projet réel.

### Dans Supabase (test complet)

1. Ouvrir le projet dans Supabase, puis **SQL Editor**.
2. Coller tout le contenu de `supabase/tests/securite-acces.sql` et cliquer sur **Run**.
3. Lire le tableau : une ligne par table de l'application.

| Colonne | Valeur attendue |
| --- | --- |
| `regles_activees` | `true` |
| `nb_regles` | 3 ou plus (4 pour `contacts`, qui a une règle de suppression) |
| `vues_sans_session` | `refus` (ou `0`) |
| `vues_par_un_autre_compte` | `0` |
| `verdict` | `OK` |

Le test se met tour à tour à la place d'un visiteur sans session, puis d'un compte connecté qui n'est pas le vôtre, et compte ce que chacun parvient à lire. Il ne modifie rien et n'affiche le contenu d'aucune fiche. Si une table est vide, le verdict le précise : refaire le test après y avoir enregistré une ligne, sinon « aucune ligne visible » ne prouve rien.

Tout verdict commençant par `ÉCHEC` est une faille : ne plus rien enregistrer dans la table concernée tant qu'une migration ne l'a pas corrigée.

### Dans l'application (contrôle rapide)

**Plus → Réglages → Sécurité → « Vérifier l'accès sans connexion »**. L'application interroge chaque table sans votre session, avec la seule clé publique, exactement comme le ferait un inconnu depuis Internet. Réponse attendue : « Sans connexion, aucune ligne n'est visible ».

Ce contrôle confirme le premier point seulement (le visiteur sans session) ; le test dans Supabase reste la référence.
