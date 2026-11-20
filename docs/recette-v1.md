# ImmoCRM — Recette de la version 1

Faite le 20 novembre 2026 (étape 1.14). La version 1 porte le numéro **1.0.0**.

Ce document confronte le [cadrage](cadrage.md) à ce qui a été construit, puis rend compte des vérifications faites (affichage, sécurité, performances, messages d'erreur). Il se termine par le scénario d'une journée type à dérouler sur le projet réel.

États : **fait** (conforme au cadrage), **partiel** (une partie manque, raison donnée), **prévu V2/V3/V4** (le cadrage le range lui-même dans une version suivante), **écarté** (choix à confirmer).

## 1. Ce que la version 1 devait contenir

Le cadrage (section Priorisation) fixe la V1 : contacts, biens de tous types, pipelines vendeur et acquéreur, tâches et relances, journal d'activité, écran Aujourd'hui, saisie rapide, affichage téléphone, tablette et ordinateur. Critère de réussite : le CRM est ouvert chaque matin pendant 3 semaines de suite.

### Contacts

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Fiche unique par personne ou société | fait | Contacts, étape 1.1 |
| Rôles multiples (vendeur, acquéreur, notaire, prescripteur…) | fait | Fiche Contact |
| Origine du contact (source et détail, recommandé par) | fait | Fiche Contact, rubrique « Origine du contact » |
| Température (chaud, tiède, froid, veille) et rythme de relance par défaut | fait | Fiche Contact ; délais modifiables dans Réglages |
| Étiquettes libres | fait | Fiche Contact, filtre de la liste |
| Détection des doublons, fusion de deux fiches | fait | À la création ; écran de fusion |
| Recherche instantanée (nom, téléphone sous tous formats, courriel, adresse) | fait | Champ en haut de toutes les pages ; voir mesures |
| Retrouver n'importe qui en 5 secondes, avec tout l'historique | fait | Recherche puis fiche : journal, tâches, projets, biens |
| Accord pour être appelé (date, preuve), blocage des numéros sans accord, client existant, opposition | fait | Étape 1.3 ; règles à faire valider par un juriste |
| Origine et date de collecte, export d'un contact, suppression définitive | fait | Fiche Contact |
| Purge ou anonymisation des fiches inactives (3 ans) | prévu V4 | Étape 4.6 |

### Biens

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Adresse, type principal (appartement, maison, terrain, commerce) et secondaire (ancien, neuf, viager), champs propres au type | fait | Fiche Bien, étapes 1.4 et 1.10 |
| Surface, prix, historique des prix, DPE et GES | fait | Fiche Bien |
| Photos (compressées, limitées) | fait | Étape 1.5, 20 photos par bien |
| Propriétaires liés (plusieurs, quote-part) | fait | Fiche Bien et fiche Contact |
| Bien en mandat, en veille ou simplement repéré | fait | Statut du bien |

### Pipeline vendeur

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Cinq étapes, du premier contact au mandat signé, avec critère de sortie vérifié | fait | Pipelines → Vendeurs, étape 1.9 |
| Estimation (fourchette, avis de valeur), motif, échéance, concurrence | fait | Fiche du projet de vente |
| Sorties « À recontacter » (avec date) et « Perdu » (avec motif), sans suppression | fait | Relance créée ; mandat concurrent qui expire : relance 15 jours avant |
| Mandat signé : le bien passe « en mandat » | fait | La fiche Mandat elle-même arrive en V2 (étape 2.1) |

### Pipeline acquéreur

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Quatre étapes, de la demande aux visites, critère de sortie vérifié | fait | Pipelines → Acquéreurs, étape 1.10 |
| Critères de recherche, budget, financement validé ou non, urgence | fait | Fiche du projet d'achat |
| Biens proposés et réaction, visites avec compte rendu structuré | fait | Rappel de l'acquéreur le lendemain proposé |
| Demande entrante d'un portail, qualifiée dans l'heure | fait | « + » → Nouvelle demande entrante ; bloc Nouveautés |
| Rapprochement automatique acquéreurs-biens | prévu V2 | Étape 2.7 |

### Tâches et relances

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Toute tâche a une date, presque toujours un contact ou un bien | fait | Page Tâches, rubriques Tâches des fiches |
| Rendez-vous = tâche avec une heure, un lieu | fait | Étape 1.6 |
| Récurrences (jour, semaine, deux semaines, mois, an) | fait | Clôturer crée la suivante |
| Clôturer une tâche crée une activité et propose la suivante | fait | Boucle de relance, étape 1.8 |
| Aucun contact sans prochaine action datée | fait | Boucle (refus confirmé explicitement), vue « Sans prochaine action », alerte |
| Temps de prospection bloqué comme un rendez-vous | fait | Tâche de catégorie « Prospection » avec une heure |
| Synchronisation avec l'agenda du téléphone | prévu V2 | Étape 2.9 |

### Journal d'activité

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Appels (avec résultat), SMS, courriels, visites, notes, rendez-vous, estimations, porte-à-porte, documents | fait | Rubrique Journal des fiches ; page Journal (Plus) |
| Horodaté sur la fiche, du plus récent au plus ancien | fait | Regroupé par jour, filtrable |
| Notes vocales | partiel | Dictée par le micro du clavier ; notes vocales transcrites prévues en V4 (étape 4.1) |

### Écran « Aujourd'hui »

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Page d'accueil, la journée dans l'ordre où elle se vit | fait | Étape 1.11 |
| Trois actions qui comptent (rituel du matin) | fait | Gardées pour la journée, sur tous les appareils |
| Agenda du jour : adresse, itinéraire, appeler, ouvrir la fiche | fait | Bloc Agenda |
| À relancer : appeler puis consigner en un geste | fait | « Appeler » ouvre aussitôt la boucle |
| Tâches : cocher, reporter | fait | Bloc Tâches |
| Tâches : déléguer | écarté | Usage strictement personnel, un seul compte (décision du 16/11/2026) : personne à qui déléguer. À confirmer |
| Alertes : vendeurs sans nouvelles depuis 15 jours | fait | Projets sans activité, contacts sans prochaine action, rappel d'export |
| Alertes : mandats qui expirent, conditions suspensives | prévu V2 | Étapes 2.2, 2.4 et 2.10 (il faut d'abord les mandats et les transactions) |
| Nouveautés : demandes entrantes des portails | fait | Temps écoulé, en rouge au-delà d'une heure |
| Nouveautés : nouveaux biens correspondant à un acquéreur | prévu V2 | Étape 2.7 |

### Saisie rapide

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Compte rendu en moins de 30 secondes, idéalement à la voix | fait | « + » → Nouvelle activité : 6 touchers, 1 champ (dictable au micro du clavier) |
| Seule porte d'entrée des données (pas d'import en V1) | fait | Contact express : 8 touchers, prochaine action comprise |
| Fiches consultées récemment, raccourcis clavier | fait | Étape 1.12 |

### Affichage et application

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Téléphone, tablette et ordinateur | fait | Parcours du 20/11/2026, section 2 |
| Mobile d'abord, faisable d'une main | fait | Navigation en bas, bouton « + » à portée de pouce |
| Installable sur l'écran d'accueil | fait | Manifeste et icônes ; pas de mode hors réseau (décision du cadrage) |
| Thème clair et sombre | fait | Suit le réglage de l'appareil |

### Socle (architecture, conformité)

| Point du cadrage | État | Où, ou pourquoi |
| --- | --- | --- |
| Site statique sur GitHub Pages, publié à chaque fusion | fait | Étape 0.2 |
| Un seul compte, inscriptions fermées | fait | Étape 0.3 |
| Sécurité portée par la base (règles d'accès par ligne) | fait | Vérifiée le 20/11/2026, section 3 |
| Données hébergées dans l'Union européenne | fait | Les deux projets sont en Irlande (eu-west-1) |
| Sauvegardes | partiel | Cadrage (Conformité) : « sauvegardées chaque jour ». Le plan a retenu une sauvegarde chiffrée **hebdomadaire** et un export manuel avec rappel à 7 jours. Passer à une sauvegarde quotidienne revient à changer une ligne du workflow : à décider |
| Modèles de messages, automatisations de la V2 (checklists, échéancier…) | prévu V2 | Étapes 2.5, 2.6, 2.8 |

**Bilan :** tout ce que le cadrage range en V1 est fait, sauf deux points partiels assumés (notes vocales, rythme des sauvegardes) et un point écarté à confirmer (déléguer). Aucun manque n'appelait de nouvelle fonction ; l'étape s'en tient aux corrections ci-dessous.

## 2. Parcours des écrans aux trois tailles

Fait le 20/11/2026 dans Chromium piloté par un automate, avec les données fictives du projet de test rejouées par un faux serveur (Supabase n'est pas joignable depuis l'environnement de Claude Code). Tailles : téléphone 390 × 844, tablette 820 × 1180, ordinateur 1440 × 900 ; thème clair, et sombre sur trois écrans.

Écrans parcourus (16 × 3) : Connexion, Aujourd'hui, Contacts, fiche Contact, modification d'un contact, fusion, Biens, fiche Bien, modification d'un bien, Pipelines, fiche d'un projet de vente, fiche d'un projet d'achat, Tâches, Plus, Journal, Réglages. Fenêtres ouvertes (7 × 3) : menu « + », nouveau contact, nouvelle activité, nouvelle tâche, nouveau bien, demande entrante, boucle de relance.

Contrôle automatique : page plus large que l'écran, élément qui dépasse à droite, contenu coupé, zone qui défile de côté, erreur dans la console. Puis chaque capture relue à l'œil.

| Défaut trouvé | Correction |
| --- | --- |
| Sur téléphone, en bas d'une page, la dernière ligne passait sous le bouton « + » (note de bas de la page Tâches, par exemple) | Marge du bas agrandie à la hauteur du bouton (`MiseEnPage`) |
| Sur ordinateur, le tableau des pipelines restait dans la colonne de lecture : cinq colonnes étroites, noms sur trois lignes, moitié de l'écran vide | La page Pipelines prend toute la largeur (`Page large`), colonnes un peu plus larges |

Constaté, laissé tel quel : sur tablette en portrait, le tableau des pipelines défile de côté (voulu : cinq colonnes ne tiennent pas) ; une des « trois actions » trop longue est coupée dans son champ (le texte entier reste lisible en le touchant).

## 3. Sécurité

Vérifiée le 20/11/2026.

| Vérification | Résultat |
| --- | --- |
| Chaque table a ses règles d'accès par ligne (13 tables, projet de test et projet réel) | Oui, sur les deux projets |
| Lecture sans session et par un autre compte (`supabase/tests/securite-acces.sql`, projet de test) | « OK » sur les 13 tables et l'espace photos : refus sans session, 0 ligne pour un autre compte |
| Écriture sans session et par un autre compte (nouveau test `supabase/tests/securite-ecriture.sql`, projet de test) | « OK » partout : ajout refusé, modification et suppression refusées ou sans effet (0 ligne) |
| Fonctions de la base | Aucune n'est appelable sans session ; toutes s'exécutent avec les droits de l'appelant (aucun contournement des règles) |
| Vues | Aucune |
| Alertes de sécurité de Supabase | Une seule, sur les deux projets : protection contre les mots de passe compromis désactivée (réglage d'Auth, à activer si l'offre le permet) |
| Clés dans le dépôt et son historique | Aucune clé d'administration ni clé publique réelle ; seuls des exemples (`sb_secret_exemple`) dans les tests ; `.env.local` ignoré par git |
| Données réelles dans le dépôt | Aucune : le projet réel n'a encore aucune fiche ; les données d'essai utilisent des tranches de numéros réservées aux fictions et le domaine `exemple.invalid` ; les seules images sont les icônes |

Le projet réel n'a été examiné que par sa structure (tables, migrations, alertes), jamais par son contenu.

## 4. Performances (30 063 contacts fictifs, projet de test)

Mesurées le 20/11/2026 dans les conditions d'un compte connecté (règles d'accès actives), page et nombre total lus comme le fait l'application. Temps de la base ; ajouter l'aller-retour par Internet (0,05 à 0,3 s).

| Opération | Page | Nombre total |
| --- | --- | --- |
| Liste des contacts, première page (50 fiches) | 0,3 ms | 5 ms |
| Recherche d'un nom (1 505 résultats) | 23 ms | 19 ms |
| Recherche de deux mots (38 résultats) | 19 ms | 18 ms |
| Recherche d'un début de téléphone (10 062 résultats) | 0,2 ms | 21 ms |
| Recherche sans résultat | 40 ms | 17 ms |
| Vue « Sans prochaine action » (30 044 fiches) | 0,2 ms | 5 ms |
| Filtres combinés (rôle, source, température) | 12 ms | — |
| Détection des doublons | 19 ms | — |
| Biens, première page | 0,2 ms | — |
| Tâches en retard | 0,2 ms | — |
| Aujourd'hui : agenda, relances, tâches, nouveautés | moins de 1 ms chacun | — |
| Aujourd'hui : contacts sans prochaine action | 37 ms | 15 ms |
| Aujourd'hui : projets sans activité | 2 ms | — |
| Pipelines : projets de vente en cours | 0,1 ms | — |

Conclusion : tout reste sous 0,05 seconde côté base, très en dessous des objectifs (une seconde pour une liste ou une recherche, deux pour l'écran Aujourd'hui). Le bloc des contacts sans prochaine action, le plus lent à l'étape 1.11 (200 ms), est passé à 50 ms.

## 5. Messages d'erreur

Revue du 20/11/2026 : tous les messages affichés sont en français. Trois défauts corrigés :

| Défaut | Correction |
| --- | --- |
| Les explications écrites par la base (« Proposez au moins un bien avant de passer aux visites. », « Cette tâche est déjà close. »…) étaient remplacées à l'écran par un message générique (« Une des informations saisies n'est pas acceptée ») | Elles s'affichent désormais telles quelles. Les messages techniques de PostgreSQL, en anglais, restent toujours masqués ; quatre messages internes peu parlants (« Sortie inconnue. »…) gardent le message générique |
| « Note illisible. », « Prochaine action illisible. » (contact express) | « Elle est peut-être trop longue : ajoutez-la depuis la fiche du contact. » et « Vérifiez son titre et sa date, puis ajoutez-la depuis la fiche du contact. » |
| « Durée illisible. » | « Durée non reconnue : choisissez-en une dans la liste. » |

## 6. Scénario de recette : une journée type sur le projet réel

À dérouler une première fois sur **téléphone**, puis une seconde sur **ordinateur**. Prévoir 30 minutes. Les noms sont à inventer (« Test Recette », par exemple) : à la fin, on archive ou on supprime ce qui a été créé.

**Avant de commencer**

1. Ouvrir l'application publiée. Plus → Réglages : la carte « Projet connecté » affiche **RÉEL**. Si elle affiche TEST, corriger la variable `VITE_SUPABASE_URL` du dépôt et republier.
2. Réglages → Sécurité → « Vérifier l'accès sans connexion » : « Sans connexion, aucune ligne n'est visible ».

**8 h 30 — le rituel du matin**

3. Ouvrir Aujourd'hui. La date du jour s'affiche. Écrire trois actions qui comptent ; en cocher une.
4. Ouvrir l'application sur l'autre appareil : les trois actions y sont.

**8 h 45 — un vendeur appelle**

5. « + » → Nouveau contact : prénom, nom, téléphone, source « Pige », température « Chaud », une première note. La prochaine action proposée est « Relancer … » dans une semaine : enregistrer. La fiche s'ouvre.
6. Sur la fiche, enregistrer son accord pour être appelé (« Enregistrer son accord ») : le bouton Appeler devient actif.
7. Projets de vente → « Nouveau projet vendeur » : créer le bien à la volée (adresse, type Maison, Ancien). Le projet apparaît dans Pipelines → Vendeurs, colonne Premier contact.

**9 h 15 — un rendez-vous d'estimation**

8. « + » → Nouvelle tâche : « Estimation », aujourd'hui, avec une heure, catégorie Estimation, liée au contact. Elle apparaît dans l'Agenda du jour d'Aujourd'hui avec l'adresse du bien ; « Itinéraire » ouvre la carte.
9. Pipelines : faire passer le projet en Découverte (rien n'est demandé : la source du contact est connue), puis en Estimation : l'application demande le motif et l'échéance. Pour aller en Suivi, elle demandera la fourchette d'estimation et la date de remise de l'avis de valeur.

**11 h — une demande arrive d'un portail**

10. « + » → Nouvelle demande entrante : un autre nom inventé, portail Leboncoin, « Demande à être rappelé ». Elle apparaît dans Nouveautés d'Aujourd'hui, avec le temps écoulé.
11. Ouvrir le projet d'achat, le passer en Qualification (budget), puis en Sélection (types, secteurs, financement). Proposer le bien de l'étape 7.

**14 h — une visite**

12. Sur le projet d'achat : « Planifier une visite » pour aujourd'hui. Cocher la visite (Aujourd'hui ou Tâches) : l'écran de compte rendu s'ouvre (points positifs et négatifs, intérêt, suite). Enregistrer : un rappel de l'acquéreur est proposé pour le lendemain.
13. Le compte rendu se lit sur la fiche du contact acquéreur, sur celle du bien et sur le projet.

**17 h — les relances**

14. Tâches → « Aujourd'hui » ou « En retard » : cocher une relance liée à un contact. La boucle demande le résultat, un compte rendu (dicté au micro du clavier), puis propose la prochaine action à la date que donne la température. Enregistrer : l'échange est au journal, la prochaine action est datée.
15. Dans la boucle d'une autre tâche, choisir « Ne rien prévoir » : il faut le confirmer.
16. « + » → Nouvelle activité, juste après un appel : la fiche consultée à l'instant est proposée d'emblée ; enregistrer en moins de 30 secondes.

**18 h — fin de journée**

17. Rechercher le premier contact par son nom, puis par la fin de son téléphone, depuis le champ en haut de page : il sort en moins d'une seconde.
18. Contacts → « Sans prochaine action » : seul le contact de l'étape 15 y figure, marqué « Confirmé le… ».
19. Réglages → « Exporter toutes mes données » : le fichier contient les contacts, biens, projets, tâches et activités saisis.

**Pour finir**

20. Archiver ou supprimer définitivement les fiches de recette (fiche Contact → « Supprimer définitivement… », qui emporte leurs tâches, journal et projets ; fiche Bien → Archiver).

Sur ordinateur, vérifier en plus : le tableau des pipelines occupe toute la largeur et le glisser-déposer d'une carte (par sa poignée) change l'étape ; les raccourcis « / » (recherche) et N (menu « + ») répondent.

Ce qui gêne en route est à noter pour l'étape 2.1.
