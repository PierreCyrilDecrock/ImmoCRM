# ImmoCRM — Recette de l'interface version 3

Faite le 25 novembre 2026 (étape D.8). Elle clôt les phases D (interface version 3), E (19 corrections de la [première revue de design](revue-design.md)) et F (16 propositions de la [deuxième](revue-design-2.md)).

Ce document reprend chaque élément promis, avec son état, puis rend compte des vérifications : les douze règles des deux revues écran par écran, le parcours automatisé aux trois tailles et dans les deux thèmes, le clavier seul, le lecteur d'écran, les gestes des saisies courantes et les temps d'affichage avec 30 000 contacts. Il se termine par les écarts corrigés pendant la recette et ce qu'il vous reste à vérifier.

États : **fait** (conforme), **corrigé en recette** (un écart trouvé et réparé à cette étape), **accepté** (un écart connu, gardé pour une raison donnée), **à décider** (un choix qui vous revient).

## En bref

- Tout ce que les étapes D.0 à D.7, les 19 corrections et les 16 propositions annonçaient est en place : **70 éléments sur 70**.
- La recette a trouvé et corrigé **14 écarts**, aucun bloquant (section 12) : des onglets à 40 px au lieu de 44, des liens de texte trop bas pour le doigt, le contour du clavier absent sur les champs de date, la liste de la recherche restée ouverte au clavier, le nom du contact écrit deux fois dans les relances et les tâches, des titres et des noms coupés au téléphone, deux lignes orphelines, deux boutons sur les lignes de demandes entrantes, un « Enregistrer » bleu sans rien à enregistrer, un double point et une élision manquante dans les messages, une phrase incomplète pour les lecteurs d'écran, une lecture en trop sur la fiche Contact.
- Aucun défilement de côté, aucun contraste insuffisant (mesurés sur chaque texte), aucune erreur dans la console, sur les trois tailles et dans les deux thèmes.
- Les saisies courantes demandent autant ou moins de gestes qu'à l'étape 1.12 : un compte rendu d'appel passe de 6 touchers à 3, un compte rendu de visite de 9 à 7.
- Avec 30 000 contacts, Aujourd'hui et la fiche Contact s'affichent en 0,1 s sur un bon réseau, et en 0,55 s et 1 s sur un réseau mobile lent ; la base répond en moins de 30 ms.

## 1. Comment la recette a été faite

Supabase n'est pas joignable depuis l'environnement de Claude Code pour l'application elle-même. Cette fois, plutôt qu'un faux serveur qui rejoue des réponses, la recette a monté **une vraie base PostgreSQL 16** dans l'environnement de travail, avec **les 17 migrations du dépôt** appliquées telles quelles (règles d'accès par ligne comprises), servie par PostgREST (le même moteur que Supabase) et une connexion simulée. Les requêtes de l'application s'exécutent donc pour de vrai, contraintes et déclencheurs compris.

- **Données fictives** : 13 contacts (dont une société, un contact sans accord pour être appelé, un nom très long), 7 biens de tous types, 5 projets de vente et 5 d'achat à toutes les étapes, 17 tâches (rendez-vous du jour, relances en retard, tâche récurrente), 12 échanges au journal. Noms inventés, téléphones dans la tranche 06 39 98 réservée aux fictions, courriels en `exemple.invalid`.
- **Heure figée** dans le navigateur : mercredi 25 novembre 2026, 10 h 20.
- **Navigateur** : Chromium piloté par un automate. Téléphone 390 × 844 (tactile), tablette 820 × 1180 (tactile), ordinateur 1440 × 900 (souris) ; thème clair et thème sombre.
- **Temps de la base** : mesurés sur le projet de test Supabase, qui garde ses 30 071 contacts fictifs, dans les conditions d'un compte connecté.

Ce qui ne remplace pas votre essai : le vrai téléphone (le doigt, le clavier du système, la dictée), le réseau réel, le projet réel.

## 2. Les étapes D.0 à D.7

| Étape | Élément | État | Où, ou remarque |
| --- | --- | --- | --- |
| D.0 | Style version 3 : fond gris chaud, cartes blanches, encre presque noire, un seul bleu, police Inter | fait | Tous les écrans |
| D.0 | Thème sombre, qui suit le réglage de l'appareil | fait | Parcouru sur tous les écrans (section 7) |
| D.0 | Contour bleu au clavier partout | corrigé en recette | Il manquait sur les champs de date (section 7) |
| D.1 | Reporter en un geste (demain, dans 3 jours, lundi, autre date), avec « Annuler » | fait | Derrière l'horloge depuis E.3 ; au survol sur ordinateur |
| D.1 | Copier un numéro, un courriel, une adresse | fait | Fiche Contact (Infos au téléphone), fiche Bien |
| D.1 | Glisser une ligne pour Reporter ou Fait, sur écran tactile | fait | Tâches et Aujourd'hui ; jamais le seul chemin (section 9) |
| D.2 | Colonne de gauche sur ordinateur : recherche (⌘K, Ctrl K, « / »), six entrées, consultés récemment, « Créer » (N), état d'enregistrement, version | fait | |
| D.2 | Nombre de retards sur l'entrée Tâches, lu « Tâches, 3 en retard » | fait | Le chiffre partout depuis F.1 |
| D.3 | En-tête d'Aujourd'hui : date et semaine, « Bonjour » et le nom | fait | |
| D.3 | La journée résumée | fait | En compteurs à toucher depuis F.2 ; la phrase reste pour les lecteurs d'écran |
| D.3 | Progression « 3 sur 7 faits » et anneau | fait | L'anneau n'apparaît qu'au premier geste (E.2) |
| D.3 | Carte « Maintenant » : prochain rendez-vous, temps restant, Appeler, Itinéraire, fiche, « À préparer » | fait | |
| D.3 | Trait rouge « maintenant » dans l'agenda, rendez-vous passés estompés | fait | |
| D.3 | Trois actions à côté de la carte sur ordinateur, dessous ailleurs | fait | |
| D.4 | « À rappeler », la plus urgente en premier : qui, pourquoi, depuis quand | corrigé en recette | Le motif ne répète plus le nom (section 6) |
| D.4 | Filtre Tous, Vendeurs, Acquéreurs, gardé sur l'appareil, compteur qui suit | fait | |
| D.4 | Reporter ou clore sans quitter l'écran (survol, glisser, ligne dépliée) | fait | |
| D.4 | Bloc Tâches groupé « En retard » puis « Aujourd'hui » | fait | Devenu « Autres tâches » (E.2) |
| D.5 | Fiche Contact sur ordinateur : profil toujours visible, onglets avec compteurs, touches 1 à 4 | fait | |
| D.5 | Téléphone et tablette : en-tête compact, onglets (Infos compris), barre Appeler, SMS, Consigner | fait | |
| D.5 | Onglet gardé dans l'adresse ; contact précédent et suivant (J, K) depuis la liste | fait | |
| D.6 | Consigner un échange dans la fiche, sans fenêtre, ⌘ Entrée ou Ctrl Entrée | fait | Déroulé au clavier seul (section 8) |
| D.6 | Brouillon gardé sur l'appareil et repris au retour | fait | |
| D.6 | Historique groupé par jour, à venir | fait | |
| D.7 | Fiche Bien : photo, adresse avec Copier et Itinéraire, prix, propriétaires, prochaine tâche, onglets, barre du bas | fait | |
| D.7 | Fiches Projet : frise des étapes, « Passer à … », contact et bien liés, onglets, barre du bas | fait | |
| D.7 | Consigner depuis un bien ou un projet (« Avec », « Sans contact ») | fait | |

## 3. Les 19 corrections de la première revue (phase E)

| N° | Correction | État | Vérifié |
| --- | --- | --- | --- |
| 1 | Une relance tient en une ligne | fait | 64 à 72 px au téléphone ; un nom très long passe désormais sur deux lignes au lieu d'être coupé |
| 2 | Les reports s'effacent derrière les tâches | fait | Une horloge par ligne, au survol sur ordinateur |
| 3 | L'agenda devient une frise, sans doublon | fait | Le rendez-vous de la carte est estompé, pas répété |
| 4 | Le bloc Tâches ne contredit plus la pastille | fait | « Autres tâches » ; le vert attend une journée finie |
| 5 | La prochaine action n'a plus l'air faite | fait | Case ronde vide sur les quatre fiches |
| 6 | Un seul bouton bleu, une seule façon de créer | corrigé en recette | « Enregistrer » d'un formulaire de modification restait bleu sans changement (section 6) |
| 7 | Fiche Projet : l'étape une fois, l'action devant | fait | |
| 8 | Pipelines : des cartes qu'on distingue | fait | Le bien en titre d'une vente, l'acquéreur d'un achat |
| 9 | Liste des contacts : prénom, nom et un repère | fait | |
| 10 | Fiche Contact : l'historique remonte | fait | Consigner replié en une ligne au téléphone |
| 11 | Onglets coupés : montrer qu'il y a une suite | fait | Fondu sur le bord |
| 12 | Chaque groupe de pastilles porte son nom | fait | « Type d'échange », « Avec », « Afficher » |
| 13 | Le statut d'un bien se lit d'un coup d'œil | fait | |
| 14 | Carte « Maintenant » : deux gestes côte à côte | corrigé en recette | Le titre-lien de la carte fait maintenant 44 px de haut |
| 15 | Un anneau vide ne s'affiche pas | fait | |
| 16 | « Trois actions » : des exemples, puis compact | fait | |
| 17 | La recherche dit la même chose partout | fait | « Rechercher un contact » |
| 18 | Une colonne de profil plus large sur ordinateur | fait | |
| 19 | La page du développeur quitte le menu Plus | fait | Toujours à `#/plus/composants` |

## 4. Les 16 propositions de la deuxième revue (phase F)

| N° | Proposition | État | Vérifié |
| --- | --- | --- | --- |
| 1 | La pastille rouge mène aux retards | fait | Tâches s'ouvre sur « À faire », « En retard » en tête |
| 2 | Un bien montre son prix et son adresse | fait | Le prix en encre, jamais coupé |
| 3 | Le haut de l'accueil laisse voir la journée | corrigé en recette | « 2 sur 12 faits. » ne laisse plus « faits. » seul sur une ligne |
| 4 | Agenda : des titres lisibles, rien en double | corrigé en recette | Un titre long passe sur deux lignes au lieu d'être coupé |
| 5 | Contacts sans suite : une ligne chacun | fait | |
| 6 | Fiche Projet : une seule invitation à planifier | fait | |
| 7 | Fiche Projet : une frise lisible au téléphone | corrigé en recette | La ligne « Étape 2 sur 5 · » ne se coupe plus sur son point |
| 8 | Pipelines : la valeur et le jour sur chaque carte | fait | |
| 9 | Contacts : la température garde sa place | fait | |
| 10 | Une seule recherche par écran | fait | |
| 11 | Fiche Bien : la prochaine tâche une seule fois | fait | |
| 12 | Ordinateur : « Créer » cède le bleu à la page | fait | |
| 13 | L'historique se filtre par pastilles | fait | |
| 14 | En-tête de la fiche Contact sans ligne orpheline | fait | |
| 15 | La même pastille de retard partout | fait | |
| 16 | Formulaire Contact : le prénom d'abord | fait | |

## 5. La section « L'interface » du cadrage

| Engagement | État | Comment il a été vérifié |
| --- | --- | --- |
| Voir l'essentiel sans chercher | fait | Au téléphone, le premier écran d'Aujourd'hui montre la journée en compteurs, la carte « Maintenant » et le début de l'agenda |
| Agir en un geste | fait | Section 10 (gestes des saisies) |
| Ne jamais se perdre | fait | Lien de retour sur chaque fiche, onglet gardé dans l'adresse, retour du navigateur |
| 1. Chaque geste rapide a un équivalent visible | fait | Section 9 |
| 2. Tout se fait au clavier, et ce qui a le clavier se voit | corrigé en recette | Journée type au clavier seul ; contour ajouté aux champs de date |
| 3. Tout ce qui se touche fait au moins 44 px | corrigé en recette | Onglets et commandes segmentées passés de 40 à 44 px, liens de texte prolongés à 44 px |
| 4. Les contrastes sont vérifiés dans les deux thèmes | fait | Mesurés sur chaque texte affiché : aucun sous 4,5:1 (3:1 pour un grand texte) |
| Tableaux des phases D, E et F | fait | Sections 2 à 4 |

## 6. Les douze règles des deux revues, écran par écran

Vérifiées sur les 21 écrans et leurs onglets (Aujourd'hui, Contacts, fiche Contact, modification, fusion, Biens, fiche Bien, modification, Pipelines, fiches Projet de vente et d'achat, Tâches, Plus, Journal, Réglages) et sur 18 fenêtres, aux trois tailles. Le nombre de boutons bleus et d'entrées de création a été compté par l'automate sur chaque écran.

| Règle | Résultat | Remarque |
| --- | --- | --- |
| 1. Un seul geste visible par ligne de liste | corrigé en recette | Relances : Appeler ; agenda : aucun bouton ; tâches : l'horloge ; contacts sans suite : Planifier. **Les demandes entrantes et les projets sans nouvelles portaient deux boutons** (Appeler et Qualifier, Appeler et Ouvrir le projet) : la ligne ouvre désormais la fiche, seul le rond Appeler reste |
| 2. Un seul bouton bleu au repos | corrigé en recette | **« Enregistrer » des pages de modification d'un contact et d'un bien était bleu sans rien à enregistrer** : il est blanc jusqu'au premier changement. Le « + » flottant du téléphone et de la tablette reste bleu (voir section 13) |
| 3. Une seule façon de créer | fait | Téléphone et tablette : le « + » seul, qui crée ce que montre la page ; ordinateur : le bouton d'en-tête et « Créer ». « Ajouter une tâche » d'une fiche crée une tâche liée à cette fiche : gardé |
| 4. Rien d'écrit deux fois | corrigé en recette | **Le nom du contact était répété** sous lui-même dans « À rappeler » (« Léa Fausse » puis « Relancer Léa Fausse ») et dans les lignes de tâches (« Relancer Léa Fausse · Léa Fausse ») |
| 5. Une tâche à faire a sa case ronde | fait | Partout, prochaine action comprise |
| 6. Aucun message vide qui contredit l'écran | fait | « Autres tâches » renvoie aux relances et rendez-vous restants ; le vert attend une journée finie |
| 7. Chaque groupe de pastilles porte son nom | fait | « Type d'échange », « Avec », « Résultat de l'appel », « Afficher », « Période » |
| 8. Un contenu coupé se signale par un fondu | fait | Onglets ; ailleurs, voir section 7 |
| 9. Chaque compteur mène à ce qu'il compte | fait | Compteurs d'Aujourd'hui (vérifié au clavier : Entrée pose le clavier sur le bloc), pastille de Tâches vers « À faire », compteurs des onglets de fiche et de pipeline |
| 10. Aucune absence en rouge ou en orange sans risque réel | fait | « Prix à fixer », « Prix à connaître », « Budget à préciser », « Jamais contacté », « Rien de prévu » en gris ; la carte orange d'une fiche Projet seulement quand le contact n'a rien de prévu nulle part |
| 11. Aucun prix, retard ou heure coupé | fait | Toujours en tête de leur ligne ; aucun n'apparaît dans les textes coupés relevés par l'automate |
| 12. Aucune tâche montrée deux fois | fait | Prochaine action exclue d'« À venir » (fiches Contact et Bien) ; « À préparer » exclu d'« Autres tâches » |

## 7. Parcours automatisé aux trois tailles, en clair et en sombre

Chaque écran, chaque onglet de fiche, de liste et de pipeline, et 18 fenêtres (menu de création, contact express, nouvelle activité, nouvelle tâche, nouveau bien, demande entrante, recherche, relance dépliée, compte rendu de relance, reports, trois actions, température, menu « … » d'une fiche et d'un projet, compte rendu déplié, passage d'étape, liste des étapes, planifier une visite), au téléphone, à la tablette et à l'ordinateur, en clair et en sombre : **355 vues contrôlées**.

| Contrôle | Méthode | Résultat |
| --- | --- | --- |
| Défilement de côté | Largeur de la page et de chaque élément comparée à l'écran | Aucun |
| Contrastes | Couleur de chaque texte affiché comparée à son fond réel (calques et transparences compris) : 4,5:1, ou 3:1 pour un grand texte | **Aucun texte sous le seuil**, dans les deux thèmes |
| Cibles tactiles | Hauteur et largeur de chaque bouton, lien, onglet, case et champ | **Aucune sous 44 px** après correction. Avant : les segments des onglets et des commandes segmentées (40 px), les liens de texte des fiches (20 px) et le titre de la carte « Maintenant » (30 px) |
| Textes coupés | Tout texte terminé par « … » ou coupé par la ligne | Plus aucun titre, nom, prix, retard ni heure coupé. Restent 25 lignes secondaires terminées par « … » : la ligne de détail grise d'une tâche ou d'un échange (adresse, contact), les sous-titres du menu de création, deux noms longs de « Consultés récemment » sur ordinateur (section 13) |
| Noms des commandes | Tout bouton, lien ou champ sans nom lisible | Aucun (trois champs repliés dans le volet « Heure, type et motif » du compte rendu, qui ont bien leur libellé, sont comptés à tort) |
| Contour du clavier | 40 appuis sur Tab sur chaque écran de l'ordinateur | Contour visible sur chaque élément atteint, sur les 21 écrans, après la correction des champs de date |
| Erreurs | Console du navigateur | Aucune |

Captures relues à l'œil sur les écrans principaux. Deux défauts vus seulement à l'œil ont été corrigés : « faits. » seul en fin d'en-tête d'Aujourd'hui, et « Étape 2 sur 5 · » coupé sur son point dans la frise d'un projet au téléphone.

## 8. Au clavier seul : la journée type

Déroulée sur ordinateur, sans souris, sur la base de recette :

| Temps | Touches | Résultat |
| --- | --- | --- |
| Aujourd'hui → « À rappeler » | 10 × Tab jusqu'au compteur « 5 à rappeler », Entrée | L'écran descend au bloc, le clavier sur son titre |
| Une relance | 4 × Tab, Entrée | La fiche du contact s'ouvre |
| La fiche → le compte rendu | 25 × Tab jusqu'au champ « Qu'avez-vous échangé… » (le profil vient d'abord) | Texte tapé |
| Le résultat | Tab, Espace | « Joint » choisi |
| Enregistrer | Ctrl Entrée | Échange au journal, relance close, la suivante créée à une semaine (contact chaud) |
| Le retour | Maj Tab jusqu'à « Aujourd'hui » dans la colonne, Entrée | Retour à l'accueil |

Le contour bleu était visible à chaque étape. Un défaut a été trouvé en chemin : **la liste « Consultées récemment » de la recherche restait ouverte quand le clavier traversait le champ**, même après un changement de page ; elle cachait le haut de la fiche et avalait le clic suivant. Elle se referme désormais quand le focus part ailleurs ou que la page change.

## 9. Lecteur d'écran

Vérifié sur l'arbre d'accessibilité (ce que lit VoiceOver ou TalkBack) d'Aujourd'hui, Contacts, la fiche Contact, Biens, Pipelines, une fiche Projet, Tâches et le Journal, au téléphone et à l'ordinateur.

| Élément | Ce qui est lu | État |
| --- | --- | --- |
| Boutons à dessin seul | « Rechercher un contact », « Autres actions sur la fiche », « Modifier », « Reporter « … » », « Marquer « … » comme faite », « Appeler Léa Fausse », « Planifier une action avec … », « Saisie rapide : créer un contact… » | fait |
| Onglets | « Activité 5 », « Infos », « Tâches 3 » (sélectionné annoncé), « Semaine, jusqu'à dimanche 3 » | fait |
| Anneau de progression | « Progression de la journée : 2 tâches faites sur 12 prévues. », annoncé quand il change ; le dessin est caché | fait |
| Compteurs d'Aujourd'hui | « 5 à rappeler, certains en retard : aller à « À rappeler » » | corrigé en recette (« dont en retard » ne se disait pas) |
| Pastilles | Filtre « Afficher » : « Tous les types, 5 », « Appels, 2 » (enfoncée annoncée) ; température « Température : chaud, changer » ; retard « En retard de 6 jours » | fait |
| Navigation | « Tâches, 3 en retard » | fait |
| Équivalent visible de chaque geste glissé | Relance : toucher la ligne la déplie (Consigner, Fait, Fiche, reports) ; tâche : la case ronde et l'horloge « Reporter » ; ordinateur : au survol et au clavier | fait |

## 10. Les gestes des cinq saisies courantes

Recomptés au téléphone (390 × 844, tactile) avec l'automate, comme à l'étape 1.12 : un geste est un toucher ; le premier champ d'une fenêtre a déjà le curseur.

| Saisie | Étape 1.12 | Recette D.8 | Écart |
| --- | --- | --- | --- |
| Nouveau contact complet (prénom, nom, téléphone, source, température, note, prochaine action proposée) | 8 touchers, 4 champs | 8 touchers, 4 champs depuis n'importe quelle page ; **7** depuis Contacts, où le « + » ouvre directement le formulaire | égal (− 1 depuis Contacts) |
| Compte rendu d'un appel, juste après | 6 touchers, 1 champ | **3 touchers, 1 champ** depuis la fiche : Consigner (barre du bas), Joint, Enregistrer ; la relance suivante est proposée | **− 3** |
| Compte rendu de visite (points positifs et négatifs, intérêt, suite, rappel du lendemain) | 9 touchers, 2 champs | **7 touchers, 2 champs** depuis la fiche de l'acquéreur : Consigner, Visite, les deux champs, intérêt, suite, Enregistrer | **− 2** |
| Nouvelle tâche (titre et date) | 4 touchers, 1 champ | 4 touchers, 1 champ ; pour aujourd'hui, **1 toucher et Entrée** par l'ajout rapide de la page Tâches | égal |
| Demande entrante d'un nouvel acquéreur (nom, téléphone, portail, appel de qualification du jour) | 6 touchers, 4 champs | 6 touchers, **3 champs** (le portail se choisit d'un toucher) | − 1 champ |

Au passage, deux défauts de texte ont été corrigés dans les messages de confirmation : « Prochaine action : ven. 27 nov.. » (deux points) et « Qualifier la demande de Alix … » (au lieu de « d'Alix »).

## 11. Temps d'affichage avec 30 000 contacts

**Côté base**, sur le projet de test Supabase (30 071 contacts fictifs), dans les conditions d'un compte connecté, meilleur de cinq essais :

| Lecture | Temps |
| --- | --- |
| Aujourd'hui : contacts sans prochaine action (page, puis nombre total) | 26 ms, 13 ms |
| Aujourd'hui : projets sans activité | 2 ms |
| Aujourd'hui : agenda, relances, tâches, nouveautés, trois actions, pastille des retards, dernier échange des contacts à rappeler | moins de 0,3 ms chacune |
| Fiche Contact : la fiche, ses cinq compteurs, le dernier échange, l'historique, les tâches, les biens | moins de 0,2 ms chacune |

**À l'écran**, sur le site construit comme en production, avec 30 013 contacts fictifs chargés dans la base de recette (moyenne de cinq essais, du changement de page à l'affichage complet) :

| Écran | Réseau local | 150 ms par requête (réseau mobile moyen) |
| --- | --- | --- |
| Aujourd'hui | 0,1 s | 0,55 s |
| Fiche Contact | 0,1 s | 1,0 s (1,3 s avant la correction ci-dessous) |

Les deux objectifs (Aujourd'hui sous deux secondes, une fiche ou une liste sous une seconde avec un réseau correct) sont tenus. La fiche Contact lisait d'abord le contact, puis ses appels sans accord et ses biens : ces deux lectures partent désormais avec la première, ce qui retire un aller-retour. Il en reste cinq en cascade (voir section 13).

## 12. Écarts corrigés pendant la recette

| N° | Écart | Correction | Où |
| --- | --- | --- | --- |
| 1 | Onglets et commandes segmentées de 40 px de haut | 44 px | `Onglets`, `ChoixSegmente` |
| 2 | Liens de texte (numéro, courriel, contact ou bien lié, adresse d'un bien proposé) de 20 px de haut | Zone invisible de 44 px, sans changer la mise en page ; cinq copies locales remplacées par la constante commune | `CLASSES_LIEN` (`coordonnees.ts`) |
| 3 | Titre-lien de la carte « Maintenant » de 30 px | 44 px | `CarteMaintenant` |
| 4 | Pas de contour au clavier sur les champs de date | `focus-within` sur tous les champs | `champ-commun.ts` |
| 5 | Résultats de la recherche restés ouverts après Tab ou un changement de page (ordinateur) | Se referment | `RechercheGlobale` |
| 6 | Nom du contact répété dans « À rappeler » et dans les lignes de tâches | Le motif, ou le titre sans le nom | `motifRelance`, `titreSansNom` |
| 7 | Titres et noms coupés au téléphone (agenda, relances, contacts, alertes, tâches, état d'un projet, Plus) | Deux lignes (trois pour un titre de tâche ou de rendez-vous) | `LigneRendezVous`, `LigneRelance`, `LigneContact`, `LigneAlerte`, `LigneTache`, `LigneListe` |
| 8 | « faits. » et « Étape 2 sur 5 · » seuls en fin de ligne au téléphone | Morceaux insécables ; frise résumée en « **Découverte** · depuis 12 j », puis « Étape 2 sur 5 · Ensuite : Estimation » | `Aujourdhui`, `BarreEtapes` |
| 9 | Demandes entrantes et projets sans nouvelles : deux boutons par ligne | La ligne ouvre la fiche, le rond Appeler seul | `LigneNouveaute`, `LigneAlerte` |
| 10 | « Enregistrer » bleu sans rien à enregistrer | Blanc jusqu'au premier changement | `ModifierContact`, `ModifierBien`, `brouillonModifie` |
| 11 | « Prochaine action : ven. 27 nov.. » | Un seul point | `phraseProchaineAction` (quatre messages) |
| 12 | « de Alix », « de Hugo » | « d'Alix », « d'Hugo » | `deNom` (neuf textes) |
| 13 | Lecteur d'écran : « dont en retard » sans nombre | « certains en retard » | `CompteursJournee` |
| 14 | Fiche Contact : une lecture de trop en cascade | Lancée avec la première | `FicheContact` |

Chaque calcul ajouté a ses tests (`brouillonModifie`, `motifRelance`, `titreSansNom`, `phraseProchaineAction`, `deNom`, détail des lignes de tâches) ; aucune migration.

## 13. Ce qui reste, accepté ou à décider

| Sujet | État | Pourquoi |
| --- | --- | --- |
| Le « + » flottant est bleu sur téléphone et tablette, à côté du bouton bleu de la page (Appeler de la carte « Maintenant », Itinéraire d'une fiche Bien) | à décider | Les deux revues l'ont gardé : c'est l'entrée de création, à portée de pouce, et la règle 2 a été appliquée au « Créer » de l'ordinateur seulement. Le passer en blanc bordé, comme « Créer », tiendrait la règle à la lettre au prix d'un bouton moins visible |
| Lignes de détail grises coupées par « … » au téléphone (adresse, nom du contact, motif après le retard) | accepté | Une ligne de liste garde sa hauteur ; l'heure, le retard et le prix viennent en tête et ne sont jamais coupés ; le texte entier est sur la fiche |
| Noms longs coupés dans « Consultés récemment » (colonne de l'ordinateur) | accepté | Raccourci de navigation de 256 px ; le nom entier est sur la fiche |
| 25 appuis sur Tab pour aller du haut d'une fiche au champ « Consigner » sur ordinateur | à décider | Le profil vient d'abord. Un raccourci (par exemple une touche qui place le curseur dans le compte rendu) serait une petite évolution, hors de cette recette |
| Fiche Contact : cinq allers-retours successifs (la fiche, ses biens, ses tâches et son historique, puis les fiches liées) | accepté | 1 s avec un réseau lent, 0,1 s avec un bon réseau. Les regrouper demanderait de réorganiser la lecture des onglets : à revoir si la fiche paraît lente à l'usage |
| Choisir « Visite » dans le compte rendu quand une visite est prévue ce jour ouvre la clôture de cette visite (fenêtre « Tâche faite ») | accepté | C'est la même boucle que la case ronde : la visite prévue est close et son compte rendu rangé au bon endroit |
| Tablette en hauteur : le tableau des pipelines défile de côté | accepté | Voulu depuis la recette V1 : cinq colonnes ne tiennent pas ; la page elle-même ne défile pas |

## 14. À vérifier vous-même

Sur le site publié, avec le projet réel :

1. **Le rituel du matin, sur téléphone** : ouvrir Aujourd'hui, toucher le compteur « à rappeler », lire les relances (le motif sous le nom, jamais le nom deux fois), choisir les trois actions.
2. **Une journée type, sur téléphone** : appeler une relance, consigner l'échange depuis la fiche (Consigner en bas, le résultat, Enregistrer), vérifier que la suivante est proposée ; créer un contact par le « + » ; planifier une visite et la clore.
3. **Le thème sombre, le soir** : passer le téléphone en sombre ; la carte « Maintenant », les pastilles et les montants restent lisibles.
4. **Les gestes** : reporter une tâche (l'horloge, puis Demain) et « Annuler » ; copier un numéro dans l'onglet Infos et le coller ailleurs ; glisser une relance vers la gauche (Reporter, Fait) ; consigner depuis la fiche d'un bien.
5. **Les corrections de cette recette** : les onglets se touchent plus facilement ; un numéro de téléphone dans Infos se touche sans viser ; une demande entrante s'ouvre en touchant sa ligne ; « Enregistrer » d'un formulaire de modification ne passe au bleu qu'après un changement.
6. **Sur ordinateur**, au clavier : Tab traverse la recherche sans laisser sa liste ouverte ; Ctrl Entrée enregistre un compte rendu.
