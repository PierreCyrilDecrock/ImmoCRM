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

## Règles du dépôt (public)

- Aucune donnée réelle de client : ni fichier d'exemple, ni capture d'écran.
- Aucune clé d'administration Supabase dans le code ; seule la clé publique peut y figurer.
- Données fictives uniquement pour les tests.
