# ImmoCRM — Système de design

Ce document décrit les briques d'interface disponibles. **Toute nouvelle page les réutilise** : on n'écrit pas un nouveau bouton ou une nouvelle carte si celui qui existe convient. Si un besoin n'est pas couvert, on complète le composant existant (ou on en ajoute un ici), puis on met ce document à jour.

Pour voir tous les composants à l'écran : dans l'application, **Plus → Composants de l'interface** (page `src/pages/Composants.tsx`, données inventées).

## Principes

- **Mobile d'abord.** Chaque écran est pensé pour le téléphone tenu d'une main, puis élargi.
- **44 px minimum** pour tout ce qui se touche (boutons, lignes, liens, croix de fermeture) : classe `min-h-11` ou `size-11`.
- **L'action principale est en bas** sur téléphone (navigation, boutons de formulaire, pied de fenêtre modale), là où le pouce arrive.
- **Texte de saisie en 16 px** (`text-base`) : en dessous, l'iPhone zoome sur le champ.
- **Tout en français**, sans jargon, messages d'erreur compris.
- **Clair et sombre** suivent le réglage de l'appareil, sans réglage dans l'application.

## Trois tailles d'écran

| Écran | Largeur | Navigation | Classes Tailwind |
| --- | --- | --- | --- |
| Téléphone | moins de 768 px | Barre en bas, 6 entrées | sans préfixe |
| Tablette | 768 à 1023 px | Colonne étroite à gauche (dessin + libellé) | `md:` |
| Ordinateur | 1024 px et plus | Colonne large à gauche, avec le nom de l'application | `lg:` |

L'application occupe exactement l'écran : le bandeau « Connexion perdue » (si besoin), la navigation, et la page, **seule zone qui défile**. Le contenu d'une page est limité à une colonne lisible (`max-w-5xl`), gérée par le composant `Page`.

## Couleurs

Les couleurs sont des noms, définis dans `src/index.css` avec une valeur claire et une valeur sombre. **Ne jamais écrire une couleur en dur** (`bg-white`, `text-slate-700`…) : le thème sombre ne suivrait pas.

| Nom | Usage | Exemples de classes |
| --- | --- | --- |
| `fond` | Fond général de l'application | `bg-fond` |
| `surface` | Fond des cartes, listes, champs, navigation | `bg-surface` |
| `creux` | Survol d'une ligne ou d'un bouton secondaire | `hover:bg-creux` |
| `bord` | Filets discrets, contour des cartes | `border-bord`, `ring-bord`, `divide-bord` |
| `bord-fort` | Contour des champs et des boutons secondaires | `border-bord-fort` |
| `encre` | Texte principal | `text-encre` |
| `encre-douce` | Texte secondaire, aides, dessins | `text-encre-douce` |
| `accent` | Action principale, liens, élément actif | `bg-accent`, `text-accent` |
| `accent-fort` | Survol de l'accent, texte sur `accent-doux` | `hover:bg-accent-fort` |
| `accent-doux` | Fond de l'entrée de navigation active, message d'information | `bg-accent-doux` |
| `sur-plein` | Texte posé sur `accent` ou `danger` | `text-sur-plein` |
| `danger` / `danger-doux` | Erreurs, actions destructrices | `text-danger`, `bg-danger-doux` |
| `succes` / `succes-doux` | Confirmations | `text-succes`, `bg-succes-doux` |
| `alerte` / `alerte-doux` | Avertissements (bandeau « Connexion perdue ») | `text-alerte`, `bg-alerte-doux` |

## Typographie

Police du système de l'appareil (aucun fichier à télécharger).

| Usage | Classes |
| --- | --- |
| Titre de page | `text-2xl font-bold tracking-tight` (`md:text-3xl`) — fourni par `Page` |
| Titre de carte ou de section | `text-lg font-semibold` — fourni par `Carte` |
| Texte courant, saisie, boutons | `text-base` |
| Texte secondaire, aide, erreur de champ | `text-sm` |
| Mentions (version) | `text-xs` |

## Composants

Tous sont dans `src/components`, un par fichier.

### Structure

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `MiseEnPage` | Coquille une fois connecté : navigation + page en cours. Déjà en place dans `App.tsx`, rien à faire. | — |
| `Navigation` | Barre du bas ou colonne de gauche. Les entrées sont dans `src/lib/navigation.ts` (six au maximum). | — |
| `Page` | Gabarit de **toute** page : titre, lien de retour, actions, contenu. Met aussi à jour le titre de l'onglet. | `titre`, `retour?` (`{ vers, libelle }`), `actions?` |
| `Carte` | Bloc de contenu sur fond `surface`. | `titre?` |
| `Liste` + `LigneListe` | Liste de lignes séparées par un filet. Une ligne ouvre une page (`vers`), lance une action (`onAction`) ou reste inerte. | `titre`, `detail?`, `icone?`, `fin?`, `vers?`, `onAction?` |
| `CadreConnexion` | Cadre des écrans hors session (connexion, mot de passe). | `titre` |

Ajouter une page : créer `src/pages/MaPage.tsx` qui renvoie un `<Page titre="…">`, puis déclarer sa route dans `App.tsx`, sous `MiseEnPage`. Une sous-page (`/plus/reglages`) garde l'entrée parente allumée dans la navigation et reçoit un `retour`.

```tsx
<Page titre="Contacts" actions={<Bouton icone="ajouter">Ajouter</Bouton>}>
  <Liste>
    <LigneListe titre="Camille Fictif" detail="Vendeur" vers="/contacts/1" />
  </Liste>
</Page>
```

### Actions et saisie

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `Bouton` | Bouton d'action. `principal` (un seul par écran), `secondaire`, `discret` (action de faible poids), `danger` (suppression). | `variante?`, `pleineLargeur?`, `icone?`, plus celles d'un bouton HTML |
| `ChampSaisie` | Champ sur une ligne : texte, courriel, téléphone, date, nombre. | `libelle`, `aide?`, `erreur?`, plus celles d'un champ HTML |
| `ChampTexteLong` | Champ sur plusieurs lignes : note, compte rendu. | `libelle`, `aide?`, `erreur?`, `rows?` |
| `ChampChoix` | Liste déroulante (sélecteur natif du téléphone). | `libelle`, `options` (`{ valeur, libelle }`), `optionVide?`, `aide?`, `erreur?` |

Un formulaire est une colonne `flex flex-col gap-4` ; sur grand écran, une grille `grid gap-4 md:grid-cols-2`. Le bouton d'envoi est en bas, en `pleineLargeur` sur téléphone. Renseigner `type`, `inputMode` et `autoComplete` pour que le téléphone propose le bon clavier.

### Fenêtre modale

`FenetreModale` : plein écran sur téléphone, centrée au-delà. Se ferme par la croix, la touche Échap ou un clic à côté. Les boutons vont dans `pied`, fixé en bas ; mettre l'action principale en premier.

```tsx
<FenetreModale
  ouverte={ouverte}
  titre="Nouvelle tâche"
  onFermer={() => setOuverte(false)}
  pied={
    <>
      <Bouton pleineLargeur onClick={enregistrer}>Enregistrer</Bouton>
      <Bouton variante="secondaire" pleineLargeur onClick={() => setOuverte(false)}>Annuler</Bouton>
    </>
  }
>
  …champs…
</FenetreModale>
```

### Messages

| Besoin | Outil |
| --- | --- |
| Message qui reste dans la page ou le formulaire (erreur de saisie, information) | `<Message genre="erreur | succes | info">` |
| Confirmation passagère après une action (« Contact enregistré ») | `useNotifications().notifier('succes', '…')` : disparaît seule après 4 secondes |
| Échec d'une action, signalé par-dessus la page | `useNotifications().notifier('erreur', '…')` : reste jusqu'à fermeture |
| Erreur sur un champ précis | propriété `erreur` du champ |

Un message d'erreur dit ce qui s'est passé et quoi faire, en français courant (« L'enregistrement a échoué. Vérifiez votre connexion, puis réessayez. »), jamais un code technique.

### Étiquettes

`<Etiquette genre="neutre | info | succes | alerte | danger">` : petite pastille de texte qui qualifie un élément (un état, une catégorie, « Projet de test uniquement »). Jamais cliquable : pour une action, utiliser un `Bouton`.

### États

| Composant | Quand | Propriétés |
| --- | --- | --- |
| `EtatChargement` | Une page ou une liste attend ses données. | `libelle?` |
| `EtatVide` | Rien à afficher : dire ce qui apparaîtra et proposer l'action pour commencer. | `titre`, `icone?`, `action?`, texte en contenu |
| `BandeauHorsLigne` | Affiche « Connexion perdue » tant que le réseau manque. Déjà en place dans `App.tsx`. Pour connaître l'état du réseau ailleurs : `useEnLigne()` (`src/lib/etat-reseau.ts`). | — |

### Dessins

`<Icone nom="…" />` : petits dessins au trait, de la couleur du texte voisin. Noms disponibles : `aujourdhui`, `contacts`, `biens`, `pipelines`, `taches`, `plus`, `reglages`, `palette`, `chevron`, `retour`, `fermer`, `ajouter`, `succes`, `erreur`, `info`, `horsLigne`, `vide`. Pour en ajouter un, compléter `src/components/Icone.tsx`. Un dessin seul dans un bouton exige un `aria-label`.

## Installation sur l'écran d'accueil

- `public/manifest.webmanifest` : nom, couleurs, icônes. Les chemins y sont relatifs, pour fonctionner quel que soit le chemin de base du site.
- `public/favicon.svg` et `public/icones/` : icône de l'application (192 et 512 px, version « masquable » pour Android, version Apple).
- `index.html` : lien vers le manifeste, icône Apple, couleur de thème claire et sombre.

Il n'y a **pas de mode hors réseau** (aucun fichier n'est mis en réserve dans l'appareil) : sans réseau, l'application affiche le bandeau et les enregistrements échouent.
