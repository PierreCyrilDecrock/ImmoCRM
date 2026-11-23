# ImmoCRM — Revue de design du 23 novembre 2026

Revue de l'interface faite après l'étape D.7 (version 1.0.0), avec un regard de designer produit. Elle a relevé **19 corrections**. La phase E du [plan de développement](plan-developpement.md) les réalise en sept étapes (E.1 à E.7), avant la recette de l'interface (D.8), qui les vérifie.

Les captures « avant » et les maquettes « après » sont dans l'artefact « Revue d'interface ImmoCRM » (privé). Si une session a besoin de les voir, collez-lui son lien.

## Comment la revue a été faite

L'application a été lancée en local sur un faux serveur qui rejoue des données fictives (11 contacts, 2 biens, 3 projets, 14 tâches), l'heure figée à 10 h 20. Onze écrans ont été capturés au téléphone (390 px), à la tablette (820 px) et à l'ordinateur (1440 px), en clair et en sombre, puis relus un par un.

## Le diagnostic

Le style de la version 3 tient bien : couleurs, contrastes, tailles de touche et thème sombre sont soignés. Ce qui coince relève de l'organisation des écrans, en trois familles :

- **Trop de boutons, trop souvent.** Chaque ligne affiche tous ses gestes en permanence. Sur téléphone, une relance occupe 185 px et une tâche 150 px : le matin, on lit 2,5 relances par écran.
- **Des signaux qui se contredisent.** « 6 en retard » dans la navigation, « Aucune tâche en attente, place au terrain » en vert sur l'accueil ; une case qui paraît cochée devant une action à faire.
- **Une hiérarchie qui flotte.** Deux ou trois boutons bleus sur un même écran, l'étape d'un projet écrite trois fois, « Étape suivante » au même poids que « Perdu… ».

## Les règles qui en découlent

Elles complètent les principes de [design.md](design.md) et valent pour tous les écrans à venir.

1. **Une ligne de liste montre un seul geste** : le plus fréquent (Appeler pour une relance, Reporter pour une tâche). Les autres sont au glissement et, toujours, dans un équivalent visible (la ligne qui se déplie, un menu).
2. **Un seul bouton bleu au repos par écran.** Un bouton d'enregistrement ne passe au bleu que quand il y a quelque chose à enregistrer.
3. **Une seule façon de créer par écran** : le « + » flottant sur téléphone et tablette, le bouton d'en-tête ou « Créer » sur ordinateur.
4. **Une information n'est écrite qu'une fois** par écran (une étape, une adresse, une date égale à l'onglet).
5. **Une tâche à faire se présente toujours de la même façon** : une case ronde vide qu'on touche pour la clore.
6. **Un message vide ne contredit pas le reste de l'écran.** Le vert et « place au terrain » sont réservés à une journée vraiment finie.
7. **Chaque groupe de pastilles porte son nom**, et une pastille qui ouvre un choix a le style des autres, avec un dessin (chevron, loupe).
8. **Un contenu coupé se signale** par un fondu, jamais par une coupure nette.

## Les 19 corrections

| N° | Correction | Écran | Priorité | Étape |
| --- | --- | --- | --- | --- |
| 1 | Une relance tient en une ligne | Aujourd'hui | D'abord | E.1 |
| 2 | Les reports s'effacent derrière les tâches | Tâches, fiches | D'abord | E.3 |
| 3 | L'agenda devient une frise, sans doublon | Aujourd'hui | D'abord | E.1 |
| 4 | Le bloc Tâches ne contredit plus la pastille | Aujourd'hui | D'abord | E.2 |
| 5 | La prochaine action n'a plus l'air faite | Quatre fiches | D'abord | E.3 |
| 6 | Un seul bouton bleu, une seule façon de créer | Contacts, Biens, Tâches, fiches | Important | E.4 |
| 7 | Fiche Projet : l'étape une fois, l'action devant | Projets | Important | E.7 |
| 8 | Pipelines : des cartes qu'on distingue | Pipelines | Important | E.5 |
| 9 | Liste des contacts : prénom, nom et un repère | Contacts | Important | E.5 |
| 10 | Fiche Contact : l'historique remonte | Fiche Contact | Important | E.6 |
| 11 | Onglets coupés : montrer qu'il y a une suite | Fiches, Tâches, Pipelines | Important | E.7 |
| 12 | Chaque groupe de pastilles porte son nom | Consigner un échange | Important | E.6 |
| 13 | Le statut d'un bien se lit d'un coup d'œil | Biens | Finition | E.5 |
| 14 | Carte « Maintenant » : deux gestes côte à côte | Aujourd'hui | Finition | E.2 |
| 15 | Un anneau vide ne s'affiche pas | Aujourd'hui | Finition | E.2 |
| 16 | « Trois actions » : des exemples, puis compact | Aujourd'hui | Finition | E.2 |
| 17 | La recherche dit la même chose partout | Toutes | Finition | E.4 |
| 18 | Une colonne de profil plus large sur ordinateur | Quatre fiches | Finition | E.6 |
| 19 | La page du développeur quitte le menu Plus | Plus | Finition | E.4 |

### 1. Une relance tient en une ligne

- **Constat.** 185 px par relance sur téléphone : initiales, nom, rôle, motif, « Aucun échange au journal », puis Appeler, Consigner et un bouton horloge. Huit relances font trois écrans et demi. Le motif, plus gros que le nom, en est séparé par un grand blanc. Le bouton horloge bleu, sans libellé, ne dit pas qu'il reporte.
- **Décision.** Ligne de 64 à 72 px : initiales colorées selon le rôle, nom en gras, motif juste dessous, retard à droite (« 5 j »), un seul bouton rond Appeler. Fait et Reporter restent au glissement ; toucher la ligne la déplie et montre Consigner, Reporter, Fait et la fiche (l'équivalent visible du glisser). « Aucun échange au journal » disparaît. Le dernier échange s'affiche dans la ligne dépliée (et sur la ligne elle-même sur ordinateur, où la place ne manque pas) ; « Jamais contacté » le remplace seulement quand c'est vrai.
- **Où.** `LigneRelance.tsx`, `BlocJournee.tsx`.

### 2. Les reports s'effacent derrière les tâches

- **Constat.** Quatre boutons de report sous chaque tâche (20 pour 5 tâches) : reporter devient plus visible que faire. « Aujourd'hui » répété sur chaque ligne de l'onglet Aujourd'hui. L'adresse écrite deux fois (lieu, puis bien lié).
- **Décision.** Sur écran tactile, un seul bouton horloge, lu « Reporter », qui ouvre les raccourcis (feuille sur téléphone) ; le glissement reste. Sur ordinateur, les reports apparaissent au survol et au clavier, comme à l'accueil. La date ne s'écrit que si elle diffère de l'onglet ; l'heure reste. Une seule adresse : le lieu s'il existe, sinon le bien.
- **Où.** `ListeTaches`, `LigneTache`, `ReportsRapides`.

### 3. L'agenda devient une frise, sans doublon

- **Constat.** Le rendez-vous de la carte « Maintenant » est répété dans l'agenda juste dessous. Quatre gestes par rendez-vous, en deux styles (boutons Appeler, Itinéraire ; liens bleus Contact, Bien). L'heure est noyée dans une ligne grise.
- **Décision.** Une frise : l'heure dans une colonne à gauche en chiffres alignés, le titre et le lieu à droite. Le rendez-vous déjà dans la carte porte une marque « Ci-dessus », sans boutons. Les autres gardent un seul bouton (Itinéraire) ; toucher la ligne ouvre la fiche ; le contact et le bien sont des liens dans le texte. Le trait rouge « maintenant » traverse la frise.
- **Où.** `LigneRendezVous.tsx`, `TraitMaintenant.tsx`.

### 4. Le bloc Tâches ne contredit plus la pastille

- **Constat.** La navigation annonce 6 tâches en retard ; le bloc Tâches de l'accueil affiche un 0 vert et « Aucune tâche en attente. Rien d'autre à faire aujourd'hui : place au terrain. », parce que relances et rendez-vous sont rangés ailleurs.
- **Décision.** Le bloc s'appelle « Autres tâches ». Vide, il situe le reste : « Rien d'autre que vos 8 relances et 3 rendez-vous. » Le vert et « place au terrain » seulement quand tout est fait. Le compteur reste gris à zéro tant qu'il reste du travail ailleurs.
- **Où.** `BlocJournee.tsx`, `Aujourdhui.tsx`.

### 5. La prochaine action n'a plus l'air faite

- **Constat.** Le dessin devant la prochaine action est une case carrée cochée, en bleu : devant « Relancer Camille · hier, en retard », on lit « déjà fait ». Ailleurs, une tâche à faire est une case ronde vide.
- **Décision.** La case ronde vide habituelle (`CaseTache`) à gauche, qui lance la boucle de relance. « C'est fait » disparaît sur téléphone et tablette et reste sur ordinateur. Un seul bouton « Reporter » ouvre les raccourcis.
- **Où.** `CarteProchaineTache.tsx` (commun aux quatre fiches).

### 6. Un seul bouton bleu, une seule façon de créer

- **Constat.** Contacts sur téléphone : « + Ajouter » en haut et « + » flottant. Tâches : « Nouvelle tâche », l'ajout rapide et son « Ajouter », et le « + ». Fiche Contact sur ordinateur : Appeler et Enregistrer en bleu plein, plus un lien bleu.
- **Décision.** Sur téléphone et tablette, le « + » flottant est la seule entrée de création et crée ce que montre la page (un contact sur Contacts, un bien sur Biens, une tâche sur Tâches). Le bouton d'en-tête n'apparaît qu'à partir de 1024 px. Tâches : l'ajout rapide se valide par Entrée, « Ajouter » n'apparaît qu'avec du texte ; « Plus de détails » remplace « Nouvelle tâche ». Fiches : « Enregistrer » reste secondaire tant que le champ est vide.
- **Où.** `Contacts.tsx`, `Biens.tsx`, `Taches.tsx`, `SaisieRapide`, `ConsignerEchange`.

### 7. Fiche Projet : l'étape une fois, l'action devant

- **Constat.** L'étape est écrite trois fois en haut (sous le titre, dans la frise, dans la phrase « Pour passer… »). « Étape suivante » est un bouton blanc au poids de « À recontacter… » et « Perdu… ». Les critères manquants sont une phrase grise. « Touchez une étape… » s'affiche aussi à la souris ; la frise a des libellés de 12 px.
- **Décision.** Le titre suivi directement de la frise, l'étape en gras, en 14 px, avec son ancienneté. Les critères en liste (acquis en vert, manquants en creux). « Passer à Estimation » en bouton principal, qui nomme l'étape d'arrivée. « À recontacter » et « Perdu » rejoignent le menu « … ». L'aide « Touchez… » seulement sur écran tactile.
- **Où.** `FicheProjetVendeur`, `FicheProjetAcquereur`, `BarreEtapes.tsx`.

### 8. Pipelines : des cartes qu'on distingue

- **Constat.** Deux commandes segmentées identiques empilées, de rangs différents. Deux cartes titrées « Camille Fictif » : c'est le bien qui distingue deux projets de vente. « Contact : dim. 22 nov. » en rouge ne dit pas qu'il s'agit d'un retard. Sur téléphone, quatre étapes vides gardent chacune « Aucun projet à cette étape ».
- **Décision.** Vendeurs / Acquéreurs en onglets de page soulignés ; les quatre états en pastilles dessous. Carte vendeur : le bien en titre, le contact dessous. Carte acquéreur : le contact en titre, le budget dessous. Retard en clair : « Relance en retard · 1 j ». Sur téléphone, les étapes vides se replient en une ligne de pastilles.
- **Où.** `Pipelines.tsx`, `CartePipeline.tsx`, `TableauPipeline.tsx`.

### 9. Liste des contacts : prénom, nom et un repère

- **Constat.** La liste écrit « Essai Manon » ; partout ailleurs, « Manon Essai ». Chaque ligne montre le téléphone, rien sur la relation. Pas d'initiales.
- **Décision.** « Manon **Essai** » : prénom puis nom, le nom en gras (la liste reste triée par nom). Initiales colorées selon le rôle. Dessous, le rôle et le dernier échange ; à droite, la pastille de retard, sinon la température. Le téléphone reste trouvable par la recherche.
- **Où.** `Contacts.tsx`, `nomDeListe` (`contacts.ts`).

### 10. Fiche Contact : l'historique remonte

- **Constat.** Sur téléphone, la température occupe une rangée entière sous le nom. « Consigner un échange », toujours déplié, prend 750 px : l'historique arrive au quatrième écran.
- **Décision.** La température devient une puce colorée à côté du rôle (« ● Chaud ») ; la toucher ouvre le choix. « Consigner » se présente replié en un champ d'une ligne, qui se déplie au toucher ou par « Consigner » de la barre du bas. « À venir » et l'historique remontent dans le premier écran. Sur ordinateur, la commande segmentée reste dans le profil.
- **Où.** `ProfilFiche.tsx`, `ChoixSegmente`, `ConsignerEchange`.

### 11. Onglets coupés : montrer qu'il y a une suite

- **Constat.** « B… » sur la fiche Contact, « Cette sema… » sur Tâches, « Tâ… » sur la fiche Bien, « Perdus » sur Pipelines : une coupure nette se lit comme une erreur.
- **Décision.** Un fondu sur le bord tant qu'il reste des onglets cachés. Des libellés courts : « Semaine », « Acquéreurs ». Sur la fiche Contact au téléphone, Infos devient visible sans défiler.
- **Où.** `Onglets.tsx`, `OngletsFiche.tsx`.

### 12. Chaque groupe de pastilles porte son nom

- **Constat.** Sur la fiche Bien, « Avec » puis le type d'échange : deux groupes de pastilles noires, le second sans titre. « Autre › » et « Autre contact » en bleu ressemblent à des liens.
- **Décision.** Une légende par groupe (« Avec », « Type d'échange »). « Autre » et « Autre contact » au style des autres pastilles, avec chevron ou loupe. Plus d'espace entre deux groupes qu'entre deux pastilles.
- **Où.** `ConsignerEchange`, `GroupePastilles`.

### 13. Le statut d'un bien se lit d'un coup d'œil

- **Constat.** Le statut s'affiche tel qu'il est rangé (« estimation », en minuscule, en gris) ; le type, moins décisif, est en bleu.
- **Décision.** Libellé avec majuscule et une couleur par phase : estimation en bleu doux, mandat en vert, sous offre en ambre, vendu en encre. Le type passe en texte simple.
- **Où.** `Biens.tsx`, `FicheBien.tsx`, libellés de `biens.ts`.

### 14. Carte « Maintenant » : deux gestes côte à côte

- **Constat.** Trois boutons de largeurs différentes ; « Fiche du bien » passe seul à la ligne sur téléphone ; Itinéraire avant Appeler alors qu'Appeler est le bleu.
- **Décision.** Deux boutons de même largeur, Appeler puis Itinéraire. Le titre du rendez-vous devient le lien vers sa fiche, avec un chevron.
- **Où.** `CarteMaintenant.tsx`.

### 15. Un anneau vide ne s'affiche pas

- **Constat.** À 0, l'anneau « 0 sur 11 fait » est un cercle gris vide, seul sur sa ligne au téléphone : il ressemble à un chargement.
- **Décision.** À 0, la phrase de résumé dit « 11 à faire aujourd'hui ». L'anneau apparaît au premier geste, à droite du titre.
- **Où.** `AnneauProgression.tsx`, `resumeJournee`.

### 16. « Trois actions » : des exemples, puis compact

- **Constat.** Les champs disent « Action 2 », « Action 3 ». Remplis, ils restent trois champs bordés.
- **Décision.** Des exemples dans les champs vides (« Ex. : rappeler le notaire »). Une action écrite s'affiche en texte avec sa case ronde ; la toucher la rend modifiable.
- **Où.** `TroisActions.tsx`.

### 17. La recherche dit la même chose partout

- **Constat.** « Rechercher un contact » sur téléphone, « Rechercher » sur ordinateur, pour une recherche qui ne trouve que les contacts.
- **Décision.** « Rechercher un contact » partout. Chercher aussi les biens est une évolution à décider plus tard, hors de cette phase.
- **Où.** `RechercheGlobale.tsx`.

### 18. Une colonne de profil plus large sur ordinateur

- **Constat.** À 1440 px, le contenu est limité à 960 px et centré ; le profil de 320 px coupe l'adresse et le dernier échange sur deux ou trois lignes.
- **Décision.** Les quatre fiches passent à une largeur maximale de 1150 px environ (`max-w-6xl`), avec un profil de 360 px. Les listes gardent leur colonne actuelle.
- **Où.** `Page.tsx`, `ProfilFiche.tsx`.

### 19. La page du développeur quitte le menu Plus

- **Constat.** « Composants de l'interface » figure au rang de Journal et Réglages.
- **Décision.** Retirée du menu, elle reste ouverte à son adresse (`#/plus/composants`) et est citée dans `docs/design.md`.
- **Où.** `Plus.tsx`.
