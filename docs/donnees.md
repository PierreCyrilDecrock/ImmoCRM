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

Exceptions : une table qui n'a qu'une ligne par utilisateur et ne s'archive pas (`reglages`) n'a pas de colonne `archived_at` ; les photos (`biens_photos`) non plus, car elles se suppriment vraiment pour libérer la place.

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

Seconde exception, pour la place : la table `biens_photos` (migration 0008) donne un droit de suppression au propriétaire, et n'autorise à modifier que le rang d'une photo.

Règle pour toute table liée aux contacts : sa clé étrangère vers `contacts` porte `on delete cascade`, pour que la suppression définitive d'une fiche emporte tout ce qui lui est lié sans donner de droit de suppression sur la table elle-même. Voir « Consentement et RGPD » plus bas.

## Accès depuis l'application

Toutes les pages passent par `src/lib/donnees.ts`. Aucune page n'appelle Supabase directement.

| Fonction | Effet |
| --- | --- |
| `lister(client, table, options)` | Lit les lignes ; écarte les archivées sauf `archives: 'avec'` ou `'seulement'` ; tri et limite facultatifs |
| `listerPage(client, table, options)` | Lit une page de lignes filtrées et triées par la base, avec le total si demandé : pour toute liste qui peut grossir. Filtres possibles : `egal`, `contient`, `comprend` (tableau), `parmi` (liste de valeurs), `min` et `max` (nombres ou dates `AAAA-MM-JJ`), `vide` (colonne sans valeur) |
| `lire(client, table, id)` | Lit une ligne |
| `creer(client, table, valeurs)` | Crée une ligne et la renvoie complète |
| `modifier(client, table, id, valeurs)` | Modifie une ligne et la renvoie à jour |
| `archiver` / `restaurer(client, table, id)` | Archive une ligne, ou annule l'archivage |
| `supprimer(client, table, id)` | Supprime une ligne pour de bon. Réservé aux photos (`biens_photos`) : voir « Photos des biens » |
| `enregistrerUnique(client, table, valeurs, colonne)` | Crée ou met à jour la ligne unique (réglages) |
| `appeler(client, fonction, parametres)` | Appelle une fonction de la base (doublons, fusion, étiquettes, suppression définitive, clôture d'une tâche, boucle de relance, sortie d'un projet du pipeline) |

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

**Fusion.** Rien ne se perd : téléphones, courriels, rôles et étiquettes sont réunis ; là où les deux fiches se contredisent, l'utilisateur choisit et la valeur écartée est recopiée dans les notes ; la fiche absorbée est archivée telle quelle, avec un lien vers la fiche gardée. Les règles sont dans `src/features/contacts/fusion.ts`. Toute nouvelle table liée aux contacts doit ajouter, dans sa migration, le transfert de ses lignes à la fonction `fusionner_contacts` (c'est fait pour `appels_sans_accord`, `biens_proprietaires`, `taches`, `activites` et `projets_vendeurs`) ; toute nouvelle colonne des contacts doit y être ajoutée aussi. Le consentement est réuni par prudence (`reunirConsentement`) : la réponse la plus récente sur l'accord l'emporte, un refus l'emporte si les dates ne départagent pas, une opposition notée sur l'une des fiches vaut pour la fiche réunie.

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

### Photos des biens

L'offre gratuite de Supabase limite la place réservée aux fichiers (1 Go, chiffre à vérifier) : chaque photo est allégée dans le navigateur avant l'envoi, et leur nombre est plafonné.

| Élément | Rôle |
| --- | --- |
| Espace de stockage `photos-biens` | **Privé** : aucun fichier n'est lisible par son adresse seule. N'accepte que des JPEG de 500 Ko au plus (limite posée par Supabase, pas par le site) |
| Emplacement d'un fichier | `<identifiant du compte>/<identifiant du bien>/<nom>.jpg`, et `<nom>-vignette.jpg` pour la vignette |
| Règles d'accès du stockage | Lire, envoyer, supprimer : seulement dans le dossier de son propre compte, et seulement pour un bien qui existe. Pas de modification : un fichier ne se remplace pas |
| Table `biens_photos` | Une ligne par photo : `bien_id`, `chemin`, `chemin_vignette`, `rang`, `taille` (octets). Pas de colonne `archived_at` |
| Colonne `rang` | Place de la photo, à partir de 0, sans trou. **La photo de rang 0 est la photo principale.** Tenue par la base : placée à la fin à l'ajout, resserrée après une suppression |
| Fonction `ordonner_photos_bien(bien, ids)` | Range toutes les photos d'un bien dans l'ordre donné, en une seule opération |
| Fonction `espace_photos()` | Nombre de photos et poids réel des fichiers du compte, pour la page Réglages |

**Compression.** `src/lib/image.ts` ramène chaque photo à 1 600 px au plus sur son grand côté, en JPEG de moins de 300 Ko : la qualité baisse d'abord, puis la taille si cela ne suffit pas. Une vignette de 400 px (quelques Ko) est fabriquée en même temps : c'est elle qu'affichent la liste des biens et la grille de la fiche, pour ne pas télécharger les grandes photos.

**Plafond.** 20 photos par bien. L'application l'annonce, la base le vérifie (déclencheur à l'ajout).

**Affichage.** Par adresses signées, valables 15 minutes (`DUREE_ADRESSE_PHOTO`), demandées à l'ouverture de l'écran ; la grande photo en redemande une à chaque ouverture. Passé ce délai, l'adresse ne donne plus rien : seul le compte connecté peut en obtenir une nouvelle.

**Suppression.** Une photo se supprime pour de bon, après confirmation : les deux fichiers d'abord, puis la ligne. Si la seconde étape échoue, la photo reste dans la liste et la suppression peut être relancée. Archiver un bien ne supprime pas ses photos.

**Accès.** Les fichiers passent par `src/lib/stockage.ts` (`envoyerFichier`, `supprimerFichiers`, `signerAdresses`), bâti comme `donnees.ts` : un `Resultat`, jamais d'erreur levée. Les fonctions du domaine sont dans `src/features/biens/photos.ts`.

### Tâches et rendez-vous

Une tâche est toute action à venir, avec une date et un motif (table `taches`). **Un rendez-vous est une tâche qui a une heure** : il n'y a pas d'objet séparé. Le temps de prospection se bloque de la même façon : une tâche de catégorie « Prospection » avec une heure et une durée.

| Élément | Rôle |
| --- | --- |
| `titre`, `motif` | Ce qu'il faut faire, et pourquoi. Seul le titre est obligatoire |
| `categorie` | `relance`, `rendez_vous`, `visite`, `estimation`, `administratif`, `prospection`, `autre` |
| `priorite` | Un nombre, pour que la base trie dans l'ordre : 1 haute, 2 normale (par défaut), 3 basse |
| `echeance` | Le jour de la tâche (obligatoire) |
| `heure`, `duree` | Heure de début (heure de Paris, telle qu'affichée) et durée en minutes, facultatives ; pas de durée sans heure |
| `lieu` | Texte libre ; proposé d'office à l'adresse du bien choisi |
| `etat`, `cloturee_le` | `a_faire`, `faite` ou `annulee`, et le moment de la clôture. Une tâche ne se supprime pas : elle est faite ou annulée, et peut être rouverte |
| `contact_id`, `bien_id`, `projet_vendeur_id` | Liens facultatifs, vers des fiches du même compte |
| `recurrence`, `recurrence_ancre`, `recurrence_rang` | Fréquence (`jour`, `semaine`, `deux_semaines`, `mois`, `an`), date de la première occurrence de la série, place de cette occurrence dans la série |
| Fonction `cloturer_tache(id, etat, suivante_echeance, suivante_rang)` | Marque la tâche faite ou annulée et, si une date est donnée, crée l'occurrence suivante, en une seule opération. Refuse une tâche déjà close : un double appui ne crée pas deux suites |

**Dates.** Une échéance est un jour du calendrier, sans heure ni fuseau ; « aujourd'hui » est le jour à Paris (`dateDuJour`). Les calculs sur les jours (`src/lib/dates.ts` : `ajouterJours`, `ajouterMois`, `finDeSemaine`…) se font sur la date seule, en temps universel : un changement d'heure ne peut décaler aucun jour. L'heure d'un rendez-vous est l'heure affichée sur la montre : un rendez-vous hebdomadaire de 10 h reste à 10 h après le passage à l'heure d'été.

**Vues** (`src/features/taches/echeances.ts`). En retard : avant aujourd'hui. Aujourd'hui. Cette semaine : de demain à dimanche (vide le dimanche). Plus tard : après dimanche. Terminées : faites et annulées, les plus récentes d'abord. Dans une journée, les rendez-vous viennent par heure, puis les tâches sans heure, par priorité.

**Report** : demain, dans 3 jours, dans une semaine (toujours comptés depuis aujourd'hui), ou une date libre. Reporter ne déplace que cette occurrence, pas sa série.

**Récurrence** (`src/features/taches/recurrence.ts`). Les dates d'une série se calculent toujours depuis la première : une tâche mensuelle du 31 janvier tombe le 28 (ou 29) février, puis le 31 mars. Clôturer une occurrence (faite, ou annulée « cette fois seulement ») crée la suivante : la première date de la série qui tombe après l'occurrence close et pas avant aujourd'hui. Une occurrence close en retard ne crée donc pas une suite déjà en retard. « Arrêter la série » annule sans créer de suite. Changer la date ou la fréquence dans le formulaire fait repartir la série de la nouvelle date. Le calcul est fait par l'application (fonctions pures testées) ; la base vérifie seulement que la date proposée est après l'occurrence close.

**Contacts.** La suppression définitive d'un contact emporte ses tâches (même liées aussi à un bien) ; la fusion les transfère à la fiche gardée ; l'export d'un contact les liste toutes, closes comprises. Une tâche n'est pas un échange : elle n'entre pas dans la date du dernier contact ; c'est le journal d'activité qui l'alimente.

### Journal d'activité

Une activité est tout événement passé : appel, message, visite, note, document envoyé (table `activites`). **Activité (le passé) et tâche (le futur) sont deux objets distincts** : cocher une tâche liée à un contact les relie : la boucle de relance consigne l'activité et prévoit la tâche suivante (voir « Boucle de relance »).

| Élément | Rôle |
| --- | --- |
| `type` | `appel`, `sms`, `courriel`, `rendez_vous`, `visite`, `estimation`, `porte_a_porte`, `note`, `document` (document envoyé), `autre` |
| `resultat` | Pour un appel seulement : `joint`, `messagerie`, `pas_de_reponse`, `rappeler`. La base refuse un résultat sur un autre type |
| `compte_rendu` | Ce qui a été dit ou fait (5 000 caractères au plus). Obligatoire pour une note seulement, vérifié par l'application |
| `date_activite`, `heure` | Jour et heure de l'activité, à l'heure de Paris (heure affichée sur la montre). Valent maintenant si rien n'est envoyé. L'application refuse une date à venir : pour l'avenir, on crée une tâche |
| `duree` | Minutes, facultative |
| `contact_id`, `bien_id`, `projet_vendeur_id` | Liens facultatifs, vers des fiches du même compte. Une visite liée aux deux apparaît sur les deux fiches |

**Ordre.** Du plus récent au plus ancien : par date, puis par heure, puis par ordre de saisie. Les fils (fiches et page Journal) sont lus 50 activités à la fois, regroupés par jour.

**Correction.** Une activité se modifie (toucher la ligne). Une saisie en double ou faite sur la mauvaise fiche se **retire du journal** : elle est archivée, pas supprimée, et ne compte plus dans la date du dernier contact.

**Date du dernier contact.** Toute activité liée à un contact compte comme un échange, **sauf une note** (une remarque pour soi). La base recalcule la date dès qu'une activité est ajoutée, redatée, change de type, change de fiche ou est retirée (déclencheur `activites_maj_contact`) ; modifier seulement le compte rendu ne touche pas à la fiche. Recalculer la date met à jour la date « modifiée le » de la fiche, comme pour les appels sans accord.

**Contacts.** La suppression définitive d'un contact emporte son journal (même les activités liées aussi à un bien) ; la fusion le transfère à la fiche gardée ; l'export d'un contact le contient en entier, activités retirées comprises.

Code : `src/features/activites/` (règles de saisie, lecture, périodes de la page Journal, testées) ; les fiches liées sont lues par `src/features/liens/fiches-liees.ts`, commun aux tâches et au journal.

### Boucle de relance

Deux règles du cadrage : **clôturer une tâche crée une activité et propose aussitôt la suivante** ; **aucun contact sans prochaine action datée**.

| Élément | Rôle |
| --- | --- |
| Colonnes `relance_chaud`, `relance_tiede`, `relance_froid`, `relance_veille` (table `reglages`) | Délai de relance par défaut de chaque température : un nombre de 1 à 99 suivi de `j`, `s` ou `m` (`1s`, `1m`, `3m`, `6m` par défaut). Modifiables dans Réglages, « Rythme des relances » |
| Colonne `contacts.prochaine_action_le` | Échéance de la plus proche des tâches à faire liées au contact ; vide : rien n'est prévu. **Calculée par la base** (déclencheurs `contacts_maj_prochaine_action` et `taches_maj_contact`) ; l'application ne l'envoie jamais |
| Colonne `contacts.sans_prochaine_action_le` | Moment où l'absence de prochaine action a été confirmée. Vidée par la base dès qu'une tâche est de nouveau prévue |
| Fonction `boucler_tache(...)` | Une tâche liée à un contact est faite : clôture (et occurrence suivante d'une série, avec les contrôles de `cloturer_tache`), activité au journal (liée au contact et au bien de la tâche), température mise à jour si elle a changé, puis prochaine action créée (même contact, même bien) ou refus confirmé. Tout ou rien. Sans prochaine action ni refus, la base exige qu'une autre tâche reste prévue pour le contact |

**Date proposée** (`src/features/relances/delais.ts`, testé) : aujourd'hui plus le délai de la température du contact ; les semaines comptent 7 jours, les mois suivent le calendrier (le 31 janvier + 1 mois = le 28 ou 29 février). Sans température, le délai d'un contact tiède. La date se change au cas par cas dans l'écran (champ Date, raccourcis, ou changement de température). L'écran et ses règles sont dans `src/features/relances/` (`boucle.ts`, testé).

**Quelles tâches ?** Cocher une tâche liée à un contact ouvre la boucle, depuis la page Tâches, les fiches ou l'en-tête de la fiche Contact. Une tâche sans contact (même liée à un bien) est faite en un geste, sans activité. Annuler une tâche ne passe pas par la boucle.

**Vue « Contacts sans prochaine action »** : fiches actives dont `prochaine_action_le` est vide, qu'il y ait eu refus confirmé ou jamais aucune tâche. Changer une tâche ne touche la fiche (et sa date « modifiée le ») que si la date de la prochaine action change.

### Projets vendeurs et pipeline vendeur

Un projet vendeur est **l'intention de vendre un bien donné** (table `projets_vendeurs`). La personne et son projet sont deux choses distinctes : un même contact peut avoir plusieurs projets, un par bien. Un bien n'a qu'un projet en cours (ou à recontacter) à la fois ; les projets perdus ou gagnés restent à côté.

| Élément | Rôle |
| --- | --- |
| `contact_id`, `bien_id` | Le vendeur (contact principal) et le bien, obligatoires |
| `etape`, `etape_le` | `premier_contact`, `decouverte`, `estimation`, `suivi`, `mandat_signe`, et le jour d'entrée dans l'étape. **`etape_le` est tenu par la base** (déclencheur `projets_vendeurs_maj_etape_le`) : remis au jour à chaque changement d'étape |
| `etat` | `actif` (dans le pipeline), `a_recontacter` (avec `recontacter_le`), `perdu` (avec `motif_perte` et `motif_perte_detail`), `gagne` (exactement quand l'étape est `mandat_signe`) |
| Découverte | `motif_vente`, `echeance_souhaitee` (date avant laquelle vendre), `prix_espere` |
| Estimation | `estimation_basse`, `estimation_haute` (la base refuse une fourchette inversée), `estimation_le`, `avis_remis_le` |
| Concurrence | `agences_consultees` (texte), `mandat_ailleurs`, `mandat_ailleurs_fin` |
| Mandat signé | `mandat_type` (`simple`, `exclusif`) et `mandat_le` ; le détail du mandat viendra en version 2 |
| `notes` | Relances, objections, points à retenir |
| Motifs de perte | `mandat_ailleurs`, `vente_particuliers`, `abandon`, `achat_confrere`, `autre` |
| Fonction `sortir_projet_vendeur(...)` | « À recontacter » (état, date et tâche de relance) ou « Perdu » (motif, fin du mandat concurrent et relance éventuelle), en une seule opération. Refuse un projet qui n'est pas actif |

**Critères de sortie** (`src/features/projets/pipeline-vendeur.ts`, testé ; la base vérifie les mêmes par des contraintes) : quitter « Premier contact » demande la source du contact (enregistrée sur sa fiche) ; quitter « Découverte » demande le motif et l'échéance ; quitter « Estimation » demande la fourchette et la date de remise de l'avis de valeur ; arriver à « Mandat signé » demande son type et sa date. Sauter des étapes demande tout ce qui manque ; revenir en arrière ne demande rien. Le « projet » de la découverte, c'est le bien à vendre, toujours connu.

**Sorties**, possibles à toute étape d'un projet actif, sans suppression : « À recontacter » crée une tâche de relance à la date choisie (raccourcis 1, 3, 6 mois, 1 an) ; « Perdu » enregistre le motif et, si le vendeur a signé ailleurs et que la fin de ce mandat est connue, crée une relance **15 jours avant** (jamais avant aujourd'hui ; `JOURS_AVANT_FIN_MANDAT`). Les tâches créées sont liées au contact, au bien et au projet. Un projet sorti se remet dans le pipeline à l'étape où il était (« Remettre dans le pipeline ») ; l'archivage est réservé aux projets saisis par erreur.

**Mandat signé.** Arriver à cette étape gagne le projet et fait passer le bien « En mandat » s'il était repéré, en veille ou en estimation.

**Tableau.** Les projets actifs (200 au plus) et les mandats signés depuis moins de 30 jours ; dans une colonne, les plus anciens dans l'étape d'abord. Un projet est signalé au-delà de 30 jours dans la même étape. La prochaine action d'une carte est la plus proche tâche à faire liée au projet ; à défaut, celle du contact.

**Liens.** Tâches et activités ont une colonne `projet_vendeur_id`. La clôture d'une tâche récurrente et la boucle de relance la recopient sur l'occurrence suivante, l'activité consignée et la prochaine action. Supprimer définitivement un contact supprime ses projets ; une tâche ou une activité liée au projet mais pas au contact reste, son lien vers le projet est vidé. La fusion transfère les projets à la fiche gardée.

Code : `src/features/projets/` (règles, saisie, lecture, écrans du pipeline) ; fiche du projet `src/pages/FicheProjetVendeur.tsx`, adresse `#/pipelines/vendeurs/<id>`.

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

**Date du dernier contact.** La plus récente parmi : la date de collecte, la date de l'accord ou du refus, la date d'opposition, les appels sans accord et les activités du journal liées au contact (sauf les notes, et sauf les activités retirées). L'application ne l'envoie jamais. Toute autre table qui enregistrerait un échange avec un contact doit être ajoutée au calcul, dans la fonction `contacts_maj_dernier_contact`, et déclencher le recalcul comme le font `appels_sans_accord` et `activites`.

**Export (droit d'accès).** `src/features/contacts/export-contact.ts` fabrique un fichier texte avec toutes les colonnes de la fiche, les appels sans accord, les biens, les projets de vente, les tâches, le journal d'activité et les anciennes fiches fusionnées. Un test échoue si une colonne de `contacts` n'y figure pas. Toute nouvelle table liée aux contacts doit être ajoutée à `rassemblerDonneesContact` et au fichier.

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

L'ajout dans la base passe par une seule fonction, `insererDonneesFictives`, qui **refuse d'agir ailleurs que sur le projet de test**. La carte « Données fictives » de la page Réglages n'apparaît que sur le projet de test. Son bouton ajoute 12 contacts fictifs (personnes et sociétés, tous étiquetés « fictif », avec des situations de consentement variées : accord inconnu, accord prouvé, refus, client existant, opposition), 6 biens, 6 tâches datées à partir du jour même (une par vue, un rendez-vous avec heure et lieu, une tâche mensuelle, un créneau de prospection hebdomadaire), 4 projets vendeurs (un à chacune des quatre premières étapes, deux du même vendeur, trois avec une relance liée) et 8 activités du journal, du jour même à trois semaines en arrière (appels aux résultats variés, SMS, courriel, une visite et une estimation liées à un contact et à un bien, du porte-à-porte sans fiche, une note sur un bien) ; chaque appui en ajoute autant. Chaque étape qui crée une table ajoute son lot à la liste `JEUX_FICTIFS`.

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
| `nb_regles` | 3 ou plus (4 pour `contacts` et `biens_photos`, qui ont une règle de suppression) |
| `vues_sans_session` | `refus` (ou `0`) |
| `vues_par_un_autre_compte` | `0` |
| `verdict` | `OK` |

Le test se met tour à tour à la place d'un visiteur sans session, puis d'un compte connecté qui n'est pas le vôtre, et compte ce que chacun parvient à lire. Il ne modifie rien et n'affiche le contenu d'aucune fiche. Si une table est vide, le verdict le précise : refaire le test après y avoir enregistré une ligne, sinon « aucune ligne visible » ne prouve rien.

Les espaces de stockage passent la même épreuve : leurs lignes s'appellent « stockage : photos-biens ». Le test y vérifie en plus que l'espace est bien privé.

Tout verdict commençant par `ÉCHEC` est une faille : ne plus rien enregistrer dans la table concernée tant qu'une migration ne l'a pas corrigée.

### Dans l'application (contrôle rapide)

**Plus → Réglages → Sécurité → « Vérifier l'accès sans connexion »**. L'application interroge chaque table sans votre session, avec la seule clé publique, exactement comme le ferait un inconnu depuis Internet. Réponse attendue : « Sans connexion, aucune ligne n'est visible ».

Ce contrôle confirme le premier point seulement (le visiteur sans session), et ne porte que sur les tables, pas sur les fichiers ; le test dans Supabase reste la référence.
