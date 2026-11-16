---
name: supabase
description: Procédure pour toute action sur Supabase dans ImmoCRM — appliquer une migration, vérifier les tables et les règles d'accès par ligne, générer les types TypeScript, consulter les journaux. À lire avant le premier appel à un outil `mcp__Supabase__*`.
---

# Agir sur Supabase

Les actions passent par le connecteur Supabase (outils `mcp__Supabase__*`). Si ces outils sont absents de la session, le dire à l'utilisateur (le connecteur se branche sur https://claude.ai/customize/connectors, puis nouvelle session) et lui donner le SQL à coller à la main dans l'éditeur SQL de Supabase. Ne jamais contourner avec une clé ou un mot de passe.

## Les deux projets

| Projet | Nom dans Supabase | Identifiant | Ce que Claude Code peut y faire |
| --- | --- | --- | --- |
| Test | Immo CRM | `pikagadwyntsebprgwns` | Tout ce que décrit cette procédure, sans demander |
| Réel | pas encore créé | — | Uniquement appliquer une migration, après accord explicite |

Avant chaque action, vérifier l'identifiant du projet visé. Si `list_projects` montre un projet qui n'est pas dans ce tableau, ne pas y toucher : demander à l'utilisateur ce que c'est, puis mettre ce tableau à jour.

## Appliquer une migration

1. Écrire le fichier SQL numéroté dans `supabase/migrations/`. Le fichier du dépôt est la référence : on n'applique jamais du SQL qui n'y figure pas.
2. Regarder l'existant sur le projet de test (`list_tables`, `list_migrations`) pour savoir ce qui est déjà en place.
3. Appliquer sur le projet de test avec `apply_migration`, en reprenant le nom et le contenu exacts du fichier.
4. Vérifier :
   - `list_tables` : les tables attendues existent et les règles d'accès par ligne sont activées sur chacune ;
   - `get_advisors` (sécurité) : aucune alerte nouvelle. Une table sans règle d'accès est une erreur à corriger, pas un avertissement à signaler.
5. Si la couche d'accès aux données utilise des types générés, les régénérer (`generate_typescript_types`) et les enregistrer dans le dépôt.
6. Dire dans la réponse finale ce qui a été appliqué, et sur quel projet.

Une migration déjà appliquée ne se modifie pas : toute correction passe par un nouveau fichier numéroté.

## Projet réel

Il contient les vraies fiches clients. Règles strictes :

- **Accord explicite à chaque fois.** N'y appliquer une migration qu'après que l'utilisateur l'a demandé dans la conversation en cours, une fois l'étape validée sur le projet de test. Un accord donné pour une migration ne vaut pas pour la suivante.
- **Ne jamais lire le contenu des tables.** Pas de `select` sur les données, pas de journaux contenant des données. Seules les vérifications de structure sont permises (`list_tables`, `list_migrations`, `get_advisors`).
- **Aucune modification ni suppression de données** en dehors de ce qu'une migration validée prévoit. Si une migration supprime une colonne ou une table, le signaler clairement avant de demander l'accord.
- Appliquer les migrations dans l'ordre, exactement telles qu'elles ont été appliquées sur le test.

## Ce qui reste interdit partout

- Demander, afficher ou enregistrer la clé d'administration (`service_role`) ou le mot de passe de la base. Seules l'adresse du projet et la clé publique (`get_project_url`, `get_publishable_keys`) ont leur place dans le site.
- Créer, mettre en pause ou supprimer un projet, créer une branche Supabase ou toute action payante, sans demande explicite de l'utilisateur.
- Mettre dans le dépôt, un commit ou une pull request un résultat de requête contenant des données réelles.
- Insérer des données fictives ailleurs que sur le projet de test.
