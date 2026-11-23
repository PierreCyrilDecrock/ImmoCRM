# ImmoCRM — Système de design

Ce document décrit les briques d'interface disponibles. **Toute nouvelle page les réutilise** : on n'écrit pas un nouveau bouton ou une nouvelle carte si celui qui existe convient. Si un besoin n'est pas couvert, on complète le composant existant (ou on en ajoute un ici), puis on met ce document à jour.

Pour voir tous les composants à l'écran : dans l'application, **Plus → Composants de l'interface** (page `src/pages/Composants.tsx`, données inventées).

## Principes

**Le style (version 3, novembre 2026).** Un fond gris chaud, des cartes blanches au contour léger, une encre presque noire et **un seul bleu vif** réservé à l'action principale. Les choix allumés (pastilles, rôles) sont en noir, pour ne pas concurrencer le bleu. Beaucoup d'air, des titres serrés, des arrondis francs. Les maquettes de référence sont dans le canevas « ImmoCRM — nouveau style » (rangée « Version 3 »).

- **Mobile d'abord.** Chaque écran est pensé pour le téléphone tenu d'une main, puis élargi.
- **44 px minimum** pour tout ce qui se touche (boutons, lignes, liens, croix de fermeture) : classe `min-h-11` ou `size-11`.
- **L'action principale est en bas** sur téléphone (navigation, boutons de formulaire, pied de fenêtre modale), là où le pouce arrive.
- **Texte de saisie en 16 px** (`text-base`) : en dessous, l'iPhone zoome sur le champ.
- **Tout en français**, sans jargon, messages d'erreur compris.
- **Clair et sombre** suivent le réglage de l'appareil, sans réglage dans l'application.
- **Contrastes vérifiés** dans les deux thèmes : texte courant au moins 4,5:1 sur son fond, contours des champs au moins 3:1. Une couleur qui distingue deux états diffère aussi en clarté, pas seulement en teinte.
- **Le clavier se voit.** Tout élément atteint avec Tab porte un contour bleu (règle commune dans `src/index.css`) ; la souris et le doigt ne l'affichent pas.
- **Les petits détails comptent** : les compteurs et les heures en chiffres de même largeur (classe `tabular-nums`, à ne pas mettre sur un texte courant : elle élargit le tiret d'Inter) ; un état vide dit quelque chose de positif ; une action qui n'apparaît qu'au survol sur ordinateur reste visible sur téléphone (`@media (hover: none)`) et au clavier (`focus-within`).

## Trois tailles d'écran

| Écran | Largeur | Navigation | Classes Tailwind |
| --- | --- | --- | --- |
| Téléphone | moins de 768 px | Barre en bas, 6 entrées | sans préfixe |
| Tablette | 768 à 1023 px | Colonne étroite à gauche (dessin + libellé) | `md:` |
| Ordinateur | 1024 px et plus | Colonne large à gauche : nom, recherche, entrées, fiches récentes, « Créer », état | `lg:` |

L'application occupe exactement l'écran : le bandeau « Connexion perdue » (si besoin), la navigation, et la page, **seule zone qui défile**. Le contenu d'une page est limité à une colonne lisible (`max-w-5xl`), gérée par le composant `Page` ; seule la page Pipelines, dont le tableau a besoin de place sur ordinateur, prend toute la largeur (`large`, jusqu'à `max-w-[100rem]`).

## Couleurs

Les couleurs sont des noms, définis dans `src/index.css` avec une valeur claire et une valeur sombre. **Ne jamais écrire une couleur en dur** (`bg-white`, `text-slate-700`…) : le thème sombre ne suivrait pas.

Repères : fond `#f6f6f3` (sombre `#0d0e11`), surface `#ffffff` (`#17181c`), encre `#0e0f12` (`#f2f2f0`), accent `#3d3af5` (`#8c8aff`). Les autres valeurs sont dans `src/index.css`.

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
| `inverse` | Fond encre de la carte « Maintenant » : presque noir en clair (`#0e0f12`), gris foncé en sombre (`#2a2b31`) | `bg-inverse` |
| `inverse-creux` | Boutons et filets posés sur `inverse` | `bg-inverse-creux` |
| `sur-inverse` / `sur-inverse-doux` | Texte principal et secondaire sur `inverse` (au moins 7:1 dans les deux thèmes) | `text-sur-inverse` |
| `bord-inverse` | Contour de la carte : invisible en clair, filet plus clair en sombre pour la détacher du fond | `ring-bord-inverse` |

Un bloc sur fond `inverse` porte aussi la classe `zone-inverse` (règle de `src/index.css`) : le contour du clavier y passe du bleu au blanc, pour rester visible.

## Arrondis et ombres

Les arrondis de Tailwind sont agrandis dans `src/index.css` (bloc `@theme`), pour que tous les écrans suivent :

| Classe | Taille | Usage |
| --- | --- | --- |
| `rounded-lg` | 12 px | Boutons, champs, onglets |
| `rounded-xl` | 16 px | Petits blocs, cartes du pipeline, messages, capsule d'onglets |
| `rounded-2xl` | 20 px | Cartes, listes, grosses touches d'action |
| `rounded-3xl` | 28 px | Fenêtres modales et menu de création sur grand écran |
| `rounded-full` | — | Pastilles, étiquettes, compteurs |

Les cartes se détachent par un **contour d'un pixel** (`ring-1 ring-bord`), pas par une ombre. L'ombre est réservée à ce qui flotte (fenêtres, bouton « + », onglet actif) et au bouton principal (`shadow-sm shadow-accent/25`).

## Typographie

Police **Inter**, servie avec le site (paquet `@fontsource-variable/inter`, importé dans `src/index.css`) : aucun appel à un service extérieur, le même rendu sur iPhone, Android et ordinateur. Si elle manque, la police du système prend le relais.

| Usage | Classes |
| --- | --- |
| Titre de page | `text-[1.75rem] font-bold tracking-tight` (`md:text-4xl`) — fourni par `Page` |
| Titre de carte ou de section | `text-lg font-semibold tracking-tight` — fourni par `Carte` |
| Texte courant, saisie, boutons | `text-base` |
| Texte secondaire, aide, erreur de champ | `text-sm` |
| Mentions (version) | `text-xs` |

## Composants

Tous sont dans `src/components`, un par fichier.

Des composants propres à un domaine vivent dans `src/features/<domaine>` et se réutilisent d'un écran à l'autre : pour les tâches, `ListeTaches` (lignes avec case à cocher, report et ouverture), `FormulaireTache`, `ReportTache` et `SectionTaches` (rubrique d'une fiche) ; pour le journal, `SectionJournal` (rubrique d'une fiche : un bouton par type pour consigner, puis le fil), `FilActivites` (fil regroupé par jour) et `FormulaireActivite` ; pour la boucle de relance, `BoucleRelance` (l'écran en trois temps ouvert en cochant une tâche liée à un contact) et `ProchaineAction` (en-tête de la fiche Contact) ; pour la prochaine tâche d'une fiche Bien ou Projet, `ProchaineTacheFiche`, qui partage avec `ProchaineAction` la carte `CarteProchaineTache` ; pour choisir une fiche, `SelecteurContact` et `SelecteurBien`, réunis avec l'affichage du lien dans `ChoixLiens` (rubrique « Liée à » des formulaires de tâche et d'activité, y compris le projet de vente) ; pour les projets vendeurs, `TableauPipeline` (colonnes par étape avec glisser-déposer par une poignée sur tablette et ordinateur, liste groupée par étape sur téléphone), `CarteProjet`, `SectionProjetsVendeurs` (rubrique des fiches Contact et Bien), `NouveauProjetVendeur`, `FenetrePassage` (ouverte par `useChangementEtape` quand un critère de sortie manque), `SortieProjet` et `FormulaireProjetVendeur`. `SectionTaches` et `SectionJournal` acceptent aussi un projet (`projet={…}`).

Les gestes sur une tâche (cocher avec la boucle de relance, reporter, ouvrir, rouvrir) et leurs fenêtres viennent du crochet `useGestesTache` (`src/features/taches/gestes-tache.tsx`) : `ListeTaches` s'en sert, et tout écran qui affiche des tâches à sa façon aussi (il place `gestes.fenetres` une fois sous ses listes).

**Écran Aujourd'hui** (`src/features/aujourdhui/`). En tête (étape D.3) : la date avec la semaine (`formaterJourEtSemaine`, `src/lib/dates.ts`), « Bonjour » et le nom affiché (Réglages) comme titre de page (l'onglet garde « Aujourd'hui », `titreOnglet`), la phrase de résumé (`resumeJournee`) et `AnneauProgression` (« 3 sur 7 faits » : les tâches et relances prévues aujourd'hui ou en retard, plus celles faites aujourd'hui ; caché s'il n'y a rien de prévu ; une phrase équivalente est lue par les lecteurs d'écran et annoncée quand elle change). Puis `CarteMaintenant` (fond `inverse`) : le rendez-vous en cours ou le prochain, son temps restant, son horaire, le contact et son rôle, l'adresse, les gestes Itinéraire, Appeler (`BoutonAppel` avec `surInverse`) et la fiche du bien (ou du contact), et « À préparer » (tâches du jour liées au même contact ou bien, à cocher) ; après le dernier rendez-vous, la première relance (Appeler, Consigner, fiche) ; plus rien, elle disparaît. Sur ordinateur, `TroisActions` se range à sa droite ; dessous sur téléphone et tablette. Dans l'agenda, `TraitMaintenant` (trait rouge avec l'heure) se place devant le premier rendez-vous pas encore commencé, et les rendez-vous finis s'estompent (`LigneRendezVous` avec `passe` : titre et heure en `encre-douce`, sans baisser l'opacité, pour garder le contraste). Les calculs sont des fonctions pures testées dans `maintenant.ts` (`choisirMaintenant`, `tempsRestant`, `placeDuTrait`, `aPreparer`, `resumeJournee`, `progression` ; un rendez-vous sans durée compte une demi-heure). L'heure vient de `useMaintenant` (`src/lib/horloge.ts`), remise à jour au début de chaque minute et au retour dans l'application, sans relire la base. Bloc **« À rappeler »** (étape D.4), sous-titré « La plus urgente en premier » : une commande segmentée Tous, Vendeurs, Acquéreurs (`Onglets`, d'après les rôles du contact, gardée sur l'appareil) ; le compteur du bloc suit le filtre (« 12+ » si toutes les relances n'ont pas pu être lues) ; dix lignes d'emblée, puis « Afficher les 10 autres » (le bouton reste en place pour replier). `LigneRelance` : les initiales dans une pastille ronde, le nom et le rôle l'un sous l'autre (un seul lien vers la fiche ; « Prospect » sans rôle), le retard en pastille rouge à droite (« En retard · 2 j », lu « En retard de 2 jours » ; rien pour une relance du jour), le motif (titre de la tâche) en texte principal avec le motif détaillé dessous, puis « Dernier échange il y a 8 jours · rendez-vous ». Dessous, sur toute la largeur sur téléphone : « Appeler », « Consigner » et, sur écran tactile, « Reporter » (dessin seul sur téléphone, fenêtre de report) ; la ligne se glisse (`LigneGlissable` : « Reporter » ouvre la fenêtre, « Fait » la boucle de relance). Sur ordinateur (`@media (hover: hover)`), « Reporter » laisse la place à `ReportsRapides` et à « Fait », qui apparaissent au survol ou au clavier (`VISIBLE_AU_SURVOL`). Bloc **Tâches** : deux groupes, « En retard » (titre rouge) puis « Aujourd'hui », avec leur nombre ; `LigneTache` y reçoit `echeanceADroite` (« Hier », « mar. 17 nov. », « 17 h 30 » en chiffres alignés, rouge en retard ; rien pour une tâche du jour sans heure) et `glissable` (la ligne se glisse sans la rangée de reports). L'ordre (`parUrgence` : échéance, priorité, heure, ancienneté), le filtre (`filtrerRappels`, `compteurRappels`, `videRappels`), les groupes (`grouperTaches`, `echeanceADroite`), la ligne (`rolesDuContact`, `pastilleRetard`, `dernierEchange`) et l'affichage en deux temps (`premieresRelances`) sont des fonctions pures testées dans `ordre-journee.ts`. Les autres composants : `BlocJournee` (bloc repliable avec son titre, un `sousTitre` facultatif, son compteur — vert à zéro, rouge en cas de retard, « 12+ » avec `compteurPartiel` — un `filtre` posé en tête du contenu et gardé même à zéro, et un message positif quand il est vide ; les blocs repliés sont gardés sur l'appareil), `TroisActions` (les trois actions qui comptent, enregistrées en quittant le champ), `LigneRendezVous`, `LigneAlerte`, `LigneNouveaute`, `CaseTache` (la case ronde qui clôt une tâche ; `inverse` sur la carte) et `BoutonAppel` (« Appeler » qui respecte l'accord pour être appelé : sans accord, il mène à la fiche).

**Saisie rapide** (`src/features/saisie/`) : `SaisieRapide` (le bouton « + » flottant, en bas à droite de toutes les pages sur téléphone et tablette, son menu, ses fenêtres et les raccourcis clavier ; placé une fois par `MiseEnPage`), `BoutonCreer` (« Créer », avec son rappel N, en bas de la colonne sur ordinateur : il ouvre le même menu par `ouvrirMenuCreation`, `ouverture.ts`), `MenuCreation` (feuille qui monte du bas sur téléphone, fenêtre près du « + » sur tablette, près de « Créer » sur ordinateur : fiches récentes, puis les cinq créations ; à la fermeture, le clavier revient au bouton qui l'a ouvert), `RecentesColonne` (« Consultés récemment » dans la colonne sur ordinateur : les trois dernières fiches, avec les initiales d'un contact, `initialesDe`, ou le dessin d'un bien ou d'un projet), `ContactExpress` et `CompteRenduExpress` (les deux écrans express), `ConsignerEchange` (le même compte rendu posé dans la fiche Contact, voir « Fiches »), `ChampsProchaineAction` (titre et date proposés, raccourcis de date, « Ne rien prévoir » ; `compacte` : titre et date en texte, raccourcis, « Modifier » déplie le titre et le calendrier), `GroupePastilles` (pastilles avec leur nom au-dessus) et `FichesRecentes` (liste des fiches consultées récemment). Une nouvelle fiche (page de détail) se note dans les récentes avec `useConsultation(…)` (`recents.ts`), dès qu'elle est lue. Le champ de recherche d'une page reçoit `data-raccourci-recherche` pour que « / » et Ctrl+K y mènent : le raccourci choisit le champ visible, celui de la page (liste des contacts) avant celui du bandeau ou de la colonne.

**Recherche globale** (`src/features/recherche/`) : `BarreRecherche` place `RechercheGlobale` en bandeau en haut de la page sur téléphone et tablette (`disposition="bandeau"`, sauf sur la liste des contacts, qui a son champ), et en tête de la colonne sur ordinateur (`disposition="colonne"`, sur toutes les pages : son champ rappelle « ⌘K » ou « Ctrl K » selon le système, `rappelRecherche` dans `src/lib/clavier.ts`, et ses résultats s'ouvrent par-dessus la page).

**Pastille des retards** (`src/features/taches/`) : `useTachesEnRetard` (`suivi-retards.ts`) compte les tâches en retard en une seule requête légère (`compterTachesEnRetard`, `retards.ts`, qui ne lit aucune ligne), et recompte après chaque enregistrement (tâche cochée, reportée, créée…), au retour dans l'application et au retour du réseau. `pastilleRetards` donne le texte (« 9+ » au-delà de neuf) et l'annonce (« 3 en retard »). Le tout est composé dans `App.tsx` (`Coquille`).

**Raccourcis clavier** (ordinateur, ou tablette avec clavier), quand le curseur n'est pas dans un champ : `/` ou Ctrl+K (⌘K, qui marche aussi depuis un champ) pour la recherche, `N` pour le menu de création, `C` contact, `A` activité, `T` tâche, `B` bien, `D` demande entrante. Ils sont rappelés dans le menu sur grand écran. Sur les quatre fiches (Contact, Bien, projet de vente, projet d'achat) : `1` à `4` changent d'onglet (`5` pour Infos de la fiche Contact, sous 1024 px) ; `J` et `K` passent à la fiche suivante ou précédente (quand on vient de la liste des contacts, de celle des biens ou d'une colonne du pipeline). Dans la galerie des photos d'un bien, les flèches gauche et droite passent d'une photo à l'autre. Ils ne jouent pas quand une fenêtre ou le menu « … » est ouvert.

**Glisser-déposer.** Fait avec les événements du pointeur (souris, doigt, stylet) : la carte se saisit par sa poignée (dessin `poignee`, 44 px), la colonne visée s'allume, Échap annule, le tableau défile seul près de ses bords. Le même changement reste possible sans glisser, d'un toucher sur l'étape dans la fiche du projet.

### Structure

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `MiseEnPage` | Coquille une fois connecté : navigation + page en cours, et le bouton flottant de la saisie rapide. Elle réserve aussi, sous la page sur téléphone, la place d'une barre d'actions de fiche (`BarreActionsFiche`, contexte `BarreBasContexte` de `barre-bas.ts`) : tant qu'une barre l'occupe, la navigation du bas et le « + » s'effacent sur téléphone. Déjà en place dans `App.tsx` (`Coquille`), rien à faire. Le bandeau du haut (`enTete`, la recherche) ne s'affiche que sur téléphone et tablette quand la colonne reçoit sa propre recherche. Le bas de chaque page garde une marge pour que le bouton « + » ne cache pas la dernière ligne (sauf sur ordinateur, où « Créer » le remplace). La zone de page sert de repère (`relative`) : un élément placé en absolu, comme un texte `sr-only`, reste dans ce qui défile. | `enTete?`, `colonne?` (`{ recherche, suite, pied }`, ordinateur), `pastilles?`, `flottant?` (reçoit de quoi faire relire la page) |
| `Navigation` | Barre du bas (translucide, l'entrée active repérée par une capsule bleue autour de son dessin) ou colonne de gauche (l'entrée active en blanc). Sur tablette, colonne étroite : les six entrées. Sur ordinateur, colonne large, de haut en bas : le nom, la recherche, les six entrées, « Consultés récemment », puis, fixés en bas, « Créer », l'état des enregistrements et la version ; seul le milieu défile sur un écran peu haut. Une pastille (`{ texte, annonce }`, rangée par adresse) est un nombre rouge sur tablette et ordinateur, un point rouge sur téléphone ; le lien est lu « Tâches, 3 en retard ». Les entrées sont dans `src/lib/navigation.ts` (six au maximum). | `recherche?`, `suite?`, `pied?`, `pastilles?` |
| `EtatEnregistrement` | Bas de la colonne sur ordinateur : un point et « Tout est enregistré » (vert), « Enregistrement… » (bleu, pendant une écriture : compteur de `src/lib/donnees.ts`) ou « Connexion perdue » (ambre), puis la version (`package.json`). Pas d'annonce aux lecteurs d'écran : les messages et le bandeau le disent déjà. | — |
| `Page` | Gabarit de **toute** page : titre, lien de retour, actions, contenu. Met aussi à jour le titre de l'onglet. | `titre`, `retour?` (`{ vers, libelle }`), `actions?`, `large?` (toute la largeur : tableaux), `surtitre?` (ligne au-dessus du titre), `titreOnglet?` (si l'onglet doit dire autre chose que le titre), `finRetour?` (à droite du lien de retour : « 12 sur 48 » et les flèches), `enTete?` (remplace la ligne du titre ; la page y place alors son propre `h1`, ou `null` si le `h1` est ailleurs) |
| `Carte` | Bloc de contenu sur fond `surface`. | `titre?` |
| `Liste` + `LigneListe` | Liste de lignes séparées par un filet. Une ligne ouvre une page (`vers`), lance une action (`onAction`) ou reste inerte. | `titre`, `detail?`, `icone?`, `vignette?` (petite photo carrée à gauche ; `null` : le dessin `icone` tient la place), `fin?`, `vers?`, `etat?` (gardé dans l'historique avec la page ouverte : la liste des contacts y range sa recherche), `onAction?` |
| `Information` | Une information d'une fiche : son nom, sa valeur, et un petit geste facultatif après la valeur (`BoutonCopier`), qui n'apparaît qu'au survol de la ligne sur ordinateur. À placer dans une liste `<dl className="divide-y divide-bord">`. | `nom`, `fin?`, `empilee?` (le nom toujours au-dessus, pour une colonne étroite), valeur en contenu |
| `SuiteListe` | Bas d'une liste lue page par page : charge la suite à l'approche du bas de l'écran, avec un bouton de secours. Se branche sur `useListePaginee` (`src/lib/liste-paginee.ts`). | `resteALire`, `suiteEnCours`, `erreurSuite`, `chargerSuite` |
| `CadreConnexion` | Cadre des écrans hors session (connexion, mot de passe). | `titre` |
| `TableauPipeline` | Tableau d'un pipeline : liste groupée par étape sur téléphone, une colonne par étape sur tablette et ordinateur, cartes à glisser par leur poignée vers une autre colonne. Sans logique métier : sert aux pipelines vendeur et acquéreur. | `colonnes` (`{ etape, libelle, critere, projets }`), `cle`, `etapeDe`, `estEtape`, `nomGlisse`, `carte(projet, { estompee, onSaisir? })`, `onDeposer`, `enCours` |
| `CartePipeline` | Carte d'un projet dans un pipeline : titre, détails, ancienneté dans l'étape (en alerte si elle traîne), prochaine action (en rouge si en retard), poignée sur grand écran. | `vers`, `titre`, `details`, `etape`, `action` (`{ texte, alerte }`), `onSaisir?`, `estompee?`, `etat?` (gardé dans l'historique avec la fiche : la colonne, pour le projet précédent ou suivant) |

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
| `Bouton` | Bouton d'action. `principal` (bleu plein, un seul par écran), `secondaire` (blanc, contour léger), `discret` (texte bleu, action de faible poids), `danger` (suppression), `inverse` (sur le fond encre de la carte « Maintenant »). | `variante?`, `pleineLargeur?`, `icone?`, plus celles d'un bouton HTML |
| `ChampSaisie` | Champ sur une ligne : texte, courriel, téléphone, date, nombre. | `libelle`, `aide?`, `erreur?`, plus celles d'un champ HTML |
| `ChampTexteLong` | Champ sur plusieurs lignes : note, compte rendu. Le micro du clavier du téléphone permet de dicter. | `libelle`, `aide?`, `erreur?`, `rows?` |
| `ChampRecherche` | Champ de recherche : loupe, saisie, croix pour effacer. Pas de libellé visible. Champ vide, il peut rappeler son raccourci à droite (« ⌘K »). | `libelle` (lu par les lecteurs d'écran), `valeur`, `onChange(valeur)`, `rappel?`, plus celles d'un champ HTML |
| `ChampChoix` | Liste déroulante (sélecteur natif du téléphone). | `libelle`, `options` (`{ valeur, libelle }`), `optionVide?`, `aide?`, `erreur?` |
| `ChoixMultiple` | Plusieurs choix parmi quelques valeurs (les rôles d'un contact) : des pastilles à toucher, qui s'allument en noir. | `libelle`, `options`, `valeurs`, `onChange`, `aide?` |
| `Pastille` | Une pastille à toucher, allumée en noir quand elle est choisie : un choix en un geste (type d'activité, résultat d'un appel, température, raccourci de date). À grouper dans un `fieldset` avec sa `legend`, ou un `div role="group"` avec `aria-label`. | `choisie`, `onClick`, contenu |
| `ChampEtiquettes` | Étiquettes libres : on écrit, on valide par « Entrée », une virgule ou « Ajouter » ; on touche une étiquette pour la retirer. | `libelle`, `etiquettes`, `onChange`, `ajouter` (règle de nettoyage et de doublon), `aide?` |
| `Onglets` | Vues d'une même liste (En retard, Aujourd'hui…) : une commande segmentée (capsule grise, l'onglet choisi en blanc), avec un compteur facultatif. Sur téléphone, la capsule défile de côté et ramène l'onglet choisi dans la partie visible. | `libelle`, `options` (`{ valeur, libelle, compteur? }`), `valeur`, `onChange`, `panneau?` (identifiant du panneau commandé, voir `OngletsFiche`) |
| `ChoixSegmente` | Un choix parmi quelques valeurs, enregistré d'un toucher (la température) : même capsule que `Onglets`, lue comme des boutons radio ; les flèches du clavier passent d'un choix à l'autre. | `libelle`, `options`, `valeur` (`null` : aucun allumé), `onChange`, `desactive?` |
| `MenuActions` | Le bouton « … » et son menu, pour les actions rares d'une fiche. Le menu s'ouvre par-dessus la page (une colonne qui défile ne le coupe pas), sous le bouton ou au-dessus s'il manque de place (`placerMenu`, `src/lib/placement.ts`), et suit le bouton si la page défile. Flèches, Entrée, Échap ; un toucher à côté le referme. Une action destructrice est en rouge, à la fin. | `libelle`, `elements` (`{ libelle, icone, onChoisir, danger?, desactive? }`) |
| `LienAction` | Grosse touche qui ouvre une autre application du téléphone (`tel:`, `sms:`, `mailto:`, cartes). Avec `onClick` (et sans `href`), c'est un bouton de l'application (« Consigner »). Sans l'un ni l'autre, elle reste visible mais grisée. Dans un groupe, une seule est `principal` (Appeler, en bleu) ; les autres sont `secondaire` (blanches). | `libelle`, `icone`, `href?`, `onClick?`, `variante?`, `nouvelOnglet?`, `annonce?` (ce qu'entend un lecteur d'écran à la place du libellé : « Appel bloqué : … ») |
| `LienBouton` | Lien à l'allure d'un petit bouton (44 px), pour les gestes d'une ligne de liste : ouvrir une fiche (`vers`), appeler ou lancer l'itinéraire (`href`, avec `nouvelOnglet` pour les cartes). | `icone`, `vers?` ou `href?`, `variante?` (`secondaire`, `discret`, `principal` : bleu plein, `inverse` : sur fond encre), `nouvelOnglet?`, `onClick?` |

Une `LigneListe` coupe un texte trop long : placée dans une grille, son conteneur doit porter `min-w-0`, sinon la page s'élargit sur téléphone.

Un formulaire long (la modification d'un contact) est découpé en `Carte`, une par thème ; à l'envoi, le premier champ en erreur est amené à l'écran.

Un formulaire est une colonne `flex flex-col gap-4` ; sur grand écran, une grille `grid gap-4 md:grid-cols-2`. Le bouton d'envoi est en bas, en `pleineLargeur` sur téléphone. Renseigner `type`, `inputMode` et `autoComplete` pour que le téléphone propose le bon clavier.

### Gestes rapides

Trois gestes communs, construits à l'étape D.1 et réutilisés par les écrans de la phase D. **Règle : chaque geste rapide a un équivalent visible** ; le glisser n'est jamais le seul chemin.

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `ReportsRapides` (`src/features/taches/`) | Rangée « Demain », « Dans 3 jours », « Lundi » (le prochain lundi après aujourd'hui) et un calendrier. Un toucher reporte aussitôt, sans fenêtre ; le calendrier ouvre `ReportTache` pour une autre date. Les dates viennent de la fonction pure `reportsRapides` (`echeances.ts`) ; les trois boutons restent à leur place même quand deux tombent le même jour (le vendredi, « Dans 3 jours » est lundi). Chaque bouton annonce sa date aux lecteurs d'écran (« Demain, dim. 22 nov. »). | `aujourdhui`, `titre`, `onReporter(date)`, `onAutreDate`, `desactive?`, `auSurvol?` (sur ordinateur, visible au survol de la ligne ou au clavier), `avecLibelle?` (« Reporter » devant, dès la tablette) |
| `BoutonCopier` (`src/components/`) | Petit « Copier » à côté d'un numéro, d'un courriel, d'une adresse. Copie la valeur, dit « Copié » deux secondes (annoncé aux lecteurs d'écran) ; si le navigateur refuse, un message d'erreur l'explique. Sur ordinateur, visible au survol de la ligne ou au clavier ; sur écran tactile, toujours visible. Se place dans `Information` (`fin`) ou dans toute ligne qui porte `group/ligne`. | `valeur` (texte copié), `quoi` (« le numéro », « l'adresse ») |
| `LigneGlissable` (`src/components/`) | Ligne de liste (`li`) qui, glissée vers la gauche au doigt, découvre ses actions (« Reporter » en ambre, « Fait » en vert). Au-delà du seuil (60 % des actions découvertes) elle reste ouverte ; sinon elle se remet en place. Un toucher ailleurs ou sur la ligne la referme. Le défilement vertical et le zoom restent au navigateur, un toucher normal reste un toucher ; inactive à la souris et au stylet. Les actions découvertes sont cachées aux lecteurs d'écran et au clavier : la ligne garde ses boutons visibles. Calculs dans `src/lib/glisser.ts` (sens du geste, freinage, seuil). | `actions` (`{ libelle, icone, genre: 'alerte' \| 'succes', onAction }`), `desactivee?`, `className?` |

Un report fait par `useActionsTache().reporter` (rangée, fenêtre de report, glisser) est confirmé avec « Annuler », qui rétablit l'ancienne date. Branchés aujourd'hui : la prochaine action de la fiche Contact (`ProchaineAction`), la prochaine tâche des fiches Bien et Projet (`ProchaineTacheFiche`), les lignes de la page Tâches (`ListeTaches` avec `gestesRapides` : la rangée remplace le bouton « Reporter », la ligne se glisse ; « Fait » passe par la boucle de relance quand la tâche est liée à un contact) et, sur l'écran Aujourd'hui, les relances (rangée et « Fait » au survol sur ordinateur, ligne glissable sur écran tactile) et le bloc Tâches (ligne glissable, `LigneTache` avec `glissable`). Les boutons « Copier » sont sur la fiche Contact (téléphones, courriels, adresse : dans le profil sur ordinateur, dans l'onglet Infos ailleurs) et la fiche Bien (adresse, dans le profil ou l'en-tête).

Pour un geste qui n'apparaît qu'au survol, `VISIBLE_AU_SURVOL` (`src/components/survol.ts`) donne les classes : caché sur un appareil à souris tant que la ligne (`group/ligne`) n'est ni survolée ni atteinte au clavier, toujours visible sur écran tactile, sans faire sauter la ligne.

### Fiches

L'organisation d'une fiche (étape D.5, fiche Contact ; reprise par les fiches Bien, projet de vente et projet d'achat à l'étape D.7, pour que les quatre se ressemblent). L'organisation change avec la taille d'écran au-delà de ce que font les classes `md:` et `lg:` : la page lit la taille avec `useTailleEcran()` (`src/lib/ecran.ts` : `telephone`, `tablette`, `ordinateur`, aux mêmes seuils que Tailwind).

- **Ordinateur** : deux colonnes. À gauche `ProfilFiche`, ce qu'on cherche à chaque appel ; il ne bouge pas quand on change d'onglet ou qu'on fait défiler les onglets. À droite `OngletsFiche`. En haut, à droite du lien de retour, `NavigationFiche` si l'on vient d'une liste.
- **Tablette et téléphone** : un en-tête compact (`Page` avec `enTete`), la prochaine action, puis les onglets. Sur téléphone, `BarreActionsFiche` remplace la navigation du bas ; on revient par le lien du haut.
- **L'onglet choisi est dans l'adresse** (`?onglet=projets`) : changer d'onglet ajoute une entrée à l'historique, le retour du navigateur ramène à l'onglet d'avant, et un lien gardé rouvre le bon onglet. Le parcours de la liste (`state` de l'historique) suit la fiche d'un onglet à l'autre.
- **Ce qui est commun aux quatre fiches** est dans `src/lib/fiche.ts` : `useOngletFiche(onglets)` (l'onglet lu et écrit dans l'adresse ; `ongletDemande` mène une valeur inconnue au premier onglet), `useParcoursFiche({ domaine, id, actif, chemin, lirePage?, echec })` (« 12 sur 48 » et les fiches voisines, à passer à `NavigationFiche`), `useRaccourcisFiche({ onglets, choisir, parcours })` (1 à 5, J, K), `raccourciFiche` et `ligneDatesFiche` (« Fiche créée le … · modifiée il y a … », ou « Projet ouvert le … · modifié … »). Le parcours lui-même est dans `src/lib/parcours.ts`, une mémoire par liste (`contacts`, `biens`, `projets-vendeurs`, `projets-acquereurs`), dix parcours au plus par liste (les colonnes d'un pipeline en font plusieurs).
- **Sur téléphone, Consigner** de `BarreActionsFiche` mène au bloc « Consigner un échange » de l'onglet Activité, le curseur dans le texte, sur les quatre fiches.

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `ProfilFiche` | Colonne gauche d'une fiche sur ordinateur, collée en haut de l'écran ; si elle est plus haute que l'écran, elle défile seule. | `libelle` (« Profil de … »), contenu |
| `OngletsFiche` | Les onglets d'une fiche (une `Onglets` avec compteurs) et le panneau de l'onglet choisi, reliés pour les lecteurs d'écran. La page garde l'onglet dans l'adresse et gère les touches 1 à 4. | `id`, `libelle`, `options`, `valeur`, `onChange`, contenu |
| `BarreActionsFiche` | Sur téléphone, les touches d'une fiche fixées en bas, à portée de pouce, posées sous la page (la fin de la page reste visible). Rien sur tablette et ordinateur. Contenu : des `LienAction`, la principale d'abord, plus large (`flex-[2]`). | `libelle`, contenu |
| `NavigationFiche` | « 12 sur 48 » et deux flèches (précédent, suivant ; rappels K et J). Une flèche sans action est grisée. | `position`, `quoi`, `onPrecedent?`, `onSuivant?`, `enCours?` |
| `BarreEtapes` | Les étapes d'un projet en barre : passées (bleu clair), en cours (bleu franc, nom en gras), à venir (gris), le nom sous chaque segment (coupé avec un tiret plutôt que tronqué, `hyphens-auto`) ; l'ancienneté dans l'étape (en ambre si elle traîne), « Pour passer à l'étape suivante (…) : … », ce qui manque, et « Étape suivante ». Avec `choix` (fiche du projet), chaque étape est un bouton de 44 px qui y fait passer, en avant comme en arrière. Les états viennent de `etatsEtapes`, les phrases de `phrasePassage` et `phraseManque` (`src/lib/etapes.ts`). | `etapes`, `anciennete?`, `critere?`, `manque?`, `suivante?` (`{ libelle, onPasser, desactive? }`), `choix?` (`{ onChoisir(valeur), desactive? }`) |

**Fiche Contact** (`src/pages/FicheContact.tsx`, morceaux dans `src/features/contacts/`) :

- Profil : `IdentiteContact` (initiales, nom en `h1`, rôles, « Archivé », « Dernier échange il y a … »), `TemperatureContact` (`ChoixSegmente` Froid, Tiède, Chaud, enregistré aussitôt avec « Annuler » ; « en veille » n'allume rien), `ActionsContact` (Appeler, SMS, Courriel, Itinéraire), `ProchaineAction` (avec `compacte` dans le profil : « C'est fait » et les reports sous le texte), `NotesContact` (« À savoir » : étiquettes et notes, ce qu'on relit avant d'appeler), `LignesCoordonnees` et `LignesOrigine` (lignes d'un `<dl>`, avec Copier), l'accord pour être appelé en une ligne verte (`ligneAccord`) ou `AvertissementAppel`, le détail du consentement replié (`ConsentementContact`), « Fiche créée le … · modifiée il y a … » (`ligneDatesFiche`), Modifier et `MenuContact` (le menu « … » : fusionner, exporter ses données, archiver ou restaurer, supprimer définitivement, avec leurs fenêtres).
- Onglet Activité (étape D.6), de haut en bas : `ConsignerEchange`, « À venir » (`SectionTaches` avec `limite`), « Historique » (`SectionJournal` avec `historique`). Sur téléphone, « Consigner » de `BarreActionsFiche` ouvre cet onglet et place le curseur dans le texte (`champConsigner`, `placerCurseur`, `curseur-consigner.ts` : dans le geste même quand le bloc est déjà affiché, pour que l'iPhone sorte son clavier) ; plus de fenêtre.
- Onglets (`ongletsContact`, `ongletAffiche`, `fiche-contact.ts`) : les mêmes partout, Activité, Projets, Tâches, Biens. Sous 1024 px (téléphone, tablette tenue en hauteur), le profil n'a pas sa colonne : un cinquième onglet, Infos, porte les coordonnées, l'origine, « À savoir », le consentement et les dates. Une tablette tenue en largeur (1024 px et plus) prend l'organisation de l'ordinateur. Une adresse qui demande « Infos » sur grand écran mène à Activité.
- Compteurs et dernier échange : `lireCompteursContact` (`compteurs-fiche.ts`), des comptages sans lecture de ligne, relus après chaque geste.
- Appeler respecte l'accord pour être appelé comme `BoutonAppel` (`droitAppel`) : sans accord, la touche est grisée et l'avertissement permet d'appeler quand même en notant un motif.
- Contact précédent ou suivant (`parcours.ts`) : la liste des contacts garde, pour l'onglet du navigateur, sa recherche (la `cle` de `useListeContacts`), son nombre de fiches et les identifiants lus ; ses liens portent cette `cle` dans l'historique (`LigneListe` avec `etat`). Une fiche ouverte d'ailleurs n'a pas de `cle` : pas de flèches. Au-delà des fiches déjà lues, la fiche lit la page suivante (`lirePageContacts`).

**Fiche Bien** (`src/pages/FicheBien.tsx`, étape D.7 ; règles dans `src/features/biens/fiche-bien.ts`) :

- Profil (ordinateur) : `PhotoPrincipale` (`taille="grande"`), type et statut en `Etiquette`, l'adresse en `h1`, complément et commune avec `BoutonCopier`, prix et surface (`prixEtSurface`), Itinéraire (`LienAction`), `ProprietairesBien` (chaque propriétaire avec sa quote-part et `BoutonAppel`), `ProchaineTacheFiche` (« Prochaine tâche »), les dates, Modifier et le menu « … » (archiver ou restaurer, avec la fenêtre de confirmation).
- Tablette et téléphone : en-tête avec `PhotoPrincipale` (`taille="compacte"`, à la place des initiales), les étiquettes, Modifier et « … » sur une ligne, puis l'adresse, la commune avec Copier, le prix ; la prochaine tâche ; sur tablette, Appeler le propriétaire et Itinéraire ; sur téléphone, `BarreActionsFiche` : Itinéraire (principale, en bleu, dans l'ordre demandé), Appeler (le premier propriétaire qui accepte d'être appelé, `appelFiche`), Consigner.
- Onglets (`ONGLETS_BIEN`), les mêmes partout : Activité (`ConsignerEchange` avec les propriétaires, « À venir », « Historique »), Projets et acquéreurs (`SectionProjetsVendeurs` avec `avecEtapes`, `SectionAcquereursDuBien`), Tâches, Détails (caractéristiques, propre au type, diagnostics, historique des prix, description, `PhotosBien` ; sous 1024 px, `ProprietairesBien` en tête et les dates en bas). Compteurs : `lireCompteursBien` (`src/features/liens/compteurs-fiche.ts`).
- `PhotoPrincipale` (`src/features/biens/`) : la photo principale (la photo en grand, la vignette en petit) ; un toucher ouvre la galerie (`FenetreModale` « Photo 2 sur 3 », « Précédente » et « Suivante » en pied, flèches du clavier, `rangSuivant` fait le tour). Sans photo, le dessin `biens` dans une case basse. Relue quand `PhotosBien` signale un changement (`onChangement`).
- `ProprietairesBien` est piloté par la fiche (`etat`, `onChangement`, `lectureSeule`) : la fiche lit les propriétaires une fois pour le profil, la barre du bas et le compte rendu.

**Fiches Projet de vente et Projet d'achat** (`src/pages/FicheProjetVendeur.tsx`, `FicheProjetAcquereur.tsx`, étape D.7 ; onglets dans `src/features/liens/fiche-projet.ts`) :

- Profil (ordinateur) : l'état en `Etiquette`, le titre en `h1` (« Vente — 12 rue… », « Achat — Camille Fictif »), l'étape en clair ; la carte « Étape » (`BarreEtapes` avec `choix`, « Étape suivante » par `useChangementEtape` ou `useChangementEtapeAcquereur`, qui ouvrent la fenêtre de passage si un critère manque ; « À recontacter… », « Perdu… », et pour un achat « Offre acceptée… » à la dernière étape, ou l'offre acceptée et « Annuler l'offre ») ; « Hors du pipeline » avec « Remettre dans le pipeline » ; `LiensProjet` (`src/features/liens/` : le contact avec `BoutonAppel`, le bien avec Itinéraire, et pour un achat le co-acquéreur, l'origine et la réception de la demande) ; `ProchaineTacheFiche` (« Prochaine action », en alerte pour un projet en cours sans suite, avec la prochaine action du contact en repli) ; dates, Modifier, menu « … » (archiver).
- Tablette et téléphone : en-tête (état, titre, Modifier, « … »), la carte « Étape », la prochaine action, puis les onglets ; `LiensProjet` passe en tête de Détails. Sur tablette, Appeler et SMS ; sur téléphone, `BarreActionsFiche` : Appeler, SMS, Consigner (comme la fiche Contact).
- Onglets (`ongletsProjet`) : Activité, Tâches, Détails ; Biens proposés en deuxième pour un projet d'achat (comme Projets sur les fiches Contact et Bien). Compteurs : `lireCompteursFiche` (activités et tâches du projet), le nombre de biens proposés.
- Précédent et suivant : `CartePipeline` reçoit `etat` (`{ parcours: étape }`), et les tableaux vendeur et acquéreur gardent chaque colonne (`memoriserParcours`) ; la fiche suit l'ordre de la colonne d'où elle a été ouverte, même après un changement d'étape.

Sections réutilisées dans les onglets : `SectionTaches` accepte `titre`, `limite` et `onVoirTout` (« À venir » de l'onglet Activité : les trois plus proches, la plus proche d'abord, échéance en rouge si en retard, case qui ouvre la boucle de relance, puis « Voir les 2 autres ») ; `SectionJournal` accepte `historique` (titre « Historique », sans la rangée de boutons de saisie, activités affichées par `HistoriqueParJour`, lecture par pages et filtre par type conservés) ; `SectionProjetsVendeurs` et `SectionProjetsAcquereurs` acceptent `avecEtapes` (une `BarreEtapes` sous chaque projet du pipeline, « Étape suivante » par `useChangementEtape` ou `useChangementEtapeAcquereur`, qui ouvrent la fenêtre de passage si un critère manque ; les critères et ce qui manque viennent de `aideEtapeSuivante` et `aideEtapeSuivanteAcquereur`). `CompteRenduExpress` accepte `contact` (le contact déjà choisi, qu'on peut encore changer).

**Compte rendu dans la fiche** (étape D.6). Le rituel « après chaque échange » sans fenêtre.

| Composant | Rôle | Propriétés principales |
| --- | --- | --- |
| `ConsignerEchange` (`src/features/saisie/`) | Bloc « Consigner un échange » en tête de l'onglet Activité des quatre fiches. Depuis un bien ou un projet, une ligne « Avec » d'abord : les `contacts` proposés en pastilles (le premier choisi), « Autre contact » (`SelecteurContact`) et, sur un bien seulement, « Sans contact » (rien n'est prévu ensuite). Puis le type en pastilles (Appel par défaut, Rendez-vous, Visite, Message, Note ; « Autre » déplie Courriel, Estimation, Porte-à-porte, Document envoyé, Autre), le champ « Qu'avez-vous échangé avec Camille ? » (16 px, dictée du clavier), les champs de `ChampsCompteRenduVisite` pour une visite, le résultat d'un appel, la case « Marquer comme faite « Relancer … » (hier, en retard) », puis « Ensuite » (`ChampsProchaineAction` en version `compacte`) et « Enregistrer » (rappel « ⌘ Entrée » ou « Ctrl Entrée » sur ordinateur, `estEnregistrement` et `rappelEnregistrer` dans `src/lib/clavier.ts`). Après l'enregistrement, le bloc se vide et la fiche se relit (historique, À venir, prochaine action, dernier échange). | `fiche` (`FicheOrigine` : `{ contact }`, `{ bien }` ou `{ projet }`), `contacts?`, `version`, `onEnregistre`, `demandeFocus?`, `onFocusDonne?` |
| `HistoriqueParJour` (`src/features/activites/`) | Les activités groupées par jour (« Aujourd'hui », « Hier », « Vendredi 13 novembre · il y a 10 jours », l'année si elle diffère), chacune en carte : dessin du type, nom du type, résultat en `Etiquette` (« Pas de réponse » en ambre, « Joint » et « Intéressé » en vert…), heure à droite en chiffres alignés, compte rendu de visite, texte. Toucher une carte l'ouvre pour la corriger (`FormulaireActivite`). | `activites`, `aujourdhui`, `masquer?`, `onChangement` |

La logique est commune et testée (`consigner-echange.ts`, `historique.ts`) ; rien n'est recopié de la boucle ni du compte rendu express :

- la saisie, les vérifications et la prochaine action proposée viennent du compte rendu express (`preparerCompteRendu`, `prochaineProposeeCompteRendu` : relance au rythme de la température, rappel le lendemain d'une visite) ;
- l'échange clôt la tâche à laquelle il répond (`tacheAClore` : la plus ancienne tâche du contact prévue aujourd'hui ou en retard, d'une catégorie qui va avec le type — un appel clôt une relance ou une prospection, une visite une visite ; une note ne clôt rien). La case se décoche. Une tâche close passe par la boucle de relance (`preparerBoucle`, fonction `boucler_tache` : tâche faite, activité, prochaine action en une opération, réaction au bien visité comprise) ; sinon, l'activité puis la tâche sont créées comme dans le compte rendu express (`preparerEchange`, `enregistrerEchange`) ;
- « Ensuite » montre « Déjà prévu : … » quand une autre tâche reste à faire (`resteePrevue`, `prochaineEffective`), avec « Ajouter une relance quand même » ; sinon la relance proposée, les raccourcis de date (2 jours, 1 semaine, 1 mois, 3 mois, 6 mois), « Modifier » (titre et calendrier) et « Ne rien prévoir » ;
- depuis un bien ou un projet (étape D.7), l'activité et la tâche créées sont liées aussi au bien ou au projet (`liens` de `preparerCompteRendu`), et seule une tâche liée à la fiche peut être close (`tachesDeLaFiche`) : la boucle de relance reprend les liens de la tâche close ;
- un texte non enregistré est gardé sur l'appareil à chaque frappe (`localStorage`, clé `immocrm.echange.<fiche>`, `ficheEchange` : l'identifiant du contact, ou `bien.…`, `vendeur.…`, `acquereur.…` ; type, résultat, texte, compte rendu de visite ; 14 jours au plus) et repris au retour sur la fiche, avec « Brouillon non enregistré du … , repris ici » et « Effacer » (`lireBrouillonGarde`, `brouillonDepuisGarde`).

### Fenêtre modale

`FenetreModale` : plein écran sur téléphone, centrée au-delà. Se ferme par la croix, la touche Échap ou un clic à côté. Les boutons vont dans `pied`, fixé en bas ; mettre l'action principale en premier. Un `ChampSaisie`, un `ChampTexteLong` ou un `ChampRecherche` marqué `autoFocus` reçoit le curseur à l'ouverture (sinon il irait sur la croix) : pour taper aussitôt.

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
| Confirmation qu'on peut défaire (« Reportée au … ») | `notifier('succes', '…', { libelle: 'Annuler', onAction })` : bouton dans le message, 7 secondes, en pause tant que la souris ou le clavier est dessus ; Ctrl Z (⌘ Z) le déclenche hors d'un champ |
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

`<Icone nom="…" />` : petits dessins au trait, de la couleur du texte voisin. Noms disponibles : `aujourdhui`, `contacts`, `biens`, `pipelines`, `taches`, `plus`, `reglages`, `palette`, `chevron`, `retour`, `fermer`, `ajouter`, `succes`, `erreur`, `info`, `horsLigne`, `vide`, `telephone`, `sms`, `courriel`, `modifier`, `archiver`, `recherche`, `filtrer`, `fusionner`, `photo`, `galerie`, `supprimer`, `horloge`, `repeter`, `lieu`, `journal`, `note`, `document`, `estimation`, `poignee`, `itineraire`, `alerte`, `nouveaute`, `copier`, `calendrier`. Pour en ajouter un, compléter `src/components/Icone.tsx`. Un dessin seul dans un bouton exige un `aria-label`.

## Composants prévus (phase D)

Les composants montrés par les maquettes de la version 3 (canevas « ImmoCRM — nouveau style ») sont tous construits : ceux de D.1 sont décrits dans « Gestes rapides », ceux de D.2 dans « Structure » et « Saisie rapide », ceux de D.3 et D.4 dans « Écran Aujourd'hui », ceux de D.5, D.6 et D.7 dans « Fiches ». L'étape D.7 a repris ces composants pour les fiches Bien et Projet ; elle n'ajoute que ce que ces fiches demandaient en plus : `PhotoPrincipale` (photo et galerie), `ProchaineTacheFiche` et `CarteProchaineTache` (la carte commune avec `ProchaineAction`), `LiensProjet`, les étapes à toucher de `BarreEtapes` (`choix`), et les crochets communs de `src/lib/fiche.ts`.

## Installation sur l'écran d'accueil

- `public/manifest.webmanifest` : nom, couleurs, icônes. Les chemins y sont relatifs, pour fonctionner quel que soit le chemin de base du site.
- `public/favicon.svg` et `public/icones/` : icône de l'application (192 et 512 px, version « masquable » pour Android, version Apple).
- `index.html` : lien vers le manifeste, icône Apple, couleur de thème claire et sombre.
- L'icône est une maison blanche sur le bleu d'accent (`#3d3af5`). Les images PNG ont été produites à partir de `favicon.svg` ; à refaire si l'icône change.

Il n'y a **pas de mode hors réseau** (aucun fichier n'est mis en réserve dans l'appareil) : sans réseau, l'application affiche le bandeau et les enregistrements échouent.
