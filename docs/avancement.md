# ImmoCRM — Avancement

Ce tableau suit les 45 étapes du [plan de développement](plan-developpement.md). Il est mis à jour à la fin de chaque étape.

États possibles : **à faire**, **en cours**, **terminée**. Une étape est « terminée » quand sa pull request est ouverte ; elle n'est réellement acquise qu'une fois vos vérifications faites et la pull request fusionnée dans `main`.

## Résumé

| Phase | Étapes terminées | État |
| --- | --- | --- |
| Phase 0 — Fondations | 5 sur 5 | terminée |
| Version 1 — Le quotidien | 0 sur 14 | à faire |
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
| 1.1 | Contacts : fiche et liste | à faire | | |
| 1.2 | Contacts : recherche, filtres, doublons | à faire | | |
| 1.3 | Contacts : consentement et RGPD | à faire | | |
| 1.4 | Biens : fiche et liste | à faire | | |
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

## Points à garder en tête

- Les règles juridiques et les chiffres de l'offre gratuite de Supabase cités dans le cadrage sont à vérifier (voir cadrage, sections Conformité et Architecture technique).
- Depuis l'environnement de Claude Code, Supabase n'est pas joignable par le réseau : la connexion a été vérifiée avec des réponses simulées, pas avec un vrai compte. La vérification réelle se fait sur le site publié.
- Supabase signale, sur le projet de test, que la protection contre les mots de passe compromis est désactivée (réglage d'Auth, hors migrations). À activer si l'offre le permet.
- Aucun lot de données fictives n'existe encore : le premier arrive avec les contacts (étape 1.1).
- `npm audit` signale 7 alertes de niveau modéré dans des outils de développement (chaîne ESLint). Elles ne concernent pas le site publié ; à revoir lors d'une mise à jour des dépendances.
- L'installation sur l'écran d'accueil ne met rien en réserve dans l'appareil : sans réseau, l'application installée ne s'ouvre pas (choix du cadrage : pas de mode hors réseau).
