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
- **Supprimer définitivement** n'existe pas par défaut : aucune table ne donne le droit de suppression. Une table concernée par le droit à l'effacement (les contacts, à l'étape 1.3) recevra, dans sa migration, un droit et une règle de suppression réservés au propriétaire, utilisés uniquement pour une demande RGPD.

## Accès depuis l'application

Toutes les pages passent par `src/lib/donnees.ts`. Aucune page n'appelle Supabase directement.

| Fonction | Effet |
| --- | --- |
| `lister(client, table, options)` | Lit les lignes ; écarte les archivées sauf `archives: 'avec'` ou `'seulement'` ; tri et limite facultatifs |
| `lire(client, table, id)` | Lit une ligne |
| `creer(client, table, valeurs)` | Crée une ligne et la renvoie complète |
| `modifier(client, table, id, valeurs)` | Modifie une ligne et la renvoie à jour |
| `archiver` / `restaurer(client, table, id)` | Archive une ligne, ou annule l'archivage |
| `enregistrerUnique(client, table, valeurs, colonne)` | Crée ou met à jour la ligne unique (réglages) |

Chaque fonction renvoie soit `{ ok: true, donnees }`, soit `{ ok: false, erreur }`, sans jamais lever d'erreur. `erreur.message` est une phrase en français, affichable telle quelle ; `erreur.genre` permet à un écran de réagir (`reseau`, `session`, `droits`, `doublon`, `lien`, `invalide`, `introuvable`, `inconnue`). La traduction est dans `src/lib/erreurs-donnees.ts`.

```ts
const resultat = await lister(exigerSupabase(), 'reglages', { limite: 1 })
if (!resultat.ok) notifier('erreur', resultat.erreur.message)
```

Une valeur choisie dans une liste fermée (type, rôle, source, température) est une colonne de texte, bornée par une contrainte dans la migration ; ses libellés français sont dans le code du domaine (`src/features/contacts/contacts.ts`). Un téléphone est enregistré au format international sans espace (`+33612345678`) et affiché à la française (`src/features/contacts/telephone.ts`).

Supabase renvoie au plus 1 000 lignes par lecture : `lister` ne va pas au-delà. Suffisant pour démarrer ; la recherche de l'étape 1.2 devra en tenir compte.

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

L'ajout dans la base passe par une seule fonction, `insererDonneesFictives`, qui **refuse d'agir ailleurs que sur le projet de test**. La carte « Données fictives » de la page Réglages n'apparaît que sur le projet de test. Son bouton ajoute 12 contacts fictifs (personnes et sociétés, tous étiquetés « fictif ») ; chaque appui en ajoute 12 de plus. Chaque étape qui crée une table ajoute son lot à la liste `JEUX_FICTIFS`.

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
| `nb_regles` | 3 ou plus |
| `vues_sans_session` | `refus` (ou `0`) |
| `vues_par_un_autre_compte` | `0` |
| `verdict` | `OK` |

Le test se met tour à tour à la place d'un visiteur sans session, puis d'un compte connecté qui n'est pas le vôtre, et compte ce que chacun parvient à lire. Il ne modifie rien et n'affiche le contenu d'aucune fiche. Si une table est vide, le verdict le précise : refaire le test après y avoir enregistré une ligne, sinon « aucune ligne visible » ne prouve rien.

Tout verdict commençant par `ÉCHEC` est une faille : ne plus rien enregistrer dans la table concernée tant qu'une migration ne l'a pas corrigée.

### Dans l'application (contrôle rapide)

**Plus → Réglages → Sécurité → « Vérifier l'accès sans connexion »**. L'application interroge chaque table sans votre session, avec la seule clé publique, exactement comme le ferait un inconnu depuis Internet. Réponse attendue : « Sans connexion, aucune ligne n'est visible ».

Ce contrôle confirme le premier point seulement (le visiteur sans session) ; le test dans Supabase reste la référence.
