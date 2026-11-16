# ImmoCRM

CRM personnel pour mandataire immobilier : contacts, biens, pipelines vendeur et acquéreur, tâches et relances, écran « Aujourd'hui », journal d'activité.

Application web statique (GitHub Pages) connectée à Supabase.

## Documents

- [Analyse des besoins et cadrage](docs/cadrage.md)
- [Plan de développement, prompts étape par étape](docs/plan-developpement.md)
- [Avancement, étape par étape](docs/avancement.md)
- [Consignes du projet pour Claude Code](CLAUDE.md)

## Lancer le projet en local

Il faut Node.js 22 ou plus récent.

```bash
npm install     # une seule fois
npm run dev     # ouvre le site en local
npm run lint    # vérifie le code
npm run test    # lance les tests
npm run build   # construit le site dans dist/
```

## Publication du site

Le site est publié sur GitHub Pages, à l'adresse <https://pierrecyrildecrock.github.io/ImmoCRM/>.

Deux automatismes GitHub Actions s'en chargent (dossier `.github/workflows`) :

| Automatisme | Quand | Ce qu'il fait |
| --- | --- | --- |
| Vérification (`verification.yml`) | À chaque pull request | Lance lint, tests et build. Ne publie rien. |
| Déploiement (`deploiement.yml`) | À chaque fusion dans `main` | Lance lint, tests et build, puis publie le site. Si une vérification échoue, rien n'est publié et l'ancienne version reste en ligne. |

Le déploiement peut aussi être relancé à la main : onglet **Actions** → **Déploiement** → **Run workflow**.

Réglage à faire une seule fois dans GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

### Le chemin de base

Sur GitHub Pages, le site n'est pas à la racine de son adresse mais dans le sous-dossier `/ImmoCRM/`. Le site est donc construit par défaut pour ce sous-dossier. La variable `BASE_PATH` permet de choisir un autre chemin au moment de la construction :

```bash
npm run build                    # pour GitHub Pages : /ImmoCRM/
BASE_PATH=/ npm run build        # pour un site à la racine d'un nom de domaine
BASE_PATH=/crm/ npm run build    # pour un site dans le sous-dossier /crm/
```

`npm run preview` montre le site construit, tel qu'il sera publié. `npm run dev` n'est pas concerné : en local, le site reste à la racine.

### Migrer vers un autre hébergeur

Le site est un simple dossier de fichiers statiques : n'importe quel hébergeur web convient, sans configuration particulière. Les adresses internes sont en `#/...`, donc recharger une page ne provoque jamais d'erreur 404.

1. Construire le site avec le bon chemin : `BASE_PATH=/ npm run build` s'il sera à la racine du nom de domaine (par exemple `https://crm.exemple.fr/`).
2. Envoyer le contenu du dossier `dist/` chez l'hébergeur.
3. Vérifier que le site s'ouvre en `https://`.
4. Dans Supabase, remplacer l'ancienne adresse du site par la nouvelle (Authentication → URL Configuration), sans quoi la connexion ne fonctionnera plus.
5. Arrêter la publication sur GitHub Pages : **Settings → Pages → Unpublish site**, puis désactiver l'automatisme Déploiement (onglet **Actions** → **Déploiement** → **Disable workflow**).

Si l'envoi chez le nouvel hébergeur est automatisé plus tard avec GitHub Actions, le chemin se règle sans toucher au code : **Settings → Secrets and variables → Actions → Variables → New repository variable**, nom `BASE_PATH`, valeur `/`.

Le guide détaillé, pas à pas, sera rédigé à l'étape 4.7 du plan.

## Règles du dépôt (public)

- Aucune donnée réelle de client : ni fichier d'exemple, ni capture d'écran.
- Aucune clé d'administration Supabase dans le code ; seule la clé publique peut y figurer.
- Données fictives uniquement pour les tests.
