# ImmoCRM — Plan de développement

Ce plan découpe la construction d'ImmoCRM en 53 étapes, de la fondation technique à la version 4 : les 45 étapes d'origine, plus 8 étapes d'interface (phase D) ajoutées le 21 novembre 2026, à faire entre la version 1 et la version 2. Il s'appuie sur le [document de cadrage](cadrage.md), qui reste la référence fonctionnelle.

## Mode d'emploi

1. Ouvrez une nouvelle session Claude Code sur le dépôt.
2. Copiez le prompt de l'étape en cours, tel quel.
3. À la fin, Claude Code ouvre une pull request. Faites les vérifications de la rubrique « À tester », puis fusionnez-la dans `main`.
4. Passez à l'étape suivante dans une **nouvelle session** : chaque prompt est autonome.

Règles valables pour toutes les étapes :

- **Une étape = une session = une pull request.** Ne lancez pas l'étape suivante tant que la précédente n'est pas fusionnée et vérifiée.
- **Les migrations de base de données sont appliquées par Claude Code**, via le connecteur Supabase. Quand une étape crée un fichier dans `supabase/migrations/`, il l'applique lui-même sur le projet de test. Sur le projet réel, il ne l'applique qu'une fois l'étape validée et après votre accord explicite, à redonner à chaque fois. Si le connecteur n'est pas disponible, copiez le contenu du fichier dans l'éditeur SQL de Supabase.
- **Si un test échoue**, restez dans la même session et décrivez ce que vous observez. Ne passez pas à la suite.
- **Le dépôt est public** : jamais de donnée réelle de client ni de clé d'administration Supabase dans le code, les captures d'écran ou les prompts.

Les étapes marquées « À faire par vous » demandent une action manuelle dans GitHub ou Supabase avant ou après le prompt.

## Choix techniques retenus

Ces choix découlent de l'architecture du cadrage (site statique sur GitHub Pages, données dans Supabase). Ils sont fixés à l'étape 0.1 et consignés dans `CLAUDE.md`.

| Brique | Choix | Raison |
| --- | --- | --- |
| Application | React, TypeScript, Vite | Standard, bien maîtrisé par Claude Code, produit un site statique |
| Interface | Tailwind CSS, composants maison simples | Adaptation téléphone, tablette, ordinateur sans dépendance lourde |
| Navigation | Routage par ancre (`#/contacts`) | Fonctionne sur GitHub Pages sans configuration serveur |
| Données | Supabase (`supabase-js`), règles d'accès par ligne sur chaque table | Sécurité portée par la base, imposée par le cadrage |
| Environnements | Deux projets Supabase : test (données fictives) et réel | Permet de tester sans toucher aux vraies fiches |
| Tests | Vitest pour la logique, liste de vérifications manuelles pour l'interface | Proportionné à un outil personnel |
| Déploiement | GitHub Actions vers GitHub Pages à chaque fusion dans `main` | Automatique, gratuit |

## Vue d'ensemble

| Phase | Objectif | Étapes |
| --- | --- | --- |
| Phase 0 — Fondations | Un site vide, déployé, connecté, sécurisé | 0.1 à 0.5 |
| Version 1 — Le quotidien | Ne plus rien oublier | 1.1 à 1.14 |
| Interface — version 3 | Voir l'essentiel sans chercher, agir en un geste | D.1 à D.8 (D.0 déjà faite) |
| Version 2 — Les dossiers | Sécuriser mandats et ventes | 2.1 à 2.11 |
| Version 3 — Le pilotage | Décider avec des chiffres | 3.1 à 3.8 |
| Version 4 — Le confort | Gagner du temps | 4.1 à 4.7 |

---

# Phase 0 — Fondations

## Étape 0.1 — Socle du projet

**À faire par vous avant** : dans GitHub, créez la branche `main` à partir de la branche actuelle et définissez-la comme branche par défaut (Settings → Branches).

```text
Tu démarres le projet ImmoCRM. Lis docs/cadrage.md et docs/plan-developpement.md en entier avant de commencer.

ÉTAPE EN COURS — 0.1 Socle du projet
Mets en place le squelette technique, sans aucune fonction métier :
- Projet Vite + React + TypeScript + Tailwind CSS, routage par ancre (HashRouter), interface en français.
- Structure de dossiers claire : src/pages, src/components, src/lib, src/features/<domaine>, supabase/migrations, docs.
- ESLint, Prettier, Vitest avec un premier test d'exemple. Scripts npm : dev, build, test, lint.
- Une page d'accueil provisoire affichant « ImmoCRM » et le numéro de version.
- Un fichier CLAUDE.md qui consigne : les choix techniques du plan, les conventions de code, les trois règles du dépôt public (aucune donnée réelle, aucune clé d'administration, données fictives pour les tests), et la « procédure de fin d'étape » : lancer lint, tests et build ; mettre à jour docs/avancement.md ; commit ; push ; ouvrir une pull request vers main ; terminer par la liste des vérifications que je dois faire moi-même.
- Un fichier docs/avancement.md : tableau de toutes les étapes du plan avec leur état (à faire, en cours, terminée), la date et une ligne de notes. Marque 0.1 comme terminée.
- Un .gitignore adapté (node_modules, dist, fichiers .env).

À TESTER
- npm run lint, npm run test et npm run build passent sans erreur.
- npm run dev affiche la page d'accueil.
- CLAUDE.md et docs/avancement.md existent et sont lisibles par un non-développeur.

ÉTAPE SUIVANTE
0.2 : déploiement automatique sur GitHub Pages.

Applique la procédure de fin d'étape.
```

## Étape 0.2 — Déploiement sur GitHub Pages

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 0.2 Déploiement sur GitHub Pages
- Ajoute un workflow GitHub Actions qui, à chaque fusion dans main, lance lint, tests et build, puis publie le site sur GitHub Pages.
- Configure le chemin de base de Vite pour que le site fonctionne sous l'adresse du dépôt (https://<compte>.github.io/ImmoCRM/), et prévois une variable pour changer ce chemin le jour où le site ira chez un hébergeur web.
- Ajoute un second workflow qui lance lint, tests et build sur chaque pull request, sans publier.
- Documente dans README.md comment le site est publié et comment le migrer vers un autre hébergeur.
- Indique-moi précisément les réglages à faire dans GitHub (Settings → Pages → Source : GitHub Actions).

À TESTER
- Après fusion dans main, l'onglet Actions montre un déploiement réussi.
- L'adresse GitHub Pages affiche la page d'accueil, sur téléphone et sur ordinateur.
- Recharger la page sur une adresse interne (#/...) ne provoque pas d'erreur 404.

ÉTAPE SUIVANTE
0.3 : connexion à Supabase et écran de connexion.

Applique la procédure de fin d'étape.
```

## Étape 0.3 — Supabase et connexion

**À faire par vous avant** : créez deux projets Supabase dans une région européenne, `immocrm-test` et `immocrm`. Dans chacun, désactivez les inscriptions (Authentication → Sign In / Providers → désactiver « Allow new users to sign up ») et créez votre utilisateur à la main (Authentication → Users). Notez pour chaque projet l'URL et la clé publique (`anon` ou `publishable`). Ne notez nulle part la clé `service_role`.

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 0.3 Supabase et connexion
J'ai créé deux projets Supabase (test et réel), inscriptions fermées, avec mon utilisateur. Je te donnerai l'URL et la clé publique de chacun quand tu me les demanderas. Ne me demande jamais la clé service_role.
- Installe supabase-js et crée src/lib/supabase.ts. La configuration (URL, clé publique) vient de variables d'environnement Vite : .env.local pour le développement (projet de test), variables du dépôt GitHub pour la publication (projet réel). Fournis un .env.example sans valeur.
- Crée l'écran de connexion (courriel + mot de passe), la déconnexion, la persistance de session et la protection de toutes les pages : sans session, on ne voit que l'écran de connexion. Aucun écran d'inscription.
- Ajoute « mot de passe oublié » via le courriel de Supabase.
- Explique-moi où saisir les variables dans GitHub (Settings → Secrets and variables → Actions) et quelles adresses de redirection déclarer dans Supabase.
- Ajoute dans CLAUDE.md la règle : seule la clé publique est utilisée dans le code ; la sécurité repose sur les règles d'accès par ligne.

À TESTER
- Sans connexion, toute adresse renvoie à l'écran de connexion.
- Connexion avec mon compte : j'arrive sur l'accueil. Mauvais mot de passe : message d'erreur clair en français.
- La session survit à un rechargement de page ; la déconnexion fonctionne.
- Aucune clé n'apparaît dans les fichiers suivis par git (vérifie avec une recherche).

ÉTAPE SUIVANTE
0.4 : coquille de l'application et navigation adaptée aux trois écrans.

Applique la procédure de fin d'étape.
```

## Étape 0.4 — Coquille de l'application

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 0.4 Coquille de l'application
Le cadrage impose « mobile d'abord » et trois tailles d'écran (téléphone, tablette, ordinateur).
- Crée la mise en page générale : barre de navigation en bas sur téléphone, barre latérale sur tablette et ordinateur. Entrées : Aujourd'hui (accueil), Contacts, Biens, Pipelines, Tâches, Plus (réglages, déconnexion). Chaque entrée mène à une page vide avec son titre.
- Définis un petit système de design réutilisable : couleurs, typographie, boutons, champs de formulaire, cartes, listes, fenêtres modales (plein écran sur téléphone), messages de confirmation et d'erreur, états vide et chargement. Zones tactiles d'au moins 44 px, utilisable d'une main.
- Thème clair et sombre selon le réglage de l'appareil.
- Rends l'application installable sur l'écran d'accueil (manifeste web, icônes, couleur de thème). Pas de mode hors réseau : affiche simplement un bandeau « Connexion perdue » quand le réseau manque.
- Ajoute une page docs/design.md décrivant les composants disponibles, pour que les étapes suivantes les réutilisent.

À TESTER
- Sur téléphone : navigation en bas, chaque page s'ouvre, tout est atteignable au pouce.
- Sur tablette et ordinateur : barre latérale, contenu bien réparti.
- « Ajouter à l'écran d'accueil » installe l'application avec son icône.
- Couper le réseau fait apparaître le bandeau.

ÉTAPE SUIVANTE
0.5 : conventions de base de données, sécurité et données fictives.

Applique la procédure de fin d'étape.
```

## Étape 0.5 — Conventions de données et sécurité

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 0.5 Conventions de données et sécurité
Prépare le cadre dans lequel toutes les tables seront créées.
- Définis dans docs/donnees.md les conventions : fichiers SQL numérotés dans supabase/migrations/, que tu appliques via le connecteur Supabase (projet de test directement, projet réel seulement avec mon accord) ; chaque table a id (uuid), user_id (propriétaire, par défaut l'utilisateur connecté), created_at, updated_at ; règles d'accès par ligne activées sur chaque table, n'autorisant que le propriétaire ; suppression logique (archived_at) plutôt que suppression définitive, sauf demande RGPD.
- Écris la première migration : fonctions utilitaires (mise à jour automatique de updated_at) et une table « reglages » (une ligne par utilisateur) avec ses règles d'accès.
- Crée une couche d'accès aux données dans src/lib (lecture, création, modification, archivage, gestion d'erreur en français) que tous les domaines réutiliseront, avec génération des types TypeScript à partir du schéma.
- Crée un script de données fictives (noms, adresses et téléphones inventés, clairement faux) activable uniquement sur le projet de test, et une page « Plus → Réglages » qui affiche sur quel projet l'application est connectée (TEST bien visible, ou réel).
- Écris un test de sécurité documenté : comment vérifier dans Supabase qu'une requête sans session ne renvoie aucune ligne.

À TESTER
- La migration est appliquée sur le projet de test sans erreur.
- La page Réglages lit et enregistre un réglage, et indique clairement TEST.
- Le test de sécurité confirme qu'une requête anonyme ne voit rien.

ÉTAPE SUIVANTE
1.1 : la fiche Contact, premier objet métier de la version 1.

Applique la procédure de fin d'étape.
```

---

# Version 1 — Le quotidien

Objectif du cadrage : ne plus rien oublier. Critère de réussite : le CRM est ouvert chaque matin pendant trois semaines de suite.

## Étape 1.1 — Contacts : fiche et liste

```text
Lis CLAUDE.md, docs/cadrage.md, docs/donnees.md, docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.1 Contacts : fiche et liste
Le Contact est une personne ou une société. Règle centrale du cadrage : une personne et son projet sont deux choses distinctes ; la fiche Contact ne porte donc aucune étape de pipeline.
- Migration : table contacts (type personne ou société, civilité, prénom, nom, raison sociale, téléphones, courriels, adresse, notes), rôles multiples (vendeur, acquéreur, notaire, prescripteur, autre), étiquettes libres, source (pige, porte-à-porte, boitage, recommandation, demande entrante, réseaux sociaux et site, sphère personnelle), détail de la source, contact qui a recommandé, température (chaud, tiède, froid, veille).
- Page Contacts : liste triée par nom, création, modification, archivage. Formulaire de création court (nom + téléphone suffisent), le reste se complète ensuite.
- Fiche Contact : coordonnées en tête, boutons Appeler, SMS, Courriel (liens tel:, sms:, mailto:), puis des emplacements vides pour Projets, Biens, Tâches et Journal qui seront remplis aux étapes suivantes.
- Tests unitaires sur la validation et le formatage des téléphones français.

À TESTER
- Créer un contact avec seulement un nom et un téléphone prend moins de 15 secondes sur téléphone.
- Modifier, ajouter deux rôles et trois étiquettes, archiver.
- Les boutons Appeler, SMS et Courriel ouvrent la bonne application sur téléphone.
- La fiche est lisible sur les trois tailles d'écran.

ÉTAPE SUIVANTE
1.2 : recherche instantanée, filtres et détection des doublons.

Applique la procédure de fin d'étape.
```

## Étape 1.2 — Contacts : recherche, filtres, doublons

```text
Lis CLAUDE.md, docs/cadrage.md, docs/donnees.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.2 Contacts : recherche, filtres, doublons
Le cadrage exige de retrouver n'importe qui en 5 secondes, et que recherche et listes restent rapides avec plusieurs dizaines de milliers de fiches.
- Recherche instantanée côté base (index adaptés, insensible aux accents et à la casse) sur nom, prénom, société, téléphone (quel que soit le format saisi), courriel, adresse.
- Champ de recherche global accessible depuis toutes les pages.
- Liste paginée ou à défilement progressif : jamais de chargement de toute la table.
- Filtres combinables : rôle, étiquette, source, température. Filtres mémorisés pendant la session.
- Détection des doublons à la création (même téléphone, même courriel, ou nom très proche) avec proposition d'ouvrir la fiche existante ; écran de fusion de deux fiches.
- Sur le projet de test uniquement, génère 30 000 contacts fictifs pour mesurer les temps de réponse et note les résultats dans docs/avancement.md.

À TESTER
- Avec 30 000 contacts fictifs, une recherche répond en moins d'une seconde.
- Chercher « 0612 » , « 06 12 » ou « +33612 » trouve le même contact.
- Créer un contact avec un téléphone déjà connu déclenche l'alerte de doublon.
- Fusionner deux fiches conserve toutes les informations.

ÉTAPE SUIVANTE
1.3 : consentement et informations RGPD sur la fiche Contact.

Applique la procédure de fin d'étape.
```

## Étape 1.3 — Contacts : consentement et RGPD

```text
Lis CLAUDE.md, docs/cadrage.md (section Conformité) et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.3 Contacts : consentement et RGPD
Le cadrage veut une conformité intégrée, pas ajoutée. Rappelle dans ton compte rendu que les règles juridiques du cadrage sont à faire valider par un juriste.
- Migration : sur chaque contact, origine et date de collecte des données ; accord pour être appelé (oui, non, inconnu) avec date et preuve (texte libre : comment l'accord a été obtenu) ; indicateur « client existant » ; opposition au démarchage.
- Blocage visuel : sans accord, le bouton Appeler est remplacé par un avertissement explicite, avec possibilité de passer outre en indiquant le motif (client existant, appel entrant, etc.). Le motif est enregistré.
- Export d'un contact : un fichier lisible contenant toutes ses données (droit d'accès).
- Suppression définitive d'un contact et de tout ce qui lui est lié (droit à l'effacement), avec double confirmation.
- Date du dernier contact calculée, qui servira plus tard à la purge des fiches inactives.

À TESTER
- Un contact sans accord affiche l'avertissement à la place de l'appel direct.
- Enregistrer un accord avec date et preuve rétablit le bouton.
- L'export produit un fichier complet ; la suppression définitive ne laisse aucune trace en base.

ÉTAPE SUIVANTE
1.4 : la fiche Bien, tous types de biens.

Applique la procédure de fin d'étape.
```

## Étape 1.4 — Biens : fiche et liste

```text
Lis CLAUDE.md, docs/cadrage.md, docs/donnees.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.4 Biens : fiche et liste
Un Bien est un logement, un local ou un terrain, qu'il soit en mandat, en veille ou simplement repéré. Activité couverte : toutes les transactions, ni location ni gestion.
- Migration : table biens (adresse structurée, complément, étage, type, surface, pièces, chambres, année, état, description, prix affiché, statut : repéré, en veille, en estimation, en mandat, sous offre, vendu, retiré), DPE et GES (classe, valeur, date), champs propres au type :
  - ancien : copropriété, charges, taxe foncière ;
  - neuf : programme, lot, date de livraison ;
  - viager : bouquet, rente, occupé ou libre, âge des crédirentiers ;
  - commerce et local : murs ou fonds, bail, loyer, activité ;
  - terrain : surface de terrain, constructible, viabilisé.
- Table de liaison biens–contacts pour les propriétaires (plusieurs possibles, avec quote-part facultative).
- Historique de prix : chaque changement de prix est daté et conservé.
- Page Biens : liste avec recherche par adresse et filtres (type, statut, fourchette de prix), création rapide (adresse + type), fiche détaillée dont le formulaire n'affiche que les champs du type choisi.
- Sur la fiche Contact, la section Biens liste les biens dont il est propriétaire ; sur la fiche Bien, les propriétaires sont cliquables.

À TESTER
- Créer un bien de chaque type : seuls les champs pertinents apparaissent.
- Lier deux propriétaires à un bien, les retrouver depuis leurs fiches.
- Changer le prix deux fois : l'historique montre les trois valeurs datées.
- Rechercher un bien par un morceau d'adresse.

ÉTAPE SUIVANTE
1.5 : photos des biens.

Applique la procédure de fin d'étape.
```

## Étape 1.5 — Biens : photos

```text
Lis CLAUDE.md, docs/cadrage.md (section Architecture technique) et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.5 Biens : photos
L'offre gratuite de Supabase limite le stockage : les photos doivent être compressées et limitées.
- Crée un espace de stockage privé pour les photos, avec des règles d'accès réservées au propriétaire, et la migration correspondante.
- Sur la fiche Bien : ajout de photos depuis l'appareil photo ou la galerie, compression et redimensionnement dans le navigateur avant envoi (cible : moins de 300 Ko par photo), plafond de 20 photos par bien, choix de la photo principale, réordonnancement, suppression.
- Affichage par adresses signées temporaires, vignette de la photo principale dans la liste des biens.
- Dans Réglages, un indicateur de l'espace de stockage utilisé.

À TESTER
- Prendre une photo depuis le téléphone et la voir apparaître en quelques secondes.
- Une photo de plusieurs Mo est bien ramenée sous 300 Ko.
- Une adresse d'image ouverte dans une fenêtre privée, sans session, ne donne pas accès à la photo une fois le lien expiré.

ÉTAPE SUIVANTE
1.6 : les tâches et rendez-vous.

Applique la procédure de fin d'étape.
```

## Étape 1.6 — Tâches et rendez-vous

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM » et « La journée type ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.6 Tâches et rendez-vous
Une Tâche est toute action à venir, avec une date et un motif. Trois règles du cadrage : toute tâche a une date et presque toujours un contact ou un bien ; les tâches récurrentes se régénèrent ; le temps de prospection se bloque comme un rendez-vous.
- Migration : table taches (titre, motif, catégorie : relance, rendez-vous, visite, estimation, administratif, prospection, autre ; date d'échéance ; heure et durée facultatives ; lieu ; priorité ; état : à faire, faite, annulée ; liens facultatifs vers un contact, un bien et, plus tard, un projet ; règle de récurrence).
- Un rendez-vous est une tâche avec une heure : pas d'objet séparé.
- Page Tâches : vues En retard, Aujourd'hui, Cette semaine, Plus tard ; création rapide ; cocher, reporter (demain, dans 3 jours, dans une semaine, date libre), modifier, annuler.
- Récurrences : tous les jours, toutes les semaines, toutes les deux semaines, tous les mois, tous les ans. Clôturer une occurrence crée la suivante.
- Sections Tâches sur les fiches Contact et Bien, avec création déjà liée.
- Tests unitaires sur le calcul des reports et des récurrences (fins de mois, changements d'heure).

À TESTER
- Créer une tâche liée à un contact depuis sa fiche en moins de 10 secondes.
- Reporter une tâche en un geste ; la retrouver dans la bonne vue.
- Une tâche mensuelle clôturée le 31 janvier se recrée fin février.
- Un rendez-vous avec heure et lieu s'affiche correctement.

ÉTAPE SUIVANTE
1.7 : le journal d'activité.

Applique la procédure de fin d'étape.
```

## Étape 1.7 — Journal d'activité

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.7 Journal d'activité
Une Activité est tout événement passé : appel, message, visite, note, document envoyé. Activité (passé) et Tâche (futur) sont volontairement séparées.
- Migration : table activites (type : appel, SMS, courriel, rendez-vous, visite, estimation, porte-à-porte, note, document envoyé, autre ; date et heure ; durée facultative ; résultat pour un appel : joint, messagerie, pas de réponse, rappeler ; texte du compte rendu ; liens vers un contact, un bien et, plus tard, un projet).
- Fil chronologique sur les fiches Contact et Bien, du plus récent au plus ancien, avec filtres par type.
- Ajout d'une activité depuis la fiche en deux gestes : choisir le type, saisir ou dicter le texte.
- La date du dernier contact (étape 1.3) se met à jour automatiquement.
- Page « Journal » globale : toutes les activités, filtrables par période et par type.

À TESTER
- Consigner un appel sur une fiche Contact ; il apparaît en tête du fil.
- Une visite liée à un contact et à un bien apparaît sur les deux fiches.
- La date du dernier contact suit la dernière activité.

ÉTAPE SUIVANTE
1.8 : la boucle de relance, qui relie tâches et activités.

Applique la procédure de fin d'étape.
```

## Étape 1.8 — Boucle de relance

```text
Lis CLAUDE.md, docs/cadrage.md (sections « En bref », « Suivi de prospection » et « Automatisations ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.8 Boucle de relance
C'est le cœur du CRM. Deux règles : clôturer une tâche crée une activité et propose aussitôt la tâche suivante ; aucun contact sans prochaine action datée.
- Quand je coche une tâche liée à un contact, ouvre un écran unique en trois temps : résultat (pour une relance : joint, messagerie, pas de réponse), compte rendu court (saisi ou dicté), prochaine action préremplie. L'ensemble doit prendre moins de 30 secondes.
- La date proposée pour la prochaine relance suit la température du contact : chaud = 1 semaine, tiède = 1 mois, froid = 3 mois, veille = 6 mois. Les délais sont modifiables dans Réglages et au cas par cas.
- Je peux refuser la prochaine action, mais je dois alors le confirmer explicitement ; le contact est marqué « sans prochaine action ».
- Sur chaque fiche Contact, affiche en tête la prochaine action et sa date, ou un avertissement s'il n'y en a pas.
- Vue « Contacts sans prochaine action » dans la page Contacts.
- Tests unitaires sur le calcul des dates de relance.

À TESTER
- Cocher une relance sur un contact tiède propose une nouvelle relance à un mois.
- Le compte rendu saisi se retrouve dans le journal du contact.
- Refuser la prochaine action fait apparaître le contact dans la vue « sans prochaine action ».
- Chronométrez la séquence complète sur téléphone : moins de 30 secondes.

ÉTAPE SUIVANTE
1.9 : les projets vendeurs et leur pipeline.

Applique la procédure de fin d'étape.
```

## Étape 1.9 — Projets vendeurs et pipeline vendeur

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM » et « Les pipelines ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.9 Projets vendeurs et pipeline vendeur
Un Projet vendeur est l'intention de vendre un bien donné. Étapes et critères de sortie : Premier contact (source identifiée) → Découverte (projet, délai, motif) → Estimation (avis de valeur remis) → Suivi (relances, objections) → Mandat signé (simple ou exclusif).
- Migration : table projets_vendeurs (contact principal, bien, étape, date d'entrée dans l'étape, motif de vente, échéance souhaitée, prix espéré par le vendeur, estimation basse et haute, date de l'estimation, date de remise de l'avis de valeur, concurrence : autres agences consultées, mandat ailleurs et sa date de fin ; état : actif, à recontacter avec date, perdu avec motif, gagné).
- Motifs de perte : mandat signé ailleurs, vente entre particuliers, projet abandonné, achat par un confrère, autre.
- Sorties possibles à toute étape, sans suppression : « À recontacter » crée une tâche de relance à la date choisie ; « Perdu » enregistre le motif ; si un mandat concurrent a une date de fin, crée une tâche de relance peu avant.
- Le passage d'étape vérifie le critère de sortie et demande l'information manquante.
- Page Pipelines, onglet Vendeurs : colonnes par étape sur tablette et ordinateur (glisser-déposer), liste groupée par étape sur téléphone ; chaque carte montre contact, bien, ancienneté dans l'étape et prochaine action.
- Les tâches et activités peuvent désormais être liées à un projet. La fiche Contact et la fiche Bien affichent leurs projets vendeurs.
- L'étape « Mandat signé » enregistre pour l'instant seulement le type (simple, exclusif) et la date ; le détail du mandat viendra en version 2.

À TESTER
- Créer un projet vendeur depuis une fiche Contact, avec création du bien à la volée.
- Passer de Découverte à Estimation sans motif ni délai : le CRM les demande.
- Marquer « À recontacter dans 6 mois » : la tâche est créée, le projet sort du pipeline.
- Marquer « Perdu, mandat signé ailleurs jusqu'à telle date » : une relance est planifiée.
- Un même contact peut avoir deux projets vendeurs sur deux biens.

ÉTAPE SUIVANTE
1.10 : les projets acquéreurs et leur pipeline.

Applique la procédure de fin d'étape.
```

## Étape 1.10 — Projets acquéreurs et pipeline acquéreur

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM » et « Les pipelines ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.10 Projets acquéreurs et pipeline acquéreur
Un Projet acquéreur est une recherche. Étapes et critères de sortie : Demande (appel ou portail) → Qualification (budget, critères) → Sélection (biens proposés) → Visites (comptes rendus).
- Migration : table projets_acquereurs (contact principal, co-acquéreur facultatif, étape, types de biens recherchés, secteurs ou communes, budget minimum et maximum, surface et pièces minimum, critères indispensables et souhaités, urgence, financement : comptant, prêt, accord de principe obtenu ou non, apport, bien à vendre avant d'acheter ; origine de la demande : portail et bien concerné ; état : actif, à recontacter, perdu avec motif, gagné).
- Table des biens proposés à un acquéreur (bien, date, réaction : intéressé, à visiter, refusé avec raison).
- Visites : une visite est une activité de type visite liée au projet acquéreur, au bien et au contact, avec un compte rendu structuré (points positifs, points négatifs, niveau d'intérêt, suite envisagée). Planifier une visite crée un rendez-vous ; le clôturer ouvre le compte rendu.
- Si un bien a un vendeur qui est aussi acquéreur (une fiche, plusieurs projets), les deux projets apparaissent sur sa fiche.
- Page Pipelines, onglet Acquéreurs, sur le même modèle que l'onglet Vendeurs. Mêmes sorties « À recontacter » et « Perdu ».
- Une demande entrante se saisit en un écran : contact (nouveau ou existant), bien concerné, portail d'origine, heure de réception.

À TESTER
- Saisir une demande entrante complète en moins d'une minute.
- Passer en Qualification sans budget : le CRM le demande.
- Proposer trois biens, planifier une visite, la clôturer avec son compte rendu.
- Le compte rendu de visite apparaît sur la fiche du bien, du contact et du projet.

ÉTAPE SUIVANTE
1.11 : l'écran Aujourd'hui.

Applique la procédure de fin d'étape.
```

## Étape 1.11 — Écran « Aujourd'hui »

```text
Lis CLAUDE.md, docs/cadrage.md (section « La journée type et l'écran Aujourd'hui ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.11 Écran « Aujourd'hui »
C'est la page d'accueil, ouverte dix fois par jour. Elle répond à : qui dois-je contacter aujourd'hui, et pourquoi ? Elle présente la journée dans l'ordre où elle se vit, et rien d'autre.
Construis les cinq blocs du cadrage :
1. Agenda du jour : rendez-vous, visites, estimations, par heure, avec adresse. Gestes : ouvrir la fiche, lancer l'itinéraire (lien vers l'application de cartes), appeler.
2. À relancer : contacts dont la prochaine action tombe aujourd'hui ou est en retard, les plus anciens d'abord, avec le motif et la dernière activité en une ligne. Gestes : appeler, puis consigner le résultat (boucle de l'étape 1.8).
3. Tâches : actions hors relance. Gestes : cocher, reporter.
4. Alertes : pour l'instant, contacts actifs sans prochaine action et projets sans activité depuis 15 jours. Le bloc est conçu pour accueillir les alertes de mandat et de transaction en version 2.
5. Nouveautés : demandes entrantes non encore qualifiées, avec le temps écoulé depuis leur réception.
- Chaque bloc affiche un compteur et se replie. Un bloc vide affiche un message positif.
- En tête : la date et un choix libre de « trois actions qui comptent » pour la journée, mémorisé.
- Toutes les requêtes sont limitées et rapides : l'écran doit s'afficher en moins de deux secondes.

À TESTER
- Avec des données fictives variées, chaque bloc contient ce qu'il doit, dans le bon ordre.
- Traiter une relance depuis l'écran la fait disparaître et crée la suivante.
- Le bouton d'itinéraire ouvre l'application de cartes sur l'adresse du rendez-vous.
- L'écran est confortable sur téléphone, sans défilement horizontal.

ÉTAPE SUIVANTE
1.12 : la saisie rapide, à la voix si possible.

Applique la procédure de fin d'étape.
```

## Étape 1.12 — Saisie rapide

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.12 Saisie rapide
Le besoin transversal du cadrage est la rapidité de saisie : un CRM abandonné l'est parce que le remplir coûte plus que l'oubli qu'il évite. Sans données à importer, la saisie rapide est la seule porte d'entrée.
- Un bouton « + » flottant, présent sur toutes les pages, propose : nouveau contact, nouvelle activité, nouvelle tâche, nouveau bien, nouvelle demande entrante.
- « Nouveau contact express » : nom, téléphone, source, température, première note et prochaine action sur un seul écran.
- « Compte rendu express » : chercher le contact, choisir le type, dicter ou saisir, fixer la prochaine action.
- Dictée : un bouton micro sur tous les champs de texte long, utilisant la reconnaissance vocale du navigateur quand elle existe ; sinon, le champ reste utilisable avec la dictée du clavier. Aucun service payant à cette étape.
- Accès rapide aux fiches consultées récemment.
- Sur ordinateur : raccourcis clavier pour la recherche et la création.
- Mesure et note dans docs/avancement.md le nombre de gestes pour les cinq saisies les plus courantes.

À TESTER
- Créer un contact complet avec sa prochaine action en moins de 30 secondes sur téléphone.
- Dicter un compte rendu de visite sans toucher au clavier.
- Depuis n'importe quelle page, le bouton « + » est atteignable au pouce.

ÉTAPE SUIVANTE
1.13 : sauvegardes et export des données.

Applique la procédure de fin d'étape.
```

## Étape 1.13 — Sauvegardes et export

**À faire par vous** : cette étape vous demandera d'ajouter des secrets dans GitHub (Settings → Secrets and variables → Actions). Ils ne doivent jamais être collés dans la conversation ni dans le code.

```text
Lis CLAUDE.md, docs/cadrage.md (section Architecture technique) et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.13 Sauvegardes et export
L'offre gratuite de Supabase n'a pas de sauvegarde automatique, et un projet gratuit se met en pause sans activité. Le fichier clients est l'actif principal.
- Dans Réglages : un bouton « Exporter toutes mes données » qui télécharge un fichier complet (toutes les tables) dans un format réutilisable, et affiche la date du dernier export.
- Un rappel dans le bloc Alertes de l'écran Aujourd'hui si aucun export n'a été fait depuis 7 jours.
- Un workflow GitHub Actions hebdomadaire qui sauvegarde la base du projet réel. Le dépôt étant public, la sauvegarde doit être chiffrée avec une phrase secrète avant d'être conservée : jamais de fichier en clair dans les artefacts ni dans le dépôt. Utilise uniquement des secrets GitHub, que j'ajouterai moi-même ; explique-moi lesquels et où les trouver, sans me demander de te les donner.
- Le même workflow maintient le projet actif pour éviter la mise en pause.
- Rédige docs/sauvegarde.md : comment vérifier qu'une sauvegarde existe, comment la déchiffrer et la restaurer, pas à pas, pour un non-développeur.
- Vérifie d'abord les limites et le fonctionnement actuels de l'offre gratuite dans la documentation de Supabase, et corrige le cadrage si un chiffre a changé.

À TESTER
- L'export manuel produit un fichier contenant bien mes contacts, biens, projets, tâches et activités fictifs.
- Le workflow lancé à la main réussit et produit un fichier chiffré, illisible sans la phrase secrète.
- En suivant docs/sauvegarde.md, je restaure la sauvegarde sur le projet de test.

ÉTAPE SUIVANTE
1.14 : recette complète de la version 1.

Applique la procédure de fin d'étape.
```

## Étape 1.14 — Recette de la version 1

```text
Lis CLAUDE.md, docs/cadrage.md en entier et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 1.14 Recette de la version 1
Aucune nouvelle fonction : on vérifie et on consolide.
- Relis le cadrage et dresse dans docs/recette-v1.md la liste de tout ce que la V1 devait contenir (contacts, biens de tous types, pipelines vendeur et acquéreur, tâches et relances, journal d'activité, écran Aujourd'hui, saisie rapide, affichage téléphone, tablette et ordinateur), avec pour chaque point : fait, partiel ou manquant. Corrige ce qui est partiel ou manquant.
- Parcours chaque écran aux trois tailles avec le navigateur automatisé et corrige les défauts d'affichage.
- Vérifie la sécurité : chaque table a ses règles d'accès par ligne ; une requête anonyme ne lit ni n'écrit rien ; aucune clé ni donnée réelle dans le dépôt.
- Vérifie les performances avec 30 000 contacts fictifs sur le projet de test : listes, recherche, écran Aujourd'hui.
- Passe en revue les messages d'erreur : tous en français, compréhensibles, sans jargon.
- Rédige docs/guide-utilisateur.md : le rituel du matin, la saisie après chaque échange, la revue du vendredi, en une page.
- Donne-moi un scénario de recette manuel d'une journée type à dérouler sur le projet réel.

À TESTER
- Déroulez le scénario de la journée type, sur téléphone puis sur ordinateur.
- Toutes les migrations sont appliquées sur le projet réel et l'application publiée s'y connecte.
- Utilisez ensuite l'outil au quotidien : le critère du cadrage est trois semaines d'ouverture chaque matin. Notez ce qui vous gêne pour l'étape 2.1.

ÉTAPE SUIVANTE
2.1 : les mandats, début de la version 2.

Applique la procédure de fin d'étape et marque la version 1 comme livrée.
```

---

# Interface — version 3

Le style de la version 3 a été choisi sur maquettes (canevas « ImmoCRM — nouveau style », rangée « Version 3 ») puis installé le 21 novembre 2026 : couleurs claires et sombres, police Inter, arrondis et composants communs. C'est l'étape **D.0**, faite sans prompt (pull request #28).

Les maquettes montraient aussi une nouvelle organisation des écrans et de nouveaux gestes. Les huit étapes qui suivent les construisent **avant la version 2**, parce qu'ils servent chaque jour. Elles ne changent pas le périmètre du cadrage : aucune nouvelle donnée métier, aucune migration attendue. Elles sont décrites dans la section « L'interface » du cadrage, et leurs composants sont annoncés dans `docs/design.md` (« Composants prévus »).

Les maquettes sont dans le canevas cité plus haut : si une session a besoin de les voir, collez-lui le lien du canevas.

## Étape D.1 — Gestes rapides communs

```text
Lis CLAUDE.md, docs/cadrage.md (section « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.1 Gestes rapides communs
Les étapes D.3 à D.7 réutilisent trois gestes. Construis-les une fois, comme composants partagés, et branche-les dès maintenant là où ils servent déjà.
- Reports en un geste : une rangée de boutons « Demain », « Dans 3 jours », « Lundi » (le prochain lundi après aujourd'hui) et un bouton calendrier qui ouvre la fenêtre ReportTache existante pour une autre date. Le report s'enregistre aussitôt, sans fenêtre ; une notification passagère le confirme avec « Annuler », qui rétablit l'ancienne date pendant quelques secondes. Branche-la sur la prochaine action de la fiche Contact (ProchaineAction) et sur les lignes de la page Tâches. Les dates proposées viennent d'une fonction pure testée.
- Copier : un petit bouton « Copier » à côté du téléphone et du courriel (fiche Contact) et de l'adresse (fiches Contact et Bien). Il copie la valeur et affiche « Copié » deux secondes, annoncé aux lecteurs d'écran. Sur ordinateur, il n'apparaît qu'au survol de la ligne ou au clavier ; sur un écran tactile, il est toujours visible. Si le navigateur refuse la copie, un message le dit.
- Ligne glissable, sur écran tactile : une ligne de liste qui, glissée vers la gauche, découvre deux actions, « Reporter » (ambre) et « Fait » (vert), comme dans les maquettes. Le geste se déclenche au-delà d'un seuil et se remet en place sinon ; il ne gêne ni le défilement vertical ni le toucher normal ; il est inactif à la souris. Chaque action garde son bouton visible : le glisser est un raccourci, jamais le seul chemin. Branche-la sur les lignes de la page Tâches ; « Fait » passe par la boucle de relance quand la tâche est liée à un contact (étape 1.8).
- Décris les trois composants dans docs/design.md (et retire-les de « Composants prévus ») et ajoute-les à la page « Composants de l'interface ».
- Teste la logique (dates proposées, seuil du glisser) avec Vitest.

À TESTER
- Sur la fiche d'un contact, reporter sa prochaine action à « Dans 3 jours » en un toucher, puis « Annuler » : la date d'origine revient.
- Copier un numéro de téléphone, puis le coller dans une autre application.
- Sur téléphone, page Tâches : glisser une tâche vers la gauche découvre Reporter et Fait ; glisser à moitié puis relâcher la remet en place ; la liste défile toujours normalement.
- Au clavier seul, chaque action reste atteignable.

ÉTAPE SUIVANTE
D.2 : la colonne de navigation enrichie et la pastille des retards.

Applique la procédure de fin d'étape.
```

## Étape D.2 — Navigation : fiches récentes, création et retards

```text
Lis CLAUDE.md, docs/cadrage.md (section « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.2 Navigation : fiches récentes, création et retards
Sur ordinateur, la colonne de gauche a de la place : elle devient le point de départ de tous les gestes.
- Colonne de gauche sur ordinateur (1024 px et plus), de haut en bas :
  - le nom de l'application ;
  - le champ de recherche, qui quitte le bandeau du haut sur ordinateur, avec le rappel « ⌘K » ou « Ctrl K » selon le système (« / » marche toujours) ;
  - les six entrées ;
  - « Consultés récemment » : les trois dernières fiches (src/features/saisie/recents.ts), chacune avec ses initiales ou son dessin ;
  - en bas, un bouton « Créer » avec le rappel « N », qui ouvre le menu de création ; sur ordinateur, le bouton « + » flottant disparaît (il reste sur téléphone et tablette) ;
  - la version, et l'état : « Tout est enregistré », « Enregistrement… » pendant une écriture (compteur tenu par src/lib/donnees.ts), « Connexion perdue » sans réseau.
- Tablette : la colonne étroite garde ses entrées ; la recherche et le « + » restent comme aujourd'hui.
- Pastille des retards : l'entrée Tâches porte le nombre de tâches en retard (rouge, « 9+ » au-delà) sur ordinateur et tablette, un point rouge sur téléphone. Le nombre est annoncé aux lecteurs d'écran (« Tâches, 3 en retard »). Il se relit quand une tâche est cochée ou reportée, et au retour dans l'application. Une seule requête de comptage, légère.
- Mets à jour docs/design.md (Navigation, MiseEnPage) et docs/guide-utilisateur.md.

À TESTER
- Sur ordinateur, ouvrir trois fiches : elles apparaissent sous « Consultés récemment », la plus récente en haut.
- « Créer » et la touche N ouvrent le menu de création ; « / » et ⌘K (ou Ctrl K) placent le curseur dans la recherche.
- Reporter la dernière tâche en retard : la pastille disparaît sans recharger la page.
- Sur téléphone, le point rouge apparaît sur Tâches ; le reste de la barre du bas ne change pas.

ÉTAPE SUIVANTE
D.3 : l'en-tête de l'écran Aujourd'hui et la carte « Maintenant ».

Applique la procédure de fin d'étape.
```

## Étape D.3 — Aujourd'hui : en-tête, carte « Maintenant » et progression

```text
Lis CLAUDE.md, docs/cadrage.md (sections « La journée type et l'écran Aujourd'hui » et « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.3 Aujourd'hui : en-tête, carte « Maintenant » et progression
Le matin, l'écran doit dire en trois secondes à quoi ressemble la journée et ce qui vient ensuite.
- En-tête : la date avec la semaine (« Samedi 21 novembre · semaine 47 »), « Bonjour » suivi du nom affiché (Réglages) s'il existe, et une phrase de résumé : nombre de rendez-vous, de personnes à rappeler, heure de fin du dernier rendez-vous (« 4 rendez-vous et 4 personnes à rappeler. Votre dernier rendez-vous finit vers 18 h 15. »). Zéro et un ont leur propre phrase.
- Progression : un anneau « 3 sur 7 faits » qui compte les tâches et relances prévues aujourd'hui ou en retard, et celles closes aujourd'hui (colonne cloturee_le). Il avance dès qu'on coche. S'il n'y a rien de prévu, il disparaît. Un texte équivalent est lu par les lecteurs d'écran.
- Carte « Maintenant », en tête, sur fond encre (presque noir en clair, gris foncé en sombre) :
  - le rendez-vous en cours ou le prochain de la journée, avec le temps restant (« Dans 25 min », « En cours », « Dans 2 h »), mis à jour chaque minute ;
  - l'heure de début et de fin, le titre, le contact et son rôle, l'adresse ;
  - les gestes Itinéraire (comme l'agenda), Appeler le contact (BoutonAppel, qui respecte l'accord pour être appelé) et l'ouverture de la fiche du bien ou du contact ;
  - « À préparer » : les tâches à faire aujourd'hui liées au même contact ou au même bien, à cocher depuis la carte.
  Après le dernier rendez-vous, la carte montre la première relance du jour ; s'il n'y a plus rien, elle disparaît.
- Agenda du jour : un trait rouge « maintenant », avec l'heure, entre les rendez-vous passés et à venir ; les rendez-vous passés s'estompent légèrement.
- « Les trois actions qui comptent » se rangent à côté de la carte sur ordinateur, dessous sur téléphone.
- Résumé, temps restant, choix du rendez-vous et progression sont des fonctions pures testées. Pas de requête de plus si les données sont déjà lues par l'écran ; sinon une seule, bornée. L'écran reste sous deux secondes.
- Mets à jour docs/design.md et docs/guide-utilisateur.md (rituel du matin).

À TESTER
- Avec des rendez-vous fictifs à différentes heures, la carte montre le bon rendez-vous et son temps restant change à la minute.
- Cocher une tâche fait avancer l'anneau sans recharger.
- Le trait « maintenant » se place entre le bon rendez-vous passé et le suivant.
- En thème sombre, la carte reste lisible et se distingue du fond.
- Sur téléphone, la carte tient sans défilement horizontal et ses boutons font au moins 44 px.

ÉTAPE SUIVANTE
D.4 : les relances plus parlantes et les gestes rapides sur Aujourd'hui.

Applique la procédure de fin d'étape.
```

## Étape D.4 — Aujourd'hui : relances plus parlantes et gestes rapides

```text
Lis CLAUDE.md, docs/cadrage.md (sections « La journée type et l'écran Aujourd'hui » et « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.4 Aujourd'hui : relances plus parlantes et gestes rapides
Le bloc des relances doit dire pourquoi appeler avant même d'ouvrir la fiche, et se traiter sans quitter l'écran.
- Le bloc s'appelle « À rappeler », avec la mention « la plus urgente en premier ». Chaque ligne montre :
  - les initiales, le nom et le rôle (Vendeur, Acquéreur, Prospect…) ;
  - le retard en pastille rouge (« En retard · 2 j ») ;
  - le motif (titre de la tâche) comme texte principal ;
  - dessous, « Dernier échange il y a 8 jours · rendez-vous » (date et type de la dernière activité).
- Un filtre Tous, Vendeurs, Acquéreurs (commande segmentée), d'après les rôles du contact, gardé sur l'appareil. Le compteur du bloc suit le filtre.
- Sur ordinateur, au survol ou au clavier, « Reporter » (reports en un geste, étape D.1) et « Fait » (boucle de relance) apparaissent à côté d'« Appeler ». Sur téléphone, la ligne se glisse (ligne glissable, étape D.1). Les boutons actuels restent accessibles.
- Bloc Tâches : regroupé en « En retard » puis « Aujourd'hui », l'échéance à droite (« Hier », « 17 h 30 ») en chiffres alignés, la ligne glissable sur téléphone.
- L'ordre et les regroupements sont des fonctions pures testées.
- Mets à jour docs/design.md et docs/guide-utilisateur.md.

À TESTER
- Le filtre Acquéreurs ne montre que des acquéreurs, et le compteur suit.
- Reporter une relance en un toucher : elle disparaît, et la notification permet d'annuler.
- Sur téléphone, glisser une relance puis toucher « Fait » ouvre la boucle de relance.
- Avec 20 relances fictives, l'écran reste lisible sur téléphone.

ÉTAPE SUIVANTE
D.5 : la fiche Contact, avec son profil toujours visible et ses onglets.

Applique la procédure de fin d'étape.
```

## Étape D.5 — Fiche Contact : profil toujours visible et onglets

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM » et « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.5 Fiche Contact : profil toujours visible et onglets
La fiche Contact empile aujourd'hui une dizaine de rubriques. Ce qu'on cherche à chaque appel doit rester sous les yeux ; le reste se range en onglets. Aucune information ne disparaît : elle change de place.
- Ordinateur (1024 px et plus), deux colonnes :
  - À gauche, le profil, qui reste visible quand on change d'onglet :
    - les initiales, le nom, les rôles ;
    - la température en commande segmentée Froid, Tiède, Chaud, enregistrée d'un toucher ;
    - quatre touches : Appeler (bleue, BoutonAppel avec l'accord pour être appelé), SMS, Courriel, Itinéraire ;
    - la prochaine action, avec « C'est fait » (boucle de relance) et les reports en un geste ;
    - le téléphone, le courriel et l'adresse, avec Copier ; l'origine ;
    - l'accord pour être appelé en une ligne verte, ou l'avertissement actuel ;
    - « Fiche créée le … · modifiée il y a … », Modifier, et un menu « … » (fusionner, exporter, archiver, supprimer définitivement).
  - À droite, des onglets avec leur compteur : Activité (journal et tâches à venir), Projets (vente et achat), Tâches, Biens. Les rubriques actuelles (consentement détaillé, notes, étiquettes…) y trouvent leur place : décide, et explique dans la pull request où chacune est allée.
- Tablette et téléphone :
  - en-tête compact : initiales, nom, rôles, température, « Dernier échange il y a … » ;
  - la prochaine action et ses reports ;
  - les onglets en commande segmentée : Activité, Projets, Tâches, Infos (coordonnées, origine, consentement, notes).
  Sur téléphone, une barre d'actions fixe en bas remplace la navigation sur cette page : Appeler (large, bleue), SMS, Consigner (le compte rendu express, sur ce contact). On revient par « ‹ Contacts » en haut.
- L'onglet choisi est dans l'adresse (#/contacts/…?onglet=projets) : le retour du navigateur et un lien gardé le respectent. Sur ordinateur, les touches 1 à 4 changent d'onglet, hors des champs.
- Projets : chaque projet montre ses étapes en barre (passées, en cours, à venir), l'ancienneté dans l'étape, et « Pour passer à l'étape suivante : … » (critères des étapes 1.9 et 1.10), avec « Étape suivante » (useChangementEtape, et FenetrePassage si un critère manque).
- Contact précédent ou suivant : sur ordinateur, « 12 sur 48 » et deux flèches en haut de la fiche parcourent la liste Contacts dans l'ordre et avec les filtres où on l'a laissée (touches J et K). Quand on arrive d'ailleurs (recherche, Aujourd'hui), les flèches n'apparaissent pas.
- Rien ne change dans la base : réutilise les sections existantes (SectionTaches, SectionJournal, SectionProjetsVendeurs, SectionProjetsAcquereurs).
- Mets à jour docs/design.md et docs/guide-utilisateur.md.

À TESTER
- Sur ordinateur, changer d'onglet ne fait pas bouger le profil : Appeler, la prochaine action et les coordonnées restent visibles.
- Toutes les informations de l'ancienne fiche se retrouvent (à comparer sur une fiche fictive complète).
- Sur téléphone, la barre du bas propose Appeler, SMS et Consigner à portée de pouce, sans cacher le bas de la page.
- Un contact sans accord pour être appelé n'a pas de bouton Appeler actif, comme avant.
- Depuis la liste filtrée, ouvrir un contact puis « suivant » : on passe au contact suivant de cette liste.
- Le retour du navigateur ramène à l'onglet précédent.

ÉTAPE SUIVANTE
D.6 : le compte rendu tapé directement dans la fiche, et l'historique par jour.

Applique la procédure de fin d'étape.
```

## Étape D.6 — Fiche Contact : compte rendu dans la fiche et historique par jour

```text
Lis CLAUDE.md, docs/cadrage.md (sections « La journée type et l'écran Aujourd'hui » et « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.6 Fiche Contact : compte rendu dans la fiche et historique par jour
Le rituel « après chaque échange » (30 secondes) doit pouvoir se faire depuis la fiche, sans ouvrir de fenêtre.
- En tête de l'onglet Activité, un bloc « Consigner un échange » :
  - le type en pastilles (Appel, Rendez-vous, Visite, Message, Note ; Appel par défaut) ;
  - un champ « Qu'avez-vous échangé avec <prénom> ? », en 16 px, utilisable avec la dictée du clavier ;
  - le résultat de l'appel quand le type est Appel (pastilles existantes) ;
  - « Ensuite » : la prochaine action proposée selon la température (mêmes règles que la boucle 1.8 et le compte rendu express 1.12), modifiable d'un toucher (raccourcis de date, « Ne rien prévoir ») ;
  - « Enregistrer » (ou ⌘ Entrée, Ctrl Entrée) crée l'activité et la tâche suivante, comme la boucle ; le champ se vide et la nouvelle activité apparaît en haut de l'historique.
- Une visite ouvre les champs du compte rendu structuré existant (ChampsCompteRenduVisite).
- Un texte non enregistré est gardé sur l'appareil si l'on quitte la fiche, et proposé au retour.
- « À venir » : les tâches à faire du contact, la plus proche d'abord, avec leur échéance (rouge si en retard), à cocher (boucle).
- « Historique » : les activités groupées par jour (« Jeudi 13 novembre · il y a 8 jours »). Chaque activité est une carte avec son dessin, son heure, son résultat en pastille (« Intéressé », « Pas de réponse ») et son texte. La lecture par pages actuelle est conservée.
- Réutilise la logique de la boucle et du compte rendu express (src/features/relances, src/features/saisie) plutôt que de la recopier ; si un morceau doit être partagé, déplace-le dans une fonction commune testée.
- Mets à jour docs/design.md et docs/guide-utilisateur.md (rituel « après chaque échange »).

À TESTER
- Depuis la fiche, consigner un appel « Pas de réponse » avec un rappel dans 2 jours : l'activité apparaît en haut et la prochaine action devient ce rappel, sans fenêtre.
- Quitter la fiche avec un texte non enregistré, puis revenir : le brouillon est proposé.
- Choisir Visite affiche les champs du compte rendu de visite.
- La date du dernier contact de la fiche se met à jour.

ÉTAPE SUIVANTE
D.7 : la même organisation pour les fiches Bien et Projet.

Applique la procédure de fin d'étape.
```

## Étape D.7 — Fiches Bien et Projet : même organisation

```text
Lis CLAUDE.md, docs/cadrage.md (section « L'interface »), docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.7 Fiches Bien, projet de vente et projet d'achat : même organisation
Les fiches doivent se ressembler pour qu'on s'y retrouve sans réfléchir. Applique l'organisation de la fiche Contact (étapes D.5 et D.6) aux trois autres fiches, en réutilisant ses composants : profil, onglets, barre d'actions du téléphone, Copier, reports en un geste, compte rendu dans la fiche.
- Fiche Bien :
  - à gauche, la photo principale (galerie au toucher), le type, l'adresse avec Copier et Itinéraire, le prix et la surface, les propriétaires (à appeler d'un toucher), la prochaine tâche ;
  - onglets Activité, Projets et acquéreurs, Tâches, Détails (caractéristiques, historique des prix, description, photos) ;
  - sur téléphone, la barre du bas : Itinéraire, Appeler le propriétaire, Consigner.
- Projet de vente et projet d'achat :
  - à gauche, l'étape en barre avec « Pour passer à l'étape suivante : … » et « Étape suivante », le contact et le bien liés, la prochaine action ;
  - onglets Activité, Tâches, Détails, et Biens proposés pour un projet d'achat.
- Le compte rendu dans la fiche (étape D.6) sur ces trois fiches, lié à la fiche ouverte.
- Précédent et suivant : pour les biens comme pour les contacts ; pour les projets, dans l'ordre de leur colonne du pipeline.
- Aucune information ne disparaît : décris dans la pull request où chaque rubrique est allée.
- Mets à jour docs/design.md et docs/guide-utilisateur.md.

À TESTER
- Les quatre fiches se ressemblent : profil à gauche et onglets à droite sur ordinateur ; en-tête, onglets et barre du bas sur téléphone.
- Depuis la fiche d'un bien, lancer l'itinéraire et appeler son propriétaire.
- Passer un projet de vente à l'étape suivante depuis sa fiche ; un critère manquant ouvre la fenêtre habituelle.

ÉTAPE SUIVANTE
D.8 : recette de l'interface version 3.

Applique la procédure de fin d'étape.
```

## Étape D.8 — Recette de l'interface version 3

```text
Lis CLAUDE.md, docs/cadrage.md, docs/design.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — D.8 Recette de l'interface version 3
Aucune nouvelle fonction.
- Dresse docs/recette-interface-v3.md : chaque élément des étapes D.0 à D.7 et de la section « L'interface » du cadrage, avec son état. Corrige les écarts.
- Parcours tous les écrans et toutes les fenêtres aux trois tailles, en clair et en sombre, avec le navigateur automatisé et des données fictives. Rien ne doit défiler de côté, aucun texte ne doit être coupé, aucune cible tactile ne doit faire moins de 44 px, aucun contraste ne doit être insuffisant (mesure-les), et le contour du clavier doit être visible partout.
- Au clavier seul : déroule la journée type (Aujourd'hui, une relance, la fiche, le compte rendu, le retour) sans souris.
- Lecteur d'écran : vérifie le nom des boutons à dessin seul, des onglets, de l'anneau de progression, des pastilles, et l'équivalent visible de chaque geste glissé.
- Compte de nouveau les gestes des cinq saisies courantes (mesures de l'étape 1.12) et note l'écart.
- Vérifie le temps d'affichage d'Aujourd'hui et de la fiche Contact avec le lot de 30 000 contacts fictifs.
- Mets à jour docs/guide-utilisateur.md.

À TESTER
- Le rituel du matin puis une journée type, sur téléphone.
- Le thème sombre, le soir.
- Les gestes : reporter, copier, glisser, consigner depuis la fiche.

ÉTAPE SUIVANTE
2.1 : les mandats, début de la version 2.

Applique la procédure de fin d'étape et marque l'interface version 3 comme livrée.
```

---

# Version 2 — Les dossiers

Objectif du cadrage : sécuriser mandats et ventes. Critère de réussite : aucune échéance manquée sur un trimestre.

## Étape 2.1 — Mandats

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM », « Conformité » et « Priorisation ») et docs/avancement.md avant de commencer. Si j'ai noté des gênes après la V1, je te les donne maintenant : traite-les d'abord si elles sont rapides, sinon liste-les.

ÉTAPE EN COURS — 2.1 Mandats
Le CRM suit la vie du mandat sans le rédiger : la rédaction, la signature et le registre officiel restent hors périmètre.
- Migration : table mandats (projet vendeur, bien, type : simple, exclusif, semi-exclusif ; numéro au registre, saisi à la main ; date de signature, date de début, durée, date de fin, reconduction ; prix de vente, honoraires en montant et en pourcentage, à la charge du vendeur ou de l'acquéreur ; signé hors établissement oui ou non ; état : actif, expiré, résilié, vendu) et table des avenants (date, nature, ancien et nouveau prix, nouvelle date de fin).
- Mandat signé hors établissement : calcule et affiche la date de fin du délai de rétractation de 14 jours ; tant qu'il court, le bien porte un bandeau « diffusion bloquée », levable seulement en cochant « demande expresse du vendeur ».
- Passer un projet vendeur à l'étape « Mandat signé » ouvre la création du mandat ; le statut du bien passe à « en mandat » et son prix suit le mandat et ses avenants.
- Règle de conformité : impossible de planifier une visite sur un bien sans mandat actif comportant numéro, type et dates ; message explicite.
- Page Mandats : liste des mandats actifs avec date de fin et jours restants ; fiche mandat avec ses avenants.
- Tests unitaires sur les calculs de dates.

À TESTER
- Créer un mandat depuis le pipeline vendeur ; le bien passe « en mandat ».
- Un mandat signé à domicile aujourd'hui bloque la diffusion pendant 14 jours.
- Tenter de planifier une visite sur un bien sans mandat est refusé avec une explication.
- Un avenant de baisse de prix met à jour le prix du bien et son historique.

ÉTAPE SUIVANTE
2.2 : échéances de mandat et suivi du vendeur.

Applique la procédure de fin d'étape.
```

## Étape 2.2 — Échéances de mandat et suivi du vendeur

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Automatisations » et « La journée type ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.2 Échéances de mandat et suivi du vendeur
- Alertes à 30 et 15 jours avant la fin d'un mandat, dans le bloc Alertes de l'écran Aujourd'hui, avec trois issues : renouveler (avenant), renégocier le prix (avenant), clôturer.
- Compte rendu au vendeur : pour chaque mandat actif, une tâche récurrente tous les 15 jours. À l'ouverture, le CRM prépare le contenu : nombre de visites depuis le dernier compte rendu, retours des visiteurs (tirés des comptes rendus de visite), demandes reçues, évolution proposée. Je relis, je corrige, puis j'envoie par mon application de messagerie ou de SMS ; l'envoi est consigné dans le journal.
- Alerte « vendeur sans nouvelles depuis 15 jours » pour tout mandat actif.
- Sur la fiche mandat : compteur de visites, liste des comptes rendus envoyés, jours restants.
- Rien ne s'envoie automatiquement : le CRM crée des tâches et prépare des textes, jamais d'envoi sans validation.

À TESTER
- Un mandat fictif finissant dans 29 jours apparaît dans les alertes.
- Le compte rendu vendeur préparé reprend bien les visites et leurs retours.
- Après envoi, l'alerte « sans nouvelles » disparaît et la prochaine tâche est à 15 jours.

ÉTAPE SUIVANTE
2.3 : les transactions et leur pipeline.

Applique la procédure de fin d'étape.
```

## Étape 2.3 — Transactions et pipeline transaction

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM » et « Les pipelines ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.3 Transactions et pipeline transaction
Une Transaction est un dossier de vente, de l'offre acceptée à l'encaissement. Étapes et critères : Offre acceptée (prix, conditions) → Compromis (rétractation 10 jours) → Financement (accord de prêt) → Acte (chez le notaire) → Honoraires (encaissés).
- Migration : table offres (projet acquéreur, bien, montant, conditions, date, validité, état : en cours, acceptée, refusée, contre-proposition) et table transactions (mandat, bien, projet acquéreur, offre acceptée, prix de vente, honoraires prévus et part me revenant, notaire du vendeur et notaire de l'acquéreur choisis parmi les contacts, étape, dates clés, état : en cours, vendue, annulée avec motif).
- Saisir une offre depuis un projet acquéreur ou un bien ; l'accepter crée la transaction, passe le bien « sous offre », et marque les projets vendeur et acquéreur comme gagnés à la signature de l'acte.
- Page Pipelines, onglet Transactions, sur le modèle des deux autres. Chaque carte montre le bien, les parties, la prochaine échéance et les honoraires.
- Une transaction annulée (refus de prêt, rétractation) remet le bien en mandat et rouvre le projet acquéreur.
- Motif d'annulation enregistré pour les statistiques.

À TESTER
- Saisir une offre, la refuser, saisir une contre-proposition, l'accepter : la transaction est créée.
- Le bien passe « sous offre » ; les trois pipelines restent cohérents.
- Annuler la transaction pour refus de prêt remet tout dans l'état précédent.

ÉTAPE SUIVANTE
2.4 : échéancier légal et checklist du dossier de vente.

Applique la procédure de fin d'étape.
```

## Étape 2.4 — Échéancier et checklist de transaction

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Automatisations » et « Conformité ») et docs/avancement.md avant de commencer. Rappelle dans ton compte rendu que les délais légaux sont à faire valider par un juriste.

ÉTAPE EN COURS — 2.4 Échéancier et checklist de transaction
- À la signature du compromis, génère l'échéancier du dossier : fin du délai de rétractation de l'acquéreur (10 jours), date limite de dépôt de la demande de prêt, date limite d'obtention du prêt, levée des autres conditions suspensives (saisie libre), date prévue de l'acte. Chaque échéance est modifiable et crée une tâche.
- Les échéances proches ou dépassées apparaissent dans le bloc Alertes de l'écran Aujourd'hui.
- Checklist de pièces du dossier, cochable, avec date : pièces d'identité des parties (obligation de vigilance contre le blanchiment), titre de propriété, diagnostics, documents de copropriété, offre signée, justificatif de financement, etc. La liste s'adapte au type de bien (viager, commerce, neuf, terrain) et reste modifiable.
- Une case « vigilance sur l'origine des fonds effectuée » avec date et note.
- Vue chronologique du dossier sur la fiche transaction : ce qui est fait, ce qui vient, ce qui est en retard.
- Tests unitaires sur les calculs de délais.

À TESTER
- Un compromis signé aujourd'hui génère toutes les échéances aux bonnes dates.
- Une échéance à 3 jours apparaît dans les alertes.
- La checklist d'un viager diffère de celle d'un appartement ancien.

ÉTAPE SUIVANTE
2.5 : checklists de mise en vente et contrôle des mentions d'annonce.

Applique la procédure de fin d'étape.
```

## Étape 2.5 — Checklists de mise en vente

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Automatisations » et « Conformité ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.5 Checklists de mise en vente
- Généralise le mécanisme de checklist de l'étape 2.4 en modèles réutilisables et modifiables dans Réglages.
- À la signature d'un mandat, crée la checklist de mise en vente : diagnostics commandés puis reçus, photos, annonce rédigée, panneau posé, diffusion lancée. Chaque ligne peut porter une date d'échéance et devenir une tâche.
- Contrôle « annonce prête » : le CRM ne rédige ni ne diffuse l'annonce, mais vérifie que les informations obligatoires sont renseignées sur la fiche avant de cocher la ligne : prix, honoraires et qui les paie, DPE et GES, mention du statut d'agent commercial dans mes réglages. Liste claire de ce qui manque.
- La ligne « diffusion lancée » est bloquée tant que le délai de rétractation d'un mandat hors établissement court, sauf demande expresse du vendeur (étape 2.1).
- Avancement de la checklist visible sur la fiche bien et la fiche mandat.

À TESTER
- Signer un mandat crée la checklist de mise en vente.
- Sans DPE renseigné, « annonce prête » est refusée avec la liste des manques.
- Modifier le modèle dans Réglages s'applique aux prochains mandats, pas aux anciens.

ÉTAPE SUIVANTE
2.6 : le moteur d'automatisations de tâches.

Applique la procédure de fin d'étape.
```

## Étape 2.6 — Automatisations de tâches

```text
Lis CLAUDE.md, docs/cadrage.md (section « Automatisations et rappels ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.6 Automatisations de tâches
Principe du cadrage : le CRM automatise la création de tâches et de rappels, jamais l'envoi d'un message sans validation.
- Regroupe les automatismes déjà écrits (relance suivante, compte rendu vendeur, alertes de mandat, échéancier de compromis, checklist de mise en vente) dans un moteur unique, lisible et testé : un déclencheur, des tâches créées.
- Ajoute ceux du tableau du cadrage qui manquent encore :
  - estimation réalisée → tâches à J+2 (envoi de l'avis de valeur) et J+7 (rappel du vendeur) ;
  - visite terminée → demande du compte rendu à chaud, puis rappel de l'acquéreur à J+1 ;
  - acte signé → demande d'avis client, demande de recommandation, rappels à 6 mois et à la date anniversaire ; le vendeur et l'acquéreur passent en « veille client » ;
  - contact sans prochaine action → signalé dans une liste de revue.
- Page Réglages → Automatisations : chaque règle peut être activée, désactivée et ses délais ajustés.
- Chaque tâche créée automatiquement porte la mention de la règle qui l'a créée ; jamais de doublon si la règle se redéclenche.
- Tests unitaires pour chaque règle.

À TESTER
- Clôturer une estimation crée les deux tâches aux bonnes dates.
- Signer un acte crée les quatre suites et passe les contacts en veille client.
- Désactiver une règle l'empêche de créer des tâches.
- Déclencher deux fois le même événement ne crée pas de doublon.

ÉTAPE SUIVANTE
2.7 : rapprochement automatique entre acquéreurs et biens.

Applique la procédure de fin d'étape.
```

## Étape 2.7 — Rapprochement acquéreurs-biens

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.7 Rapprochement acquéreurs-biens
But : proposer le bon bien à la bonne personne.
- Écris une fonction de rapprochement entre un bien et les projets acquéreurs actifs : type, secteur, budget (avec une marge réglable), surface, pièces, critères indispensables. Résultat : un score et la liste des critères remplis ou non.
- Sur la fiche Bien : « Acquéreurs correspondants », triés par score. Sur le projet acquéreur : « Biens correspondants ».
- Quand un bien entre en mandat ou baisse de prix, liste les acquéreurs correspondants dans le bloc Nouveautés de l'écran Aujourd'hui. Un geste pour « proposer ce bien » : cela l'ajoute aux biens proposés et crée la tâche de contact.
- Un bien déjà proposé ou refusé par un acquéreur ne lui est pas reproposé, sauf baisse de prix.
- Le calcul se fait côté base pour rester rapide avec beaucoup de fiches.
- Tests unitaires sur le score.

À TESTER
- Un nouvel appartement à 250 000 € fait apparaître les acquéreurs dont le budget et les critères correspondent, et pas les autres.
- Baisser le prix fait apparaître de nouveaux acquéreurs.
- Proposer le bien crée la tâche et l'inscrit dans le projet acquéreur.

ÉTAPE SUIVANTE
2.8 : modèles de messages.

Applique la procédure de fin d'étape.
```

## Étape 2.8 — Modèles de messages

```text
Lis CLAUDE.md, docs/cadrage.md (section « Automatisations et rappels ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.8 Modèles de messages
Les modèles sont préremplis avec les données de la fiche, puis relus et envoyés d'un geste. Aucun envoi sans validation.
- Migration : table modeles_messages (nom, canal : SMS ou courriel, objet, texte avec variables : prénom, nom, adresse du bien, date et heure du rendez-vous, prix, nombre de visites, etc.).
- Fournis des modèles de départ modifiables : confirmation de visite, rappel de rendez-vous, envoi de l'avis de valeur, compte rendu vendeur, proposition d'un bien à un acquéreur, demande d'avis client, demande de recommandation, prise de nouvelles en veille.
- Depuis une fiche, une tâche ou une automatisation : choisir un modèle, voir le texte rempli, le corriger, puis l'ouvrir dans l'application SMS ou de messagerie du téléphone. Une fois envoyé, une activité est consignée avec le texte.
- Les tâches créées par les automatisations proposent directement le modèle adapté.
- Respect du consentement : un contact ayant refusé le démarchage n'est pas proposé pour les messages de prospection.
- Page Réglages → Modèles pour créer et modifier, avec aperçu.

À TESTER
- Le modèle « confirmation de visite » se remplit avec le bon prénom, la bonne adresse et la bonne heure.
- Le message s'ouvre dans l'application SMS avec le texte et le numéro.
- L'envoi apparaît dans le journal du contact.

ÉTAPE SUIVANTE
2.9 : synchronisation avec l'agenda du téléphone.

Applique la procédure de fin d'étape.
```

## Étape 2.9 — Synchronisation de l'agenda

```text
Lis CLAUDE.md, docs/cadrage.md (section Architecture technique) et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.9 Synchronisation de l'agenda
Le site est statique : il n'y a pas de serveur. Deux niveaux, à réaliser dans cet ordre.
1. Sur chaque rendez-vous, un bouton « Ajouter à mon agenda » qui produit un fichier d'événement standard (.ics) avec titre, heure, durée, adresse et lien vers la fiche.
2. Un flux d'agenda auquel le téléphone s'abonne une fois, et qui affiche tous mes rendez-vous à venir. Il nécessite une fonction Supabase (Edge Function) protégée par un jeton secret long, régénérable depuis Réglages. Vérifie d'abord dans la documentation de Supabase que l'offre gratuite le permet ; sinon, explique l'alternative et arrête-toi au niveau 1.
- Le flux ne contient que le strict nécessaire : pas de note confidentielle, pas de téléphone.
- Rédige dans docs/guide-utilisateur.md comment s'abonner depuis un iPhone, un Android et un ordinateur.
- Le sens est unique : du CRM vers l'agenda. Dis-le clairement dans l'interface.

À TESTER
- Le fichier d'un rendez-vous s'ajoute à l'agenda du téléphone avec la bonne heure (attention au changement d'heure).
- Après abonnement au flux, un rendez-vous créé dans le CRM apparaît dans l'agenda après actualisation.
- Régénérer le jeton rend l'ancien lien inutilisable.

ÉTAPE SUIVANTE
2.10 : compléter l'écran Aujourd'hui avec tout ce que la V2 a apporté.

Applique la procédure de fin d'étape.
```

## Étape 2.10 — Écran « Aujourd'hui » complet

```text
Lis CLAUDE.md, docs/cadrage.md (section « La journée type et l'écran Aujourd'hui ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.10 Écran « Aujourd'hui » complet
La V2 a ajouté beaucoup d'alertes. L'écran doit rester lisible en cinq minutes le matin.
- Bloc Alertes : regroupe et hiérarchise mandats qui expirent, délais de rétractation, conditions suspensives proches, vendeurs sans nouvelles depuis 15 jours, checklists en retard, export de sauvegarde en retard. Les plus urgentes d'abord ; chaque alerte se traite ou se planifie en un geste.
- Bloc Nouveautés : demandes entrantes à qualifier et nouveaux rapprochements acquéreurs-biens.
- Une alerte traitée ou reportée ne réapparaît pas le jour même.
- La pastille de l'entrée Tâches (étape D.2) compte aussi les alertes en retard, ou une seconde pastille apparaît sur Aujourd'hui : choisis la plus lisible.
- Vérifie le temps d'affichage avec un jeu de données fictif chargé (30 000 contacts, 200 mandats, 50 transactions).

À TESTER
- Avec des données variées, l'ordre des alertes correspond bien à l'urgence réelle.
- L'écran reste lisible sur téléphone avec une vingtaine d'éléments.
- L'affichage reste sous deux secondes.

ÉTAPE SUIVANTE
2.11 : recette de la version 2.

Applique la procédure de fin d'étape.
```

## Étape 2.11 — Recette de la version 2

```text
Lis CLAUDE.md, docs/cadrage.md en entier et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 2.11 Recette de la version 2
Aucune nouvelle fonction.
- Dresse docs/recette-v2.md : tout ce que la V2 devait contenir (mandats et échéances, pipeline transaction, checklists, automatisations de tâches, rapprochement acquéreurs-biens, modèles de messages, synchronisation de l'agenda) et chaque ligne du tableau « Automatisations et rappels » du cadrage, avec leur état. Corrige les écarts.
- Déroule avec le navigateur automatisé un dossier complet de bout en bout sur le projet de test : premier contact vendeur → estimation → mandat → mise en vente → demande acquéreur → visite → offre → compromis → financement → acte → honoraires → veille client. Vérifie à chaque pas les tâches créées et les alertes.
- Revérifie la sécurité de toutes les nouvelles tables et de la fonction d'agenda.
- Mets à jour docs/guide-utilisateur.md et donne-moi le scénario de recette manuel du dossier complet.

À TESTER
- Déroulez le dossier complet sur le projet de test, sur téléphone.
- Donnez votre accord pour appliquer toutes les migrations sur le projet réel.
- Critère du cadrage à suivre ensuite : aucune échéance manquée sur un trimestre.

ÉTAPE SUIVANTE
3.1 : objectifs et calcul de l'effort nécessaire, début de la version 3.

Applique la procédure de fin d'étape et marque la version 2 comme livrée.
```

---

# Version 3 — Le pilotage

Objectif du cadrage : décider avec des chiffres. Critère de réussite : la revue du vendredi se fait entièrement dans le CRM.

## Étape 3.1 — Objectifs

```text
Lis CLAUDE.md, docs/cadrage.md (section « Tableaux de bord et indicateurs ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.1 Objectifs
Le calcul le plus utile du cadrage part de l'objectif annuel et remonte le pipeline.
- Migration : table objectifs (année, honoraires visés, honoraire moyen par vente, taux de transformation de départ saisis à la main : contacts → estimations, estimations → mandats, mandats → ventes ; objectifs hebdomadaires d'effort : appels de prospection, portes frappées, nouveaux contacts, estimations).
- Écran Objectifs : je saisis mon objectif annuel d'honoraires ; le CRM en déduit le nombre de ventes, de mandats, d'estimations et de nouveaux contacts nécessaires par an, par mois et par semaine.
- Dès que le CRM contient au moins trois mois de données, il propose de remplacer les taux saisis par mes taux réels, en montrant la différence. Je reste libre de choisir.
- Tests unitaires sur le calcul.

À TESTER
- Un objectif de 60 000 € avec des taux donnés produit des volumes hebdomadaires cohérents, que vous pouvez recalculer à la main.
- Modifier un taux met à jour toute la chaîne.

ÉTAPE SUIVANTE
3.2 : compteur d'effort et premier volet du tableau de bord.

Applique la procédure de fin d'étape.
```

## Étape 3.2 — Tableau de bord : effort

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Tableaux de bord » et « Suivi de prospection ») et docs/avancement.md avant de commencer. Charge la compétence de visualisation de données si elle est disponible avant de dessiner un graphique.

ÉTAPE EN COURS — 3.2 Tableau de bord : effort
Première question du tableau de bord : est-ce que je travaille assez ?
- Crée la page Tableau de bord, accessible depuis la navigation.
- Volet Effort : par semaine, appels de prospection, portes frappées, nouveaux contacts, estimations réalisées, chacun comparé à l'objectif hebdomadaire. Tout est calculé à partir du journal d'activité : aucune saisie supplémentaire.
- Compteur d'effort de la semaine en cours, placé aussi en tête de l'écran Aujourd'hui sous une forme très compacte.
- Historique sur 12 semaines pour voir la régularité.
- Répartition du temps par type d'activité (prospection, rendez-vous, visites, administratif) à partir des durées saisies.
- Les calculs se font côté base (vues ou fonctions) pour rester rapides.

À TESTER
- Consigner trois appels de prospection fait monter le compteur de trois.
- Les semaines sans activité apparaissent bien à zéro, sans trou dans l'historique.
- Lisible sur téléphone.

ÉTAPE SUIVANTE
3.3 : transformation et revenu.

Applique la procédure de fin d'étape.
```

## Étape 3.3 — Tableau de bord : transformation et revenu

```text
Lis CLAUDE.md, docs/cadrage.md (section « Tableaux de bord et indicateurs ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.3 Tableau de bord : transformation et revenu
Deuxième et troisième questions : est-ce que je transforme bien, combien vais-je encaisser ?
- Volet Transformation : estimations → mandats, part de mandats exclusifs, mandats → ventes, nombre de visites par offre, délai moyen de vente, sur une période choisie. L'affichage montre l'étape où les dossiers se perdent, avec les motifs de perte les plus fréquents.
- Volet Revenu : honoraires signés en attente d'acte (avec la date prévue de chaque acte), honoraires potentiels du portefeuille de mandats (pondérés par mon taux mandats → ventes), chiffre d'affaires encaissé sur l'année, comparé à l'objectif annuel. Une projection de trésorerie à 3 et 6 mois.
- Chaque chiffre est cliquable et mène à la liste des dossiers qui le composent.
- Quand il y a trop peu de données pour qu'un taux ait un sens, dis-le plutôt que d'afficher un pourcentage trompeur.
- Tests unitaires sur les indicateurs.

À TESTER
- Avec un jeu fictif connu, les taux affichés correspondent au calcul fait à la main.
- Cliquer sur « honoraires en attente d'acte » liste les bonnes transactions.
- Avec très peu de données, l'écran l'indique clairement.

ÉTAPE SUIVANTE
3.4 : sources, hygiène et revue du vendredi.

Applique la procédure de fin d'étape.
```

## Étape 3.4 — Sources, hygiène et revue du vendredi

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Tableaux de bord », « Suivi de prospection » et « La journée type ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.4 Sources, hygiène et revue du vendredi
- Volet Sources : contacts, mandats et ventes par origine (pige, porte-à-porte, boitage, recommandation, demandes entrantes, réseaux sociaux et site, sphère personnelle), pour indiquer où investir le temps de prospection. Pour les demandes entrantes : délai moyen de première réponse. Pour les recommandations : meilleurs prescripteurs et remerciements à faire. Pour la sphère personnelle : contacts sans prise de nouvelles récente.
- Volet Hygiène : contacts sans prochaine action, tâches en retard, vendeurs sans compte rendu récent. Chaque compteur doit tendre vers zéro et mène à sa liste.
- Revue du vendredi : un parcours guidé de 20 minutes, en étapes : 1) chiffres de la semaine face aux objectifs ; 2) passage en revue des trois pipelines, dossier par dossier, avec une action possible sur chacun ; 3) tâches en retard à traiter ou reporter ; 4) hygiène ; 5) plan de prospection de la semaine suivante, avec blocage de créneaux de prospection dans l'agenda comme des rendez-vous. La revue terminée est enregistrée avec sa date et une note libre.
- Une tâche récurrente « Revue de la semaine » le vendredi ouvre directement ce parcours.

À TESTER
- Le volet Sources reflète les origines saisies sur les fiches.
- La revue se déroule de bout en bout sur ordinateur et sur tablette.
- Les créneaux de prospection bloqués apparaissent dans l'agenda de la semaine suivante.

ÉTAPE SUIVANTE
3.5 : zones de prospection.

Applique la procédure de fin d'étape.
```

## Étape 3.5 — Zones de prospection

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Les objets du CRM », « Suivi de prospection » et « Décisions prises ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.5 Zones de prospection
La Zone est un secteur, un quartier ou une rue. Décision du cadrage : aucun chargement en masse ; les adresses et les contacts se créent au fur et à mesure, au premier contact réel.
- Migration : table zones (nom, type : secteur, quartier, rue ; zone parente ; commune ; notes) et rattachement des biens à une zone.
- Rattachement automatique d'un bien à sa rue à partir de son adresse, avec création de la rue si elle n'existe pas ; je regroupe ensuite les rues en quartiers et secteurs à la main.
- Page Prospection → Zones : arborescence secteur, quartier, rue. Pour chaque zone : nombre de biens connus par statut, contacts liés, dernière action de prospection, mandats et ventes obtenus.
- Fiche d'une rue : la liste de ses biens connus, par numéro, avec leur statut et le dernier échange.
- Ne crée aucune fiche de personne à partir d'une simple adresse : seulement des biens, les contacts venant au premier échange réel (précaution RGPD du projet).

À TESTER
- Créer un bien rue X crée ou retrouve la rue X et l'y rattache.
- Regrouper trois rues dans un quartier ; les compteurs du quartier s'additionnent.
- La fiche d'une rue liste ses biens dans l'ordre des numéros.

ÉTAPE SUIVANTE
3.6 : campagnes de prospection et saisie de terrain.

Applique la procédure de fin d'étape.
```

## Étape 3.6 — Campagnes de prospection

```text
Lis CLAUDE.md, docs/cadrage.md (section « Suivi de prospection ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.6 Campagnes de prospection
Une Campagne est une opération de boitage, de porte-à-porte ou d'appels sur une zone.
- Migration : table campagnes (nom, type : boitage, porte-à-porte, appels, pige ; zone ; dates ; support distribué ; nombre d'exemplaires ; objectif ; notes) et lien facultatif entre une activité ou un contact et la campagne qui l'a généré.
- Boitage : zone, date, support, nombre d'exemplaires ; les contacts qui se manifestent ensuite sont rattachés à la campagne ; taux de retour par campagne.
- Porte-à-porte : un mode de saisie de terrain sur téléphone, rue par rue, numéro par numéro : absent, pas intéressé, à revoir, contact créé. Un résultat se saisit en un geste ; « contact créé » ouvre le contact express avec la rue, le numéro et la source préremplis. Compteur de portes frappées alimentant le tableau de bord.
- Pige : pour chaque annonce de particulier, je saisis l'adresse ou le secteur, le prix, le lien de l'annonce, la date du premier appel et la réponse obtenue ; suivi des rappels. Respecte le blocage lié au consentement téléphonique de l'étape 1.3 et rappelle la règle dans l'interface. Aucune collecte automatique d'annonces.
- Bilan par campagne : effort fourni, contacts créés, estimations, mandats.

À TESTER
- Saisir vingt portes d'une rue en mode terrain en moins de trois minutes.
- Un contact créé pendant un porte-à-porte porte la bonne source, la bonne rue et la bonne campagne.
- Le bilan d'une campagne de boitage affiche son taux de retour.

ÉTAPE SUIVANTE
3.7 : la carte du secteur.

Applique la procédure de fin d'étape.
```

## Étape 3.7 — Carte du secteur

```text
Lis CLAUDE.md, docs/cadrage.md (section « Suivi de prospection ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.7 Carte du secteur
Une carte où chaque bien connu apparaît avec sa couleur : en mandat, vendu, propriétaire en veille, jamais contacté. Elle montre où prospecter.
- Géolocalisation des biens à partir de leur adresse, via un service public et gratuit d'adresses françaises (Base Adresse Nationale). Vérifie dans sa documentation les conditions d'usage et les limites actuelles. Les coordonnées sont enregistrées une fois sur le bien ; position corrigeable à la main.
- Suggestions d'adresses pendant la saisie d'un bien, avec le même service.
- Page Prospection → Carte, sur fond OpenStreetMap avec une bibliothèque libre : un point par bien, coloré selon son statut, avec légende et filtres (statut, type, zone, ancienneté du dernier échange). Regroupement des points quand ils sont nombreux. Toucher un point ouvre un résumé et un lien vers la fiche.
- Bouton « Autour de moi » sur téléphone pour centrer la carte sur ma position.
- Seules les adresses partent vers le service d'adresses, jamais de nom ni de téléphone.
- La carte reste fluide avec plusieurs milliers de points (jeu fictif sur le projet de test).

À TESTER
- Un bien créé avec une adresse réelle de votre secteur apparaît au bon endroit.
- Les couleurs correspondent aux statuts ; les filtres fonctionnent.
- Sur téléphone, « Autour de moi » centre la carte et les points restent faciles à toucher.

ÉTAPE SUIVANTE
3.8 : recette de la version 3.

Applique la procédure de fin d'étape.
```

## Étape 3.8 — Recette de la version 3

```text
Lis CLAUDE.md, docs/cadrage.md en entier et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 3.8 Recette de la version 3
Aucune nouvelle fonction.
- Dresse docs/recette-v3.md : tableau de bord (effort, transformation, revenu, sources, hygiène), objectifs, suivi des sources, zones, campagnes, carte du secteur, et chaque ligne des tableaux « Tableaux de bord » et « Suivi de prospection » du cadrage, avec leur état. Corrige les écarts.
- Vérifie chaque indicateur contre un jeu de données fictif dont les résultats attendus sont calculés à la main et écrits dans un test.
- Vérifie les performances du tableau de bord et de la carte sur le projet de test chargé.
- Revérifie la sécurité des nouvelles tables.
- Mets à jour docs/guide-utilisateur.md avec la revue du vendredi et le travail de secteur.

À TESTER
- Faites une vraie revue du vendredi entièrement dans le CRM : c'est le critère de réussite du cadrage.
- Donnez votre accord pour appliquer toutes les migrations sur le projet réel.

ÉTAPE SUIVANTE
4.1 : notes vocales, début de la version 4.

Applique la procédure de fin d'étape et marque la version 3 comme livrée.
```

---

# Version 4 — Le confort

Objectif du cadrage : gagner du temps. Critère de réussite : moins de 15 minutes de saisie par jour.

Plusieurs étapes de cette version font appel à des services extérieurs payants à l'usage (transcription, intelligence artificielle, envoi de courriels). Chacune commence par un point sur le coût et sur les données envoyées, et vous laisse décider.

## Étape 4.1 — Notes vocales transcrites

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.1 Notes vocales transcrites
Aujourd'hui la dictée repose sur le navigateur (étape 1.12). On veut pouvoir enregistrer une note vocale plus longue, par exemple en sortant d'une visite, et la retrouver en texte sur la fiche.
- Commence par me présenter les options de transcription, leur coût approximatif et ce que chacune implique pour les données (la voix et les noms de clients partent chez un prestataire) : vérifie les informations à jour avant de recommander. Attends mon choix avant de développer.
- Enregistrement audio dans l'application, envoi à une fonction Supabase qui appelle le service choisi ; la clé du service reste dans les secrets de Supabase, jamais dans le code du site.
- Le texte transcrit est proposé pour relecture, puis enregistré comme activité. L'audio n'est pas conservé après transcription, sauf réglage contraire.
- Si le service est indisponible, la note reste en attente et je peux la retaper.
- Un compteur d'usage mensuel dans Réglages.

À TESTER
- Une note de 30 secondes dictée dans la rue est transcrite correctement, noms propres compris autant que possible.
- Le texte relu se retrouve dans le journal du bon contact.
- La clé du service n'apparaît nulle part dans le dépôt.

ÉTAPE SUIVANTE
4.2 : résumé automatique d'une fiche avant un appel.

Applique la procédure de fin d'étape.
```

## Étape 4.2 — Résumé d'une fiche avant un appel

```text
Lis CLAUDE.md, docs/cadrage.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.2 Résumé d'une fiche avant un appel
But : avant d'appeler, lire en dix secondes où j'en suis avec cette personne.
- Présente-moi d'abord le coût approximatif et ce que cela implique pour les données (l'historique d'un contact part chez un prestataire d'intelligence artificielle). Vérifie les modèles et tarifs à jour avant de recommander. Attends mon accord.
- Un bouton « Résumer » sur la fiche Contact : une fonction Supabase envoie le strict nécessaire (projets, dernières activités, prochaine action) et renvoie un résumé de cinq lignes : qui est-ce, son projet, où on en est, ce qui a été promis, ce qu'il faut aborder.
- La clé du service reste dans les secrets de Supabase.
- Le résumé est mis en cache et marqué « à jour » ou « dépassé » selon les activités ajoutées depuis.
- Le résumé ne remplace jamais le journal : il renvoie aux activités dont il est tiré, et affiche une mention indiquant qu'il est généré automatiquement et peut contenir des erreurs.
- Proposé aussi depuis le bloc « À relancer » de l'écran Aujourd'hui.

À TESTER
- Sur un contact fictif à l'historique riche, le résumé est exact et utile.
- Sur un contact presque vide, il le dit simplement, sans inventer.
- Ajouter une activité marque le résumé comme dépassé.

ÉTAPE SUIVANTE
4.3 : envois groupés ciblés.

Applique la procédure de fin d'étape.
```

## Étape 4.3 — Envois groupés ciblés

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Analyse des besoins », domaine Communication, et « Conformité ») et docs/avancement.md avant de commencer. Rappelle dans ton compte rendu que les règles de prospection par courriel et SMS sont à faire valider par un juriste.

ÉTAPE EN COURS — 4.3 Envois groupés ciblés
But : envoyer un même message à un groupe choisi, par exemple une lettre d'information de secteur ou l'annonce d'une vente dans une rue.
- Segments : une sélection de contacts enregistrée à partir des filtres (rôle, étiquette, source, température, zone, veille client). Aperçu du nombre de destinataires.
- Exclusions automatiques et visibles : contacts opposés au démarchage, sans consentement pour le canal, sans coordonnées valides.
- Présente-moi les options d'envoi de courriels en nombre, leur coût et leurs limites gratuites, vérifiés à jour ; attends mon choix. L'envoi passe par une fonction Supabase, clé dans les secrets.
- Chaque courriel contient un lien de désinscription qui enregistre l'opposition sur la fiche.
- Rédaction à partir des modèles (étape 2.8), aperçu sur un destinataire, envoi d'essai à moi-même, puis confirmation explicite avant l'envoi réel.
- Chaque envoi est consigné dans le journal de chaque destinataire ; bilan par envoi.
- Pour les SMS groupés : uniquement l'export de la liste, pas d'envoi automatique à cette étape.

À TESTER
- Un segment « propriétaires en veille du quartier X » liste les bons contacts et exclut ceux qui ont refusé.
- L'envoi d'essai arrive correctement mis en forme.
- Le lien de désinscription marque bien l'opposition sur la fiche.

ÉTAPE SUIVANTE
4.4 : suivi des commissions et des frais.

Applique la procédure de fin d'étape.
```

## Étape 4.4 — Commissions et frais

```text
Lis CLAUDE.md, docs/cadrage.md (domaine Administratif et section « Priorisation ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.4 Commissions et frais
La facturation reste hors périmètre : on suit seulement ce qui est encaissé et ce qui est dépensé.
- Commissions : pour chaque transaction, honoraires prévus, part me revenant, date d'encaissement prévue et réelle, montant réellement encaissé. Vue annuelle et mensuelle ; écart entre prévu et encaissé. Ces données alimentent le volet Revenu du tableau de bord.
- Frais : table des dépenses (date, catégorie : publicité, diagnostics offerts, abonnements, déplacements, formation, autres ; montant ; note ; photo du justificatif, compressée). Saisie express depuis le bouton « + ».
- Kilomètres : saisie d'un trajet (date, motif, distance), avec lien facultatif vers un rendez-vous ; total mensuel et annuel.
- Vue de synthèse : encaissé moins frais, par mois et sur l'année. Export en tableur pour le comptable.
- Mention claire : ce suivi est une aide, pas une comptabilité.

À TESTER
- Encaisser les honoraires d'une transaction met à jour le chiffre d'affaires du tableau de bord.
- Saisir une dépense avec photo du ticket depuis le téléphone en moins de 20 secondes.
- L'export s'ouvre correctement dans un tableur.

ÉTAPE SUIVANTE
4.5 : obligations personnelles (formation, renouvellements).

Applique la procédure de fin d'étape.
```

## Étape 4.5 — Obligations personnelles

```text
Lis CLAUDE.md, docs/cadrage.md (section « Conformité ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.5 Obligations personnelles
Le cadrage prévoit de suivre comme de simples tâches récurrentes : les heures de formation continue (14 heures par an) et le renouvellement de l'attestation d'habilitation et de l'assurance de responsabilité civile professionnelle. Les chiffres sont à faire valider.
- Formation : saisie des formations suivies (date, intitulé, organisme, heures, justificatif), compteur annuel face à l'objectif réglable, alerte en fin d'année si l'objectif n'est pas atteint.
- Échéances professionnelles : une liste d'échéances réglables (attestation d'habilitation, assurance RCP, autres) avec date de fin et rappels à 60 et 30 jours dans le bloc Alertes.
- Une page « Mon activité » dans Plus, qui regroupe formation, échéances, commissions et frais.

À TESTER
- Saisir une formation de 7 heures fait avancer le compteur.
- Une échéance à 45 jours apparaît dans les alertes.

ÉTAPE SUIVANTE
4.6 : rappels sans ouvrir l'application et hygiène des données.

Applique la procédure de fin d'étape.
```

## Étape 4.6 — Rappels et hygiène des données

```text
Lis CLAUDE.md, docs/cadrage.md (sections « Architecture technique » et « Conformité ») et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.6 Rappels et hygiène des données
Deux sujets que le cadrage renvoie à plus tard.
1. Rappels sans ouvrir l'application. Le site étant statique, cela demande une fonction planifiée de Supabase. Vérifie d'abord dans la documentation ce que l'offre actuelle permet. Objectif : un courriel chaque matin à l'heure choisie, résumant l'écran Aujourd'hui (rendez-vous, nombre de relances, alertes urgentes), sans détail confidentiel, avec un lien vers l'application. Activable dans Réglages.
2. Purge RGPD. Repère CNIL du cadrage : 3 ans après le dernier contact pour un prospect. Une vue « Fiches inactives » liste les prospects sans échange depuis une durée réglable ; pour chacune : relancer, anonymiser ou supprimer. Jamais de suppression automatique ; les clients ayant une transaction sont traités à part. Une alerte trimestrielle rappelle de faire ce tri.
- Dans Réglages, un tableau de l'usage de Supabase (taille de la base, stockage) avec un avertissement à 80 % des limites de l'offre.

À TESTER
- Le courriel du matin arrive à l'heure choisie et reflète l'écran Aujourd'hui.
- Un prospect fictif inactif depuis plus de trois ans apparaît dans les fiches inactives ; l'anonymiser efface ses données personnelles tout en gardant les statistiques.

ÉTAPE SUIVANTE
4.7 : recette finale et préparation du passage chez un hébergeur web.

Applique la procédure de fin d'étape.
```

## Étape 4.7 — Recette finale et migration d'hébergement

```text
Lis CLAUDE.md, docs/cadrage.md en entier, docs/plan-developpement.md et docs/avancement.md avant de commencer.

ÉTAPE EN COURS — 4.7 Recette finale et migration d'hébergement
- Dresse docs/recette-v4.md : notes vocales transcrites, résumé automatique d'une fiche, envois groupés, suivi des commissions et des frais, avec leur état. Corrige les écarts.
- Relis le cadrage section par section et produis docs/couverture-cadrage.md : pour chaque besoin, objet, étape de pipeline, bloc de l'écran Aujourd'hui, automatisation, indicateur et obligation de conformité, indique l'écran qui y répond, ou « non couvert » avec la raison. Rien ne doit rester sans réponse.
- Vérifie que rien de ce qui est exclu par le cadrage n'a été construit : rédaction des mandats et compromis, diffusion des annonces, signature électronique, facturation, location et gestion.
- Audit de sécurité complet : règles d'accès de toutes les tables et de tous les espaces de stockage, fonctions Supabase, secrets, historique du dépôt sans clé ni donnée réelle.
- Mesure le temps de saisie d'une journée type et compare-le au critère du cadrage (moins de 15 minutes par jour) ; propose les améliorations restantes.
- Rédige docs/migration-hebergeur.md : passer de GitHub Pages à un hébergeur web avec un nom de domaine, pas à pas (construction, envoi des fichiers, chemin de base, adresses de redirection dans Supabase, certificat), et dans quel cas passer à l'offre payante de Supabase.
- Mets à jour docs/guide-utilisateur.md pour qu'il couvre les quatre versions.

À TESTER
- Lisez docs/couverture-cadrage.md : chaque ligne du cadrage a sa réponse.
- Déroulez une journée type complète en chronométrant la saisie.
- Si vous migrez l'hébergement, suivez le guide et vérifiez la connexion sur la nouvelle adresse.

ÉTAPE SUIVANTE
Le plan est terminé. La suite se décide à partir de l'usage réel : notez vos gênes pendant un mois, puis ouvrez une session pour les prioriser.

Applique la procédure de fin d'étape et marque la version 4 comme livrée.
```

---

## Correspondance avec le cadrage

| Section du cadrage | Étapes qui la réalisent |
| --- | --- |
| Écran « Aujourd'hui » | 1.11, D.3, D.4, 2.10, 3.2 |
| Aucun contact sans prochaine action | 1.8, 2.6, 3.4 |
| Contacts | 1.1, 1.2, 1.3, D.5 |
| Biens de tous types | 1.4, 1.5, D.7 |
| Tâches et agenda | 1.6, D.1, 2.9 |
| Journal d'activité | 1.7, 1.12, D.6, 4.1 |
| Pipeline vendeur | 1.9 |
| Pipeline acquéreur | 1.10, 2.7 |
| Mandats | 2.1, 2.2, 2.5 |
| Pipeline transaction | 2.3, 2.4 |
| Automatisations et rappels | 1.8, 2.2, 2.4, 2.5, 2.6, 4.6 |
| Communication | 2.8, 4.3 |
| Prospection | 3.5, 3.6, 3.7 |
| Pilotage | 3.1, 3.2, 3.3, 3.4 |
| Administratif | 4.4, 4.5 |
| Conformité | 1.3, 2.1, 2.4, 2.5, 4.3, 4.5, 4.6 |
| Architecture technique et sauvegardes | 0.1 à 0.5, 1.13, 4.7 |
| L'interface | D.0 à D.8 |
