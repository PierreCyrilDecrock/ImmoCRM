# ImmoCRM — Avancement

Ce tableau suit les 45 étapes du [plan de développement](plan-developpement.md). Il est mis à jour à la fin de chaque étape.

États possibles : **à faire**, **en cours**, **terminée**. Une étape est « terminée » quand sa pull request est ouverte ; elle n'est réellement acquise qu'une fois vos vérifications faites et la pull request fusionnée dans `main`.

## Résumé

| Phase | Étapes terminées | État |
| --- | --- | --- |
| Phase 0 — Fondations | 5 sur 5 | terminée |
| Version 1 — Le quotidien | 4 sur 14 | en cours |
| Version 2 — Les dossiers | 0 sur 11 | à faire |
| Version 3 — Le pilotage | 0 sur 8 | à faire |
| Version 4 — Le confort | 0 sur 7 | à faire |

## Phase 0 — Fondations

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 0.1 | Socle du projet | terminée | 16/11/2026 | Squelette Vite, React, TypeScript, Tailwind ; page d'accueil provisoire en version 0.1.0 ; lint, tests et build en place. |
| 0.2 | Déploiement sur GitHub Pages | terminée | 16/11/2026 | Vérification automatique de chaque pull request ; publication sur GitHub Pages à chaque fusion dans `main` ; chemin de base `/ImmoCRM/`, modifiable par la variable `BASE_PATH`. |
| 0.3 | Supabase et connexion | terminée | 16/11/2026 | Connexion par courriel et mot de passe, déconnexion, session conservée, mot de passe oublié ; toutes les pages protégées ; configuration par variables (`.env.local` pour le test, variables GitHub pour le réel). |
| 0.4 | Coquille de l'application | terminée | 16/11/2026 | Navigation en bas (téléphone) ou à gauche (tablette, ordinateur), six pages vides, système de design décrit dans `docs/design.md`, thème clair et sombre, installation sur l'écran d'accueil, bandeau « Connexion perdue ». |
| 0.5 | Conventions de données et sécurité | terminée | 16/11/2026 | Conventions dans `docs/donnees.md` ; première migration (table `reglages`) appliquée sur le projet de test puis sur le projet réel ; couche d'accès aux données commune ; page Réglages (projet TEST ou RÉEL, nom affiché, contrôle d'accès sans connexion) ; test de sécurité `supabase/tests/securite-acces.sql`. |

## Version 1 — Le quotidien

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Contacts : fiche et liste | terminée | 16/11/2026 | Migration `0002_contacts` appliquée sur le projet de test puis sur le projet réel ; liste triée par nom, création rapide, fiche avec Appeler, SMS et Courriel, modification, archivage et restauration ; rôles multiples et étiquettes libres ; validation et formatage des téléphones français ; premier lot de 12 contacts fictifs. |
| 1.2 | Contacts : recherche, filtres, doublons | terminée | 16/11/2026 | Recherche faite par la base (nom, prénom, société, téléphone sous tous ses formats, courriel, adresse), sans accent ni majuscule ; champ de recherche en haut de toutes les pages ; liste lue 50 fiches à la fois ; filtres combinables (rôle, étiquette, source, température) gardés pendant la session ; alerte de doublon à la création ; écran de fusion de deux fiches. Migrations `0003_contacts_recherche` et `0004_contacts_recherche_ajustements` appliquées sur le projet de test (la 0004 collée à la main dans l'éditeur SQL : elle ne figure pas dans l'historique des migrations de Supabase), puis toutes deux sur le projet réel. Mesures ci-dessous. |
| 1.3 | Contacts : consentement et RGPD | terminée | 16/11/2026 | Sur chaque fiche : origine et date de collecte, accord pour être appelé (oui, non, inconnu) avec date et preuve, client existant, opposition au démarchage, date du dernier contact calculée par la base. Sans accord, le bouton Appeler est remplacé par un avertissement ; on passe outre en indiquant un motif, enregistré. Export d'un contact en fichier texte ; suppression définitive en deux confirmations. Migrations `0005_contacts_consentement` et `0006_contacts_consentement_ajustements` appliquées sur le projet de test, puis sur le projet réel. Règles juridiques à faire valider par un juriste. |
| 1.4 | Biens : fiche et liste | terminée | 16/11/2026 | Biens de tous types (ancien, neuf, viager, commerce ou local, terrain) : liste lue 50 fiches à la fois, recherche par morceau d'adresse, filtres combinables (type, statut, fourchette de prix), création rapide (adresse et type), fiche détaillée et formulaire qui n'affichent que les champs du type, DPE et GES, archivage. Propriétaires liés au bien (plusieurs possibles, quote-part facultative), cliquables, et retrouvés sur la fiche du contact. Historique des prix tenu par la base. Six biens fictifs ajoutés aux données d'essai. Migration `0007_biens` appliquée sur le projet de test, puis sur le projet réel. |
| 1.5 | Biens : photos | à faire | | |
| 1.6 | Tâches et rendez-vous | à faire | | |
| 1.7 | Journal d'activité | à faire | | |
| 1.8 | Boucle de relance | à faire | | |
| 1.9 | Projets vendeurs et pipeline vendeur | à faire | | |
| 1.10 | Projets acquéreurs et pipeline acquéreur | à faire | | |
| 1.11 | Écran « Aujourd'hui » | à faire | | |
| 1.12 | Saisie rapide | à faire | | |
| 1.13 | Sauvegardes et export | à faire | | |
| 1.14 | Recette de la version 1 | à faire | | |

## Version 2 — Les dossiers

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 2.1 | Mandats | à faire | | |
| 2.2 | Échéances de mandat et suivi du vendeur | à faire | | |
| 2.3 | Transactions et pipeline transaction | à faire | | |
| 2.4 | Échéancier et checklist de transaction | à faire | | |
| 2.5 | Checklists de mise en vente | à faire | | |
| 2.6 | Automatisations de tâches | à faire | | |
| 2.7 | Rapprochement acquéreurs-biens | à faire | | |
| 2.8 | Modèles de messages | à faire | | |
| 2.9 | Synchronisation de l'agenda | à faire | | |
| 2.10 | Écran « Aujourd'hui » complet | à faire | | |
| 2.11 | Recette de la version 2 | à faire | | |

## Version 3 — Le pilotage

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 3.1 | Objectifs | à faire | | |
| 3.2 | Tableau de bord : effort | à faire | | |
| 3.3 | Tableau de bord : transformation et revenu | à faire | | |
| 3.4 | Sources, hygiène et revue du vendredi | à faire | | |
| 3.5 | Zones de prospection | à faire | | |
| 3.6 | Campagnes de prospection | à faire | | |
| 3.7 | Carte du secteur | à faire | | |
| 3.8 | Recette de la version 3 | à faire | | |

## Version 4 — Le confort

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 4.1 | Notes vocales transcrites | à faire | | |
| 4.2 | Résumé d'une fiche avant un appel | à faire | | |
| 4.3 | Envois groupés ciblés | à faire | | |
| 4.4 | Commissions et frais | à faire | | |
| 4.5 | Obligations personnelles | à faire | | |
| 4.6 | Rappels et hygiène des données | à faire | | |
| 4.7 | Recette finale et migration d'hébergement | à faire | | |

## Mesures de l'étape 1.2 — 30 000 contacts fictifs

Faites le 16/11/2026 sur le projet de test, avec 30 001 fiches, en se plaçant dans les conditions d'un compte connecté (règles d'accès par ligne actives). Les temps sont ceux de la base seule : il faut y ajouter l'aller-retour par Internet, en général 0,05 à 0,3 seconde selon le réseau.

| Opération | Temps de la base |
| --- | --- |
| Première page de la liste (50 fiches) | 11 ms |
| Dernière page de la liste (après 29 950 fiches) | 6 ms |
| Compter toutes les fiches actives | 4 ms |
| Recherche d'un nom (1 562 résultats) | 21 ms |
| Recherche de deux mots (prénom et nom) | 20 ms |
| Recherche d'un téléphone complet, ou de son début, écrit « 06… » ou « +33… » | 19 à 21 ms |
| Recherche d'un courriel, d'une adresse | 19 ms |
| Recherche sans aucun résultat | 19 ms |
| Quatre filtres combinés (rôle, étiquette, source, température) | 13 ms |
| Liste des étiquettes utilisées | 34 ms |
| Détection des doublons (téléphone, courriel, nom proche) | 140 à 160 ms (630 à 750 ms avant la migration 0004) |

Conclusion : l'objectif « moins d'une seconde » est tenu avec une large marge. La détection des doublons, seule opération qui s'en approchait, a été réécrite par la migration 0004 et répond maintenant en 0,15 seconde.

Ce que les mesures ont appris : avec les règles d'accès par ligne, la base vérifie d'abord à qui appartient chaque fiche, puis applique la recherche. Elle ne peut donc pas utiliser d'index de recherche « contient » : elle lit les fiches du compte une à une, ce qui reste très rapide à cette échelle (20 ms pour 30 000 fiches, donc de l'ordre de 70 ms pour 100 000). Les index de ce type créés par la migration 0003 ne servaient à rien ; la migration 0004 les a retirés. L'index de la liste alphabétique, lui, est bien utilisé.

Le script qui a créé ces fiches est `supabase/tests/contacts-fictifs-volume.sql` (projet de test uniquement). Les 30 000 fiches y restent pour vos essais ; la commande pour les retirer est en tête du script.

## Points à garder en tête

- Les règles juridiques et les chiffres de l'offre gratuite de Supabase cités dans le cadrage sont à vérifier (voir cadrage, sections Conformité et Architecture technique).
- Depuis l'environnement de Claude Code, Supabase n'est pas joignable par le réseau : la connexion a été vérifiée avec des réponses simulées, pas avec un vrai compte. La vérification réelle se fait sur le site publié.
- Supabase signale, sur le projet de test, que la protection contre les mots de passe compromis est désactivée (réglage d'Auth, hors migrations). À activer si l'offre le permet.
- Chaque étape qui crée une table liée aux contacts (biens, projets, tâches, journal) doit faire quatre choses : ajouter le transfert de ses lignes à la fonction de fusion (`fusionner_contacts`), poser `on delete cascade` sur son lien vers le contact (suppression définitive), s'ajouter à l'export d'un contact, et, si elle enregistre un échange, entrer dans le calcul de la date du dernier contact. Détail dans `docs/donnees.md`, « Consentement et RGPD des contacts ».
- Biens (étape 1.4) : changer le type d'un bien vide, à l'enregistrement, les champs propres à l'ancien type (un message le rappelle sous le champ Type).
- Biens : la surface de terrain n'existe que pour le type « Terrain », comme le prévoit le plan. Une maison avec jardin n'a donc pas de champ pour son terrain : à noter dans la description, ou à ajouter si le besoin se confirme.
- Biens : l'historique garde chaque prix enregistré, y compris une faute de frappe corrigée ensuite. Il n'y a pas d'écran pour retirer une ligne de l'historique.
- Biens : la suppression définitive d'un contact retire son lien de propriétaire, mais le bien et son adresse restent dans la base. À faire valider avec les autres règles RGPD : faut-il proposer d'archiver ou d'effacer aussi le bien ?
- Biens : le champ de recherche en haut de toutes les pages ne cherche que les contacts ; un bien se cherche depuis la page Biens.
- Consentement (étape 1.3), à faire valider par un juriste : qui est concerné par l'accord préalable (particuliers seulement ?), ce qui vaut preuve d'un accord, la portée exacte de l'exception « client existant », et si les SMS et courriels de prospection doivent être bloqués de la même façon (aujourd'hui seul l'appel l'est ; une opposition au démarchage n'est que signalée pour le SMS et le courriel).
- À la migration 0005, toutes les fiches déjà enregistrées passent en accord « inconnu » : leur bouton Appeler est remplacé par l'avertissement tant que l'accord n'est pas noté, fiche par fiche. Leur date de collecte est le jour de création de la fiche.
- La date du dernier contact ne connaît pour l'instant que la collecte, l'accord, l'opposition et les appels passés outre. Le journal d'activité (étape 1.7) la rendra fiable ; la purge des fiches inactives (repère : 3 ans) viendra ensuite.
- Enregistrer le motif d'un appel sans accord met à jour la date « modifiée le » de la fiche (la date du dernier contact y est recalculée).
- Une suppression définitive efface tout de la base, mais les sauvegardes automatiques de Supabase gardent les données jusqu'à leur expiration. Aucune liste des personnes effacées n'est conservée : rien n'empêche de recréer plus tard la fiche d'une personne qui avait demandé son effacement.
- Une fiche fusionnée reste archivée telle qu'elle était, avec un lien vers la fiche gardée. Il n'y a pas de bouton pour défaire une fusion.
- Le filtre par étiquette distingue majuscules et accents (« Investisseur » et « investisseur » sont deux étiquettes pour le filtre) ; la saisie évite déjà ce doublon sur une même fiche.
- L'alerte de doublon ne se déclenche qu'à la création, pas à la modification d'une fiche.
- Un contact se crée avec un nom seul : le téléphone est conseillé, pas obligatoire (un notaire peut n'avoir qu'un courriel).
- `npm audit` signale 7 alertes de niveau modéré dans des outils de développement (chaîne ESLint). Elles ne concernent pas le site publié ; à revoir lors d'une mise à jour des dépendances.
- L'installation sur l'écran d'accueil ne met rien en réserve dans l'appareil : sans réseau, l'application installée ne s'ouvre pas (choix du cadrage : pas de mode hors réseau).
