# ImmoCRM — Consignes du projet

Ce fichier est lu par Claude Code au début de chaque session. Il résume ce qu'il faut savoir pour travailler sur le dépôt. Il est écrit pour rester compréhensible sans être développeur.

## Le projet en deux phrases

ImmoCRM est le CRM personnel d'un mandataire immobilier : un seul utilisateur, sur téléphone, tablette et ordinateur. Il répond chaque matin à la question « qui dois-je contacter aujourd'hui, et pourquoi ? ».

Documents de référence :

- [docs/cadrage.md](docs/cadrage.md) — ce que l'outil doit faire (référence fonctionnelle).
- [docs/plan-developpement.md](docs/plan-developpement.md) — les 45 étapes de construction et leurs prompts.
- [docs/avancement.md](docs/avancement.md) — où en est le projet, étape par étape.

## Les trois règles du dépôt public

Le dépôt GitHub est public : tout ce qui y entre est visible par tous, pour toujours.

1. **Aucune donnée réelle de client.** Ni dans le code, ni dans un fichier d'exemple, ni dans une capture d'écran, ni dans un message de commit ou une pull request.
2. **Aucune clé d'administration Supabase** (clé `service_role`) dans le dépôt. Elle ne doit jamais être demandée ni collée dans une conversation. Les secrets vivent dans les réglages de GitHub ou de Supabase.
3. **Des données fictives pour les tests**, clairement fausses (noms, adresses et téléphones inventés).

**Seule la clé publique de Supabase est utilisée dans le code** (clé `anon` ou `publishable`). Elle est visible par tous dans le site publié, c'est normal : **la sécurité repose sur les règles d'accès par ligne** de chaque table, jamais sur le secret d'une clé ni sur un contrôle fait dans le navigateur. Une table sans règle d'accès est une faille.

L'adresse et la clé publique ne sont pas écrites dans le code : elles viennent des variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_CLE_PUBLIQUE` (fichier `.env.local` en développement pour le projet de test, variables du dépôt GitHub à la publication pour le projet réel ; modèle dans `.env.example`).

Les fichiers `.env` ne sont jamais suivis par git (voir `.gitignore`), à l'exception du modèle `.env.example`, qui ne contient aucune valeur.

## Choix techniques

Fixés par le plan de développement. Ne pas les changer sans accord explicite.

| Brique | Choix | Raison |
| --- | --- | --- |
| Application | React, TypeScript, Vite | Standard, produit un site statique |
| Interface | Tailwind CSS, composants maison simples | Trois tailles d'écran sans dépendance lourde |
| Navigation | Routage par ancre (`HashRouter`, adresses en `#/contacts`) | Fonctionne sur GitHub Pages sans configuration serveur |
| Données | Supabase (`supabase-js`), règles d'accès par ligne sur chaque table | La sécurité est portée par la base, pas par le site |
| Environnements | Deux projets Supabase : test (données fictives) et réel | Tester sans toucher aux vraies fiches |
| Connexion | Courriel et mot de passe (Supabase Auth), un seul compte, aucune inscription | Sans session, seul l'écran de connexion s'affiche |
| Tests | Vitest pour la logique, vérifications manuelles pour l'interface | Proportionné à un outil personnel |
| Déploiement | GitHub Actions vers GitHub Pages à chaque fusion dans `main` | Automatique, gratuit |

Principes qui en découlent :

- **Pas de serveur.** Tout le code s'exécute dans le navigateur ; il est lisible par tous.
- **Mobile d'abord.** Chaque écran est conçu pour le téléphone, puis adapté à la tablette et à l'ordinateur.
- **Peu de dépendances.** Avant d'ajouter une bibliothèque, vérifier qu'un composant maison simple ne suffit pas.
- **Périmètre.** Ne rien construire de ce que le cadrage exclut : rédaction des mandats et compromis, diffusion des annonces, signature électronique, facturation, location et gestion.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm install` | Installe les dépendances (à faire une fois, après avoir récupéré le dépôt) |
| `npm run dev` | Lance le site en local, avec rechargement automatique |
| `npm run lint` | Vérifie la qualité du code (ESLint) et sa mise en forme (Prettier) |
| `npm run test` | Lance les tests automatiques (Vitest) |
| `npm run build` | Vérifie les types puis construit le site dans `dist/`, pour le chemin `/ImmoCRM/` de GitHub Pages (`BASE_PATH=/ npm run build` pour un autre chemin) |
| `npm run preview` | Montre en local le site construit, tel qu'il sera publié |
| `npm run format` | Remet en forme le code automatiquement |

## Organisation des dossiers

| Dossier | Contenu |
| --- | --- |
| `src/pages` | Une page par écran de l'application |
| `src/components` | Composants d'interface réutilisables, sans logique métier |
| `src/lib` | Outils transverses : accès aux données (`supabase.ts`), dates, formatage |
| `src/features/<domaine>` | Tout ce qui est propre à un domaine métier (`contacts`, `biens`, `taches`…) |
| `supabase/migrations` | Fichiers SQL numérotés, appliqués par Claude Code via le connecteur Supabase |
| `.claude/skills` | Procédures que Claude Code suit (par exemple pour agir sur Supabase) |
| `docs` | Cadrage, plan, avancement et guides |

## Conventions de code

- **Langue.** L'interface est entièrement en français, messages d'erreur compris, sans jargon. Les termes métier gardent leur nom français dans le code, sans accent (`contact`, `bien`, `tache`, `projetVendeur`). Les commentaires sont en français.
- **TypeScript strict.** Pas de `any` ; les cas « valeur absente » sont traités explicitement.
- **Composants.** Fonctions React, un composant par fichier, fichier en `PascalCase.tsx`. Les autres fichiers sont en `kebab-case.ts`.
- **Logique séparée de l'affichage.** Les calculs (dates, relances, scores, validations) sont des fonctions pures dans `src/lib` ou `src/features/<domaine>`, chacune accompagnée de tests.
- **Tests.** Fichier `nom.test.ts` placé à côté du fichier testé. Toute règle métier calculée a son test.
- **Styles.** Classes Tailwind dans les composants ; pas de feuille de style séparée, sauf nécessité.
- **Mise en forme.** Prettier décide (sans point-virgule, guillemets simples, 100 caractères). Ne pas en débattre : lancer `npm run format`.
- **Version.** Le numéro affiché par l'application vient de `package.json`.
- **Commits.** Messages en français, à l'impératif ou au présent, qui disent ce que le changement apporte.

## Procédure de fin d'étape

À appliquer à la fin de chaque étape du plan, dans cet ordre :

1. Lancer `npm run lint`, `npm run test` et `npm run build`. Les trois doivent passer sans erreur ; sinon, corriger avant d'aller plus loin.
2. Mettre à jour `docs/avancement.md` : état de l'étape, date, une ligne de notes.
3. Faire un commit avec un message clair en français.
4. Pousser la branche de travail (`git push`).
5. Ouvrir une pull request vers `main`, qui résume ce qui a été fait.
6. Terminer la réponse par **la liste des vérifications que l'utilisateur doit faire lui-même** (la rubrique « À tester » de l'étape, plus toute action manuelle dans GitHub ou Supabase), en termes simples.

Rappel : une étape = une session = une pull request.

## Actions sur Supabase

Claude Code agit sur Supabase par le connecteur Supabase, en suivant la procédure de [.claude/skills/supabase/SKILL.md](.claude/skills/supabase/SKILL.md), à lire avant toute action.

- **Projet de test** : Claude Code applique lui-même les migrations et vérifie le résultat.
- **Projet réel** : Claude Code n'applique une migration qu'après un accord explicite de l'utilisateur, redonné à chaque fois, une fois l'étape validée sur le test. Il n'y lit jamais le contenu des fiches.
- Si le connecteur n'est pas disponible dans la session, l'utilisateur colle le SQL à la main dans l'éditeur SQL de Supabase.
