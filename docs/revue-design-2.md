# ImmoCRM — Revue de design n° 2, du 24 novembre 2026

Deuxième revue de l'interface, faite une fois la phase E terminée (les 19 corrections de la [première revue](revue-design.md) en place), avec le même regard de designer produit. Elle a relevé **16 propositions**. La phase F du [plan de développement](plan-developpement.md) les réalise en six étapes (F.1 à F.6), avant la recette de l'interface (D.8), qui les vérifie avec le reste.

Les captures « avant » et les maquettes « après » sont dans l'artefact « Revue d'interface ImmoCRM n° 2 » (privé). Si une session a besoin de les voir, collez-lui son lien.

## Comment la revue a été faite

L'application a été lancée en local sur un faux serveur qui rejoue des données fictives (12 contacts, 7 biens, 11 projets, 13 tâches), l'heure figée au mardi 24 novembre 2026 à 10 h 20. Treize écrans ont été capturés au téléphone (390 px), à la tablette (820 px) et à l'ordinateur (1440 px), en clair et en sombre, puis relus un par un.

Trois écarts vus sur le faux serveur ne sont pas retenus, car ils venaient des données d'essai et non de l'application : des compteurs d'onglets à 0, un projet de vente sans bien (« Bien introuvable » ; la base l'interdit) et un projet « Mandat signé » encore « En cours ».

## Le diagnostic

La phase E a porté ses fruits : une relance tient en une ligne, l'agenda est une frise, un seul geste par ligne dans les listes principales, la prochaine action a sa case ronde. Le thème sombre, les contrastes, les tailles de touche, les écrans Plus et Réglages n'appellent pas de correction. Ce qui reste est plus fin, en trois familles :

- **Ce qui sert à décider est caché.** Le prix d'un bien n'apparaît pas au téléphone, les tâches en retard sont derrière un onglet, les titres de l'agenda sont coupés après quinze lettres.
- **Des absences qui crient.** Une alerte orange « Aucune action prévue » au-dessus d'une ligne qui dit qu'une action est prévue jeudi ; un « 3 j » rouge sans légende à la place de la température.
- **Les doublons reviennent par les côtés.** La même tâche deux fois sur la fiche Bien et sur l'accueil, deux boutons pour planifier sur la fiche Projet, deux champs de recherche empilés sur Biens, deux boutons bleus sur ordinateur.

## Les règles qui en découlent

Elles prolongent les huit règles de la [première revue](revue-design.md#les-règles-qui-en-découlent) et [design.md](design.md), et valent pour tous les écrans à venir.

9. **Un compteur mène à ce qu'il compte.** Toucher la pastille « 3 » de Tâches ouvre les trois tâches en retard, pas autre chose.
10. **Une absence se dit calmement.** Rouge et orange pour un vrai retard ou un vrai risque ; « rien de prévu » s'écrit en gris, avec le geste pour y remédier.
11. **Le chiffre qui sert à décider reste visible.** Prix d'un bien, retard d'une relance, heure d'un rendez-vous : jamais coupés, jamais remplacés par une pastille.
12. **Une tâche n'apparaît qu'une fois par écran.** Si elle est mise en avant (prochaine action, « À préparer »), la liste du dessous ne la répète pas.

## Les 16 propositions

| N° | Proposition | Écran | Priorité | Étape |
| --- | --- | --- | --- | --- |
| 1 | La pastille rouge mène aux retards | Tâches | D'abord | F.1 |
| 2 | Un bien montre son prix et son adresse | Biens | D'abord | F.3 |
| 3 | Le haut de l'accueil laisse voir la journée | Aujourd'hui | D'abord | F.2 |
| 4 | Agenda : des titres lisibles, rien en double | Aujourd'hui | D'abord | F.2 |
| 5 | Contacts sans suite : une ligne chacun | Aujourd'hui | Important | F.2 |
| 6 | Fiche Projet : une seule invitation à planifier | Projets | Important | F.4 |
| 7 | Fiche Projet : une frise lisible au téléphone | Projets | Important | F.4 |
| 8 | Pipelines : la valeur et le jour sur chaque carte | Pipelines | Important | F.6 |
| 9 | Contacts : la température garde sa place | Contacts | Important | F.3 |
| 10 | Une seule recherche par écran | Biens, fiches | Important | F.3 |
| 11 | Fiche Bien : la prochaine tâche une seule fois | Fiche Bien | Important | F.4 |
| 12 | Ordinateur : « Créer » cède le bleu à la page | Toutes, ordinateur | Important | F.6 |
| 13 | L'historique se filtre par pastilles | Fiches, Journal | Finition | F.5 |
| 14 | En-tête de la fiche Contact sans ligne orpheline | Fiche Contact | Finition | F.5 |
| 15 | La même pastille de retard partout | Navigation | Finition | F.1 |
| 16 | Formulaire Contact : le prénom d'abord | Modifier un contact | Finition | F.5 |

### 1. La pastille rouge mène aux retards

- **Constat.** La navigation signale 3 tâches en retard. Toucher Tâches ouvre l'onglet « Aujourd'hui », qui ne les montre pas : il faut repérer le premier onglet, gris, pour les trouver. Ce sont des relances, les plus urgentes de la page, et les seules invisibles. Rendez-vous à heure fixe et tâches sans heure se suivent sans distinction. Une note de bas de page explique les onglets au lieu de servir la journée.
- **Décision.** Un premier onglet « À faire » réunit deux rubriques : **En retard** (en rouge, la plus ancienne d'abord), puis **Aujourd'hui** (les rendez-vous d'abord, l'heure en gras en tête de la ligne de détail, puis les tâches sans heure). Les onglets Semaine, Plus tard et Terminées restent. La page s'ouvre sur « À faire » ; la pastille y mène donc. La note disparaît ; « jusqu'à dimanche » peut se dire dans l'onglet Semaine (lecteur d'écran, info-bulle).
- **Où.** `Taches.tsx`, `ListeTaches`, `echeances.ts`.

### 2. Un bien montre son prix et son adresse

- **Constat.** À 390 px, l'adresse est coupée après une douzaine de lettres (« 12 rue de l'Exe… ») et la commune aussi. Prix, surface et pièces sont dans la ligne grise, entièrement coupés : on ne les voit qu'à l'ordinateur. La vignette (la même maison grise sur chaque ligne) prend 56 px sans rien apprendre.
- **Décision.** Pas de vignette tant que le bien n'a pas de photo ; avec une photo, elle revient. Ligne 1 : l'adresse en entier, sur deux lignes si besoin. Ligne 2 : le prix en noir (« Prix à fixer » en gris sinon), le type court et la surface (« T3 · 64 m² »), la pastille de statut à droite, avec sa couleur (correction 13 de la première revue). Ligne 3 : la commune, en gris. Le chevron disparaît sur téléphone. L'ordinateur garde sa ligne actuelle.
- **Où.** `Biens.tsx`, `liste-biens.ts`, `vignettes-biens.ts`.

### 3. Le haut de l'accueil laisse voir la journée

- **Constat.** Au téléphone, le premier écran montre la recherche, la date, « Bonjour », une phrase de trois lignes, la carte du prochain rendez-vous et les trois champs vides de « Trois actions ». L'agenda commence à 890 px, « À rappeler » à 1 170 px. La phrase finit par « 8 à faire aujourd'hui » juste après « 3 rendez-vous et 4 personnes à rappeler » : on additionne, on trouve 7, on doute.
- **Décision.** La phrase devient une rangée de compteurs qu'on touche pour descendre au bloc : « 3 rendez-vous », « 4 à rappeler » (chiffre rouge s'il y a du retard), « 1 tâche » ; la fin de journée reste en une ligne courte (« Dernier rendez-vous vers 17 h 30. »). Dès le premier geste, l'anneau et « 3 sur 8 faits » reprennent leur place. « Trois actions qui comptent » vide se réduit à une ligne « Choisir mes trois actions du jour » qui déplie les champs ; une fois une action écrite, le bloc garde sa forme actuelle.
- **Où.** `Aujourdhui.tsx`, `lecture-journee.ts`, `TroisActions.tsx`.

### 4. Agenda : des titres lisibles, rien en double

- **Constat.** Les titres de l'agenda sont coupés vers quinze lettres (« Estimation de l… », « Visite T3 avec Dom… ») : la ligne compte quatre colonnes (heure, case, texte, Itinéraire) plus la marque « Ci-dessus ». Le lieu est coupé plus tôt encore. « Commander le diagnostic amiante » apparaît deux fois : sous « À préparer » dans la carte du prochain rendez-vous, puis dans « Autres tâches ».
- **Décision.** Le bouton Itinéraire quitte les lignes de l'agenda (il est dans la carte du prochain rendez-vous) et passe dans la ligne dépliée. La marque « Ci-dessus » est remplacée par une ligne estompée. Sous le titre : la durée et la rue seule. « Autres tâches » ne répète pas ce qui est « À préparer » ; s'il ne contient rien d'autre, une phrase grise le dit.
- **Où.** `LigneRendezVous.tsx`, `BlocJournee.tsx`, `CarteMaintenant.tsx`, `ordre-journee.ts`, `maintenant.ts`.

### 5. Contacts sans suite : une ligne chacun

- **Constat.** Dans « Alertes », chaque contact sans prochaine action occupe 120 px avec deux boutons (« Planifier », « Fiche ») : la règle 1 n'est pas tenue dans ce bloc. Quatre contacts font 480 px ; quinze en feraient la plus longue partie de l'écran. « Fiche créée le 22 novembre 2026 » est la seule information.
- **Décision.** Une ligne de 64 px comme ailleurs : initiales colorées par rôle, nom, rôle et « jamais contacté » ou « il y a 3 sem. ». Un seul bouton rond « Planifier » (calendrier) ; toucher la ligne ouvre la fiche. Les trois premiers, puis « Voir les 4 », qui ouvre Contacts sur l'onglet « Sans prochaine action ». Ordre : vendeurs et acquéreurs d'abord (les plus chauds en tête), puis notaires, prescripteurs et autres. Les partenaires restent comptés : le cadrage veut une prochaine action datée pour chaque contact.
- **Où.** `LigneAlerte.tsx`, `BlocJournee.tsx`, `jamais-contactes.ts`.

### 6. Fiche Projet : une seule invitation à planifier

- **Constat.** Une carte orange « Aucune action prévue pour ce projet » avec « Nouvelle tâche », puis « À venir : Aucune tâche à faire » avec « Ajouter une tâche » : la même absence dite deux fois, avec deux boutons pour le même geste. La carte orange se contredit : sa deuxième ligne dit que le vendeur a une action prévue jeudi.
- **Décision.** La carte orange disparaît quand le contact a une action prévue ailleurs ; « À venir » le dit en gris : « Rien de prévu pour ce projet. Camille a une action jeudi 26 nov. : Envoyer l'avis de valeur. », avec un seul bouton « Planifier pour ce projet ». L'orange reste quand le contact n'a vraiment rien de prévu (c'est alors un risque de perte), toujours avec un seul bouton.
- **Où.** `FicheProjetVendeur.tsx`, `FicheProjetAcquereur.tsx`, `SectionTaches`, `fiche-projet.ts`.

### 7. Fiche Projet : une frise lisible au téléphone

- **Constat.** Cinq libellés dans 330 px : « Premier contact » sur deux lignes, « Estimation » et « Suivi » collés, les libellés à des hauteurs différentes. Le critère manquant (« Motif de la vente ») est une ligne avec un rond vide ; rien ne dit qu'on peut le renseigner d'ici.
- **Décision.** Au téléphone, la frise garde ses segments sans libellés ; une ligne les résume : « Étape 2 sur 5 · **Découverte** · depuis 12 j », puis « Ensuite : Estimation ». Toucher la frise ouvre la liste des étapes avec leur critère, pour en choisir une. Le critère manquant devient un lien (« Renseigner le motif de la vente › ») qui ouvre le champ. À partir de 820 px, la frise actuelle reste.
- **Où.** `BarreEtapes.tsx`, `FicheProjetVendeur.tsx`, `FicheProjetAcquereur.tsx`.

### 8. Pipelines : la valeur et le jour sur chaque carte

- **Constat.** Aucune carte ne dit ce que vaut le projet (prix espéré, estimation, budget). « Relance · mar. 24 nov. » est aujourd'hui, mais il faut le reconnaître. Devant chaque relance, une case carrée cochée : le dessin qui faisait croire « déjà fait » sur les fiches (correction 5 de la première revue). « Depuis 40 jours » passe en orange sans dire pourquoi.
- **Décision.** Une ligne de valeur : « 300 000 € espérés » (vendeur), « Estimé 410 – 440 k€ » dès l'avis de valeur, « Budget 200 – 300 k€ » (acquéreur), « Prix à connaître » en gris sinon. Les dates proches en mots : « aujourd'hui », « demain », le jour de la semaine jusqu'à six jours. Devant la relance, l'horloge, en rouge si elle est en retard. L'ancienneté en orange porte sa raison (« Plus de 30 jours à cette étape », lue et en info-bulle). Sur ordinateur, le total de chaque colonne sous son titre (« 2 · 720 k€ »).
- **Où.** `CartePipeline.tsx`, `carte-pipeline.ts`, `TableauPipeline.tsx`.

### 9. Contacts : la température garde sa place

- **Constat.** La colonne de droite change de sens d'une ligne à l'autre : tantôt la température, tantôt un « 3 j » rouge sans légende. Les contacts chauds en retard, les plus importants, sont ceux dont on lit le moins. « 4 j » se lit « il y a » comme « dans ».
- **Décision.** À droite, toujours la température (rien si elle n'est pas renseignée), sur la ligne du nom. Le retard passe dans la ligne grise, en mots et en rouge : « Acquéreur · relance en retard de 3 j », à la place du dernier échange.
- **Où.** `LigneContact.tsx`, `ligne-contact.ts`.

### 10. Une seule recherche par écran

- **Constat.** La barre « Rechercher un contact » est fixée en haut de tous les écrans sauf Contacts : 60 px permanents au téléphone. Sur Biens, elle est posée juste au-dessus du champ « Rue, ville, code postal… » : deux champs de recherche empilés pour deux choses différentes. Sur les fiches, elle repousse le nom sous le lien de retour.
- **Décision.** Au téléphone et à la tablette, la barre reste sur l'accueil. Ailleurs, elle devient une loupe ronde à droite du titre de la page (ou de l'en-tête de fiche), qui ouvre la même recherche ; ⌘K et Ctrl K ne changent pas. L'ordinateur garde la recherche dans sa colonne.
- **Où.** `App.tsx`, `MiseEnPage.tsx`, `Page.tsx`, `BarreRecherche.tsx`, `RechercheGlobale.tsx`.

### 11. Fiche Bien : la prochaine tâche une seule fois

- **Constat.** « Visite T3 avec Dominique » est en « Prochaine tâche », puis à l'identique dans « À venir », 300 px plus bas ; la fiche Contact, elle, ne répète pas sa prochaine action. Le carré gris de 80 px (une maison) à côté du statut est le même pour tous les biens sans photo et décale le titre.
- **Décision.** « À venir » exclut la prochaine tâche, comme sur la fiche Contact ; s'il ne reste rien : « Rien d'autre de prévu ». Sans photo, pas de carré : statut et type passent au-dessus de l'adresse. Avec une photo, elle s'affiche comme aujourd'hui.
- **Où.** `FicheBien.tsx`, `PhotoPrincipale.tsx`, `SectionTaches`.

### 12. Ordinateur : « Créer » cède le bleu à la page

- **Constat.** « Créer », dans la colonne de gauche, est bleu plein sur tous les écrans, en plus du bouton bleu de la page (« Ajouter », « Projet vendeur », « Appeler » sur les fiches). La règle 2 n'est donc tenue nulle part sur ordinateur.
- **Décision.** « Créer » devient un bouton blanc bordé, avec son « + » et la touche N : il fait partie du cadre. Le bouton de la page garde le bleu.
- **Où.** `BoutonCreer.tsx`, `Navigation.tsx`.

### 13. L'historique se filtre par pastilles

- **Constat.** « Afficher : Tous les types » est une liste déroulante du système, seul contrôle de ce genre sur les fiches. Elle s'affiche même quand l'historique est vide ou ne contient qu'un type, avec le lien « Tout le journal ». Le Journal empile deux listes déroulantes (Période, Type).
- **Décision.** Une rangée de pastilles qui défile, avec sa légende : « Tout », puis seulement les types présents, avec leur nombre (« Appels 3 »). Masquée sous quatre échanges ; un historique vide se résume à une phrase, sans filtre ni lien. Dans le Journal, la même rangée, et la période en commande segmentée (« 7 j · 30 j · 3 mois · Tout »).
- **Où.** `SectionJournal.tsx`, `HistoriqueParJour.tsx`, `historique.ts`, `Journal.tsx`, `periodes.ts`.

### 14. En-tête de la fiche Contact sans ligne orpheline

- **Constat.** Au téléphone, « Dernier échange il y a 7 jours · appel, joint » se coupe et laisse « · appel, joint » seul sur une ligne qui commence par un point. Les initiales, centrées sur trois lignes, flottent à mi-hauteur.
- **Décision.** Une formule courte qui tient sur une ligne : « Appel joint · il y a 7 j » (« Jamais contacté » sinon). Les initiales alignées en haut, à la hauteur du nom. Même alignement sur les fiches Bien et Projet.
- **Où.** `IdentiteContact.tsx`, `ProfilFiche.tsx`, `ordre-journee.ts` (la phrase du dernier échange).

### 15. La même pastille de retard partout

- **Constat.** Au téléphone, Tâches porte un point rouge sans chiffre ; à la tablette et à l'ordinateur, un « 3 ». Le point seul ne dit pas si l'on a un retard ou quinze.
- **Décision.** Le chiffre partout, plafonné à « 9+ », posé sur le dessin sans changer la hauteur de la barre du bas. Toucher l'entrée mène aux retards (proposition 1).
- **Où.** `Navigation.tsx`.

### 16. Formulaire Contact : le prénom d'abord

- **Constat.** Le formulaire s'ouvre sur deux listes déroulantes (« Type : Personne », « Civilité : Non précisée ») avant le nom ; Nom vient avant Prénom alors que l'application affiche partout « Prénom Nom ».
- **Décision.** Prénom puis Nom en tête. Civilité en commande segmentée (« Mme · M. · — »). « C'est une société » en case à cocher sous les noms : cochée, elle ajoute la raison sociale en tête, et Prénom et Nom deviennent ceux de la personne à joindre, comme aujourd'hui. Le contact express suit déjà cet ordre.
- **Où.** `FormulaireContact.tsx`, `ChoixSegmente`.
