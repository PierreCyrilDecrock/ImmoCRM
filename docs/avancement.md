# ImmoCRM — Avancement

Ce tableau suit les 45 étapes du [plan de développement](plan-developpement.md). Il est mis à jour à la fin de chaque étape.

États possibles : **à faire**, **en cours**, **terminée**. Une étape est « terminée » quand sa pull request est ouverte ; elle n'est réellement acquise qu'une fois vos vérifications faites et la pull request fusionnée dans `main`.

## Résumé

| Phase | Étapes terminées | État |
| --- | --- | --- |
| Phase 0 — Fondations | 5 sur 5 | terminée |
| Version 1 — Le quotidien | 13 sur 14 | en cours |
| Version 2 — Les dossiers | 0 sur 11 | à faire |
| Version 3 — Le pilotage | 0 sur 8 | à faire |
| Version 4 — Le confort | 0 sur 7 | à faire |

## Phase 0 — Fondations

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 0.1 | Socle du projet | terminée | 16/11/2026 | Squelette Vite, React, TypeScript, Tailwind ; page d'accueil provisoire en version 0.1.0 ; lint, tests et build en place. |
| 0.2 | Déploiement sur GitHub Pages | terminée | 16/11/2026 | Vérification automatique de chaque pull request ; publication sur GitHub Pages à chaque fusion dans `main` ; chemin de base `/ImmoCRM/`, modifiable par la variable `BASE_PATH`. |
| 0.3 | Supabase et connexion | terminée | 16/11/2026 | Connexion par courriel et mot de passe, déconnexion, session conservée, mot de passe oublié ; toutes les pages protégées ; configuration par variables (`.env.local` pour le test, variables GitHub pour le réel). |
| 0.4 | Coquille de l'application | terminée | 16/11/2026 | Navigation en bas (téléphone) ou à gauche (tablette, ordinateur), six pages vides, système de design décrit dans `docs/design.md`, thème clair et sombre, installation sur l'écran d'accueil, bandeau « Connexion perdue ». |
| 0.5 | Conventions de données et sécurité | terminée | 16/11/2026 | Conventions dans `docs/donnees.md` ; première migration (table `reglages`) appliquée sur le projet de test puis sur le projet réel ; couche d'accès aux données commune ; page Réglages (projet TEST ou RÉEL, nom affiché, contrôle d'accès sans connexion) ; test de sécurité `supabase/tests/securite-acces.sql`. |

## Version 1 — Le quotidien

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Contacts : fiche et liste | terminée | 16/11/2026 | Migration `0002_contacts` appliquée sur le projet de test puis sur le projet réel ; liste triée par nom, création rapide, fiche avec Appeler, SMS et Courriel, modification, archivage et restauration ; rôles multiples et étiquettes libres ; validation et formatage des téléphones français ; premier lot de 12 contacts fictifs. |
| 1.2 | Contacts : recherche, filtres, doublons | terminée | 16/11/2026 | Recherche faite par la base (nom, prénom, société, téléphone sous tous ses formats, courriel, adresse), sans accent ni majuscule ; champ de recherche en haut de toutes les pages ; liste lue 50 fiches à la fois ; filtres combinables (rôle, étiquette, source, température) gardés pendant la session ; alerte de doublon à la création ; écran de fusion de deux fiches. Migrations `0003_contacts_recherche` et `0004_contacts_recherche_ajustements` appliquées sur le projet de test (la 0004 collée à la main dans l'éditeur SQL : elle ne figure pas dans l'historique des migrations de Supabase), puis toutes deux sur le projet réel. Mesures ci-dessous. |
| 1.3 | Contacts : consentement et RGPD | terminée | 16/11/2026 | Sur chaque fiche : origine et date de collecte, accord pour être appelé (oui, non, inconnu) avec date et preuve, client existant, opposition au démarchage, date du dernier contact calculée par la base. Sans accord, le bouton Appeler est remplacé par un avertissement ; on passe outre en indiquant un motif, enregistré. Export d'un contact en fichier texte ; suppression définitive en deux confirmations. Migrations `0005_contacts_consentement` et `0006_contacts_consentement_ajustements` appliquées sur le projet de test, puis sur le projet réel. Règles juridiques à faire valider par un juriste. |
| 1.4 | Biens : fiche et liste | terminée | 16/11/2026 | Biens de tous types (ancien, neuf, viager, commerce ou local, terrain) : liste lue 50 fiches à la fois, recherche par morceau d'adresse, filtres combinables (type, statut, fourchette de prix), création rapide (adresse et type), fiche détaillée et formulaire qui n'affichent que les champs du type, DPE et GES, archivage. Propriétaires liés au bien (plusieurs possibles, quote-part facultative), cliquables, et retrouvés sur la fiche du contact. Historique des prix tenu par la base. Six biens fictifs ajoutés aux données d'essai. Migration `0007_biens` appliquée sur le projet de test, puis sur le projet réel. |
| 1.5 | Biens : photos | terminée | 16/11/2026 | Espace de stockage privé `photos-biens` (JPEG de 500 Ko au plus, accès réservé au propriétaire) et table `biens_photos`. Sur la fiche d'un bien : ajout depuis l'appareil photo ou la galerie, photo ramenée sous 300 Ko dans le navigateur (1 600 px au plus) avec une vignette, 20 photos au plus par bien, choix de la photo principale, ordre, suppression définitive. Images affichées par adresses valables 15 minutes ; vignette de la photo principale dans la liste des biens ; jauge de l'espace utilisé dans Réglages. Test de sécurité étendu au stockage. Migration `0008_biens_photos` appliquée sur le projet de test, puis sur le projet réel (17/11/2026). |
| 1.6 | Tâches et rendez-vous | terminée | 17/11/2026 | Table `taches` (un rendez-vous est une tâche avec une heure ; liens facultatifs vers un contact et un bien) et fonction `cloturer_tache`. Page Tâches : vues En retard, Aujourd'hui, Cette semaine, Plus tard, Terminées avec compteurs ; ajout rapide ; cocher, reporter (demain, 3 jours, une semaine, date libre), modifier, annuler, rouvrir. Récurrences (jour, semaine, deux semaines, mois, an) : clôturer crée la suivante, le 31 reste le 31 ou le dernier jour du mois. Rubrique Tâches sur les fiches Contact et Bien. Tâches incluses dans l'export, la fusion et la suppression d'un contact ; 6 tâches fictives. Migration `0009_taches` appliquée sur le projet de test, puis sur le projet réel (17/11/2026). Correction ensuite : sur iPhone, les champs date et heure débordaient du formulaire ; ils tiennent désormais dans leur colonne. |
| 1.7 | Journal d'activité | terminée | 17/11/2026 | Table `activites` (10 types, résultat d'un appel, compte rendu, date et heure, durée facultative, liens vers un contact et un bien). Rubrique Journal sur les fiches Contact et Bien : un bouton par type ouvre la saisie, curseur déjà dans le texte (dictée par le micro du clavier) ; fil du plus récent au plus ancien, regroupé par jour, filtrable par type ; correction et retrait d'une activité. Page Journal (Plus → Journal) filtrable par période et par type. La date du dernier contact suit le journal (sauf les notes). Journal inclus dans l'export, la fusion et la suppression d'un contact ; 8 activités fictives. Migration `0010_activites` appliquée sur le projet de test, puis sur le projet réel (17/11/2026). |
| 1.8 | Boucle de relance | terminée | 17/11/2026 | Cocher une tâche liée à un contact ouvre un écran en trois temps : résultat (joint, messagerie, pas de réponse), compte rendu court (écrit ou dicté), prochaine action préremplie à la date que donne la température (chaud 1 semaine, tiède 1 mois, froid 3 mois, veille 6 mois ; délais modifiables dans Réglages, date modifiable au cas par cas, température modifiable sur place). Un seul enregistrement fait tout (fonction `boucler_tache`) : tâche faite, activité au journal, prochaine action. Ne rien prévoir se confirme explicitement et marque le contact. Fiche Contact : prochaine action en tête (cochable sur place) ou avertissement avec « Planifier une relance ». Page Contacts : vue « Sans prochaine action » avec compteur. La date de la prochaine action est tenue par la base. Migration `0011_boucle_relance` appliquée sur le projet de test, puis sur le projet réel (17/11/2026). |
| 1.9 | Projets vendeurs et pipeline vendeur | terminée | 17/11/2026 | Table `projets_vendeurs` (vendeur, bien, étape et date d'entrée tenue par la base, motif, échéance, prix espéré, fourchette d'estimation, avis de valeur, concurrence, mandat signé : type et date ; état actif, à recontacter, perdu, gagné). Critères de sortie vérifiés par l'application et par la base : passer une étape demande ce qui manque (source du contact, motif et délai, fourchette et remise de l'avis, type et date du mandat). Sorties sans suppression (fonction `sortir_projet_vendeur`) : « À recontacter » crée la relance ; « Perdu » garde le motif et, si un mandat concurrent a une date de fin, prévoit une relance 15 jours avant. Page Pipelines, onglet Vendeurs : colonnes par étape avec glisser-déposer sur tablette et ordinateur, liste groupée sur téléphone, vues À recontacter, Perdus, Gagnés ; cartes avec vendeur, bien, ancienneté dans l'étape, prochaine action. Fiche du projet (étapes, sorties, tâches, journal). Création depuis une fiche Contact ou Bien, ou depuis Pipelines, avec création du bien à la volée. Tâches et activités liées à un projet ; projets dans l'export, la fusion et la suppression d'un contact ; 4 projets fictifs. Migration `0012_projets_vendeurs` appliquée sur le projet de test, puis sur le projet réel (17/11/2026). |
| 1.10 | Projets acquéreurs et pipeline acquéreur | terminée | 17/11/2026 | Table `projets_acquereurs` (acquéreur, co-acquéreur facultatif, étape et date d'entrée tenue par la base, origine : canal, portail, bien concerné, heure de réception ; recherche : types, secteurs, budget, surface et pièces minimum, critères indispensables et souhaités, urgence ; financement : comptant ou prêt, accord de principe, apport, bien à vendre avant ; état actif, à recontacter, perdu, gagné par l'offre acceptée) et table `biens_proposes` (date, réaction : intéressé, à visiter, refusé avec la raison). Critères vérifiés par l'application et par la base : entrer en Qualification demande l'origine et le budget, en Sélection les types, secteurs et le financement, en Visites un bien proposé ; l'offre acceptée demande une visite consignée. Demande entrante en un écran (contact nouveau ou existant avec alerte de doublon, portail, bien concerné, heure de réception, message, appel de qualification du jour). Visites : « Planifier une visite » crée le rendez-vous et note le bien « à visiter » ; le cocher ouvre la boucle avec le compte rendu structuré (points positifs et négatifs, intérêt, suite) et propose de rappeler l'acquéreur le lendemain ; le compte rendu apparaît sur les fiches du contact, du bien et du projet. Page Pipelines, onglet Acquéreurs sur le modèle de l'onglet Vendeurs (tableau et carte devenus communs) ; mêmes sorties « À recontacter » et « Perdu ». Fiche du projet ; rubriques « Projets d'achat » (fiche Contact, à côté des projets de vente) et « Acquéreurs » (fiche Bien). Tâches et activités liables à un projet d'achat ; projets d'achat dans l'export, la fusion et la suppression d'un contact ; 3 projets fictifs. Migration `0013_projets_acquereurs` appliquée sur le projet de test (scénario complet vérifié en base, test de sécurité « OK »), puis sur le projet réel (17/11/2026). Puis types de bien sur deux niveaux (type principal appartement, maison, terrain, commerce ; type secondaire ancien, neuf, viager), sur la fiche Bien, ses filtres et la recherche des acquéreurs : migration `0014_types_biens` appliquée sur le projet de test, puis sur le projet réel. Enfin, la clôture d'une visite met à jour la réaction au bien dans la sélection : migration `0015_visite_reaction_bien`, collée à la main dans l'éditeur SQL sur les deux projets (17/11/2026). |
| 1.11 | Écran « Aujourd'hui » | terminée | 17/11/2026 | Page d'accueil : la date, les trois actions qui comptent (écrites librement, cochées, gardées pour la journée sur tous les appareils), puis cinq blocs repliables avec compteur et message positif quand ils sont vides. Agenda du jour (tâches du jour qui ont une heure, avec adresse : lieu, sinon bien, sinon contact ; gestes Appeler, Itinéraire vers Plans ou Google Maps, Contact, Bien ; la case clôt le rendez-vous). À relancer (relances en retard ou du jour, les plus anciennes d'abord, avec retard, motif et dernière activité ; « Appeler » compose le numéro et ouvre aussitôt la boucle de relance, « Consigner », « Reporter »). Tâches (les autres, en retard ou du jour : cocher, reporter). Alertes (projets en cours sans activité depuis 15 jours, contacts sans prochaine action, avec « Planifier » ; prêtes pour les alertes de mandat et de transaction). Nouveautés (demandes entrantes non qualifiées, temps écoulé depuis la réception, en rouge au-delà d'une heure). Toutes les lectures bornées, en deux vagues parallèles ; l'écran se relit au retour dans l'application. « Appeler » respecte l'accord pour être appelé. Lot fictif « Journée ». Migration `0016_ecran_aujourdhui` appliquée sur le projet de test (test de sécurité « OK »), puis sur le projet réel (17/11/2026). Mesures ci-dessous. |
| 1.12 | Saisie rapide | terminée | 18/11/2026 | Bouton « + » flottant sur toutes les pages (en bas à droite, au-dessus de la navigation sur téléphone) : un menu qui monte du bas propose les fiches consultées récemment puis cinq créations (contact, activité, tâche, bien, demande entrante). « Nouveau contact express » : prénom, nom, téléphone, source et température d'un toucher, première note (au journal), prochaine action proposée selon la température (titre et date modifiables, raccourcis de date, « Ne rien prévoir ») ; alerte de doublon ; ouvre la fiche. « Compte rendu express » : contacts consultés récemment proposés d'emblée, sinon recherche ; type d'échange, résultat d'un appel, compte rendu de visite structuré ; prochaine action proposée (relance au rythme de la température, rappel le lendemain d'une visite, ou « déjà prévu »). Fiches consultées récemment (contacts, biens, projets) dans le menu « + » et sous le champ de recherche vide. Raccourcis clavier : « / » ou Ctrl+K (recherche), N (menu), C, A, T, B, D (créations). Aucune migration. Gestes mesurés ci-dessous. Correction du 18/11/2026 : la dictée par la reconnaissance vocale du navigateur, qui ne fonctionnait pas correctement, a été retirée (on dicte avec le micro du clavier, comme avant) ; le double défilement de l'écran Aujourd'hui, avec un grand vide en bas, est corrigé. |
| 1.13 | Sauvegardes et export | terminée | 18/11/2026 | Offre gratuite de Supabase vérifiée dans sa documentation (aucune sauvegarde, pause après 7 jours de faible activité, restauration possible pendant 90 jours, 500 Mo de base, 1 Go de fichiers, 5 Go d'échanges, deux projets actifs) : chiffres du cadrage confirmés et précisés. Réglages : « Exporter toutes mes données » télécharge un fichier JSON de toutes les tables, archives comprises (lecture par lots de 1 000 lignes, avancement affiché ; photos non incluses), et affiche les dates du dernier export et de la dernière sauvegarde automatique. Écran Aujourd'hui : rappel dans les Alertes si aucun export depuis 7 jours. Workflow « Sauvegarde » : chaque lundi, base du projet réel lue avec l'outil officiel de Supabase, chiffrée par 7-Zip (AES-256, noms des fichiers compris, phrase secrète d'au moins 20 caractères), vérifiée (s'ouvre avec la phrase, refuse une phrase fausse), conservée 90 jours ; chaque jour, visite des projets pour éviter la pause. Workflow « Restauration » (à la main) : sauvegarde de sécurité du projet cible, puis restauration en une seule transaction et contrôle des nombres de lignes. Trois secrets GitHub à ajouter. Guide pas à pas `docs/sauvegarde.md`. Migration `0017_sauvegardes` (deux dates dans `reglages`) appliquée sur le projet de test ; à appliquer sur le projet réel. Correction du 18/11/2026, après le premier lancement : l'adresse copiée dans un secret est nettoyée (espaces, guillemets, `DATABASE_URL=`, commande `psql`) et chaque erreur de format a son message ; le maintien en activité accepte la réponse « accès refusé » (401) d'une base qui répond sans session, et signale quand le site publié est branché sur le projet de test. |
| 1.14 | Recette de la version 1 | à faire | | |

## Version 2 — Les dossiers

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 2.1 | Mandats | à faire | | |
| 2.2 | Échéances de mandat et suivi du vendeur | à faire | | |
| 2.3 | Transactions et pipeline transaction | à faire | | |
| 2.4 | Échéancier et checklist de transaction | à faire | | |
| 2.5 | Checklists de mise en vente | à faire | | |
| 2.6 | Automatisations de tâches | à faire | | |
| 2.7 | Rapprochement acquéreurs-biens | à faire | | |
| 2.8 | Modèles de messages | à faire | | |
| 2.9 | Synchronisation de l'agenda | à faire | | |
| 2.10 | Écran « Aujourd'hui » complet | à faire | | |
| 2.11 | Recette de la version 2 | à faire | | |

## Version 3 — Le pilotage

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 3.1 | Objectifs | à faire | | |
| 3.2 | Tableau de bord : effort | à faire | | |
| 3.3 | Tableau de bord : transformation et revenu | à faire | | |
| 3.4 | Sources, hygiène et revue du vendredi | à faire | | |
| 3.5 | Zones de prospection | à faire | | |
| 3.6 | Campagnes de prospection | à faire | | |
| 3.7 | Carte du secteur | à faire | | |
| 3.8 | Recette de la version 3 | à faire | | |

## Version 4 — Le confort

| Étape | Intitulé | État | Date | Notes |
| --- | --- | --- | --- | --- |
| 4.1 | Notes vocales transcrites | à faire | | |
| 4.2 | Résumé d'une fiche avant un appel | à faire | | |
| 4.3 | Envois groupés ciblés | à faire | | |
| 4.4 | Commissions et frais | à faire | | |
| 4.5 | Obligations personnelles | à faire | | |
| 4.6 | Rappels et hygiène des données | à faire | | |
| 4.7 | Recette finale et migration d'hébergement | à faire | | |

## Mesures de l'étape 1.2 — 30 000 contacts fictifs

Faites le 16/11/2026 sur le projet de test, avec 30 001 fiches, en se plaçant dans les conditions d'un compte connecté (règles d'accès par ligne actives). Les temps sont ceux de la base seule : il faut y ajouter l'aller-retour par Internet, en général 0,05 à 0,3 seconde selon le réseau.

| Opération | Temps de la base |
| --- | --- |
| Première page de la liste (50 fiches) | 11 ms |
| Dernière page de la liste (après 29 950 fiches) | 6 ms |
| Compter toutes les fiches actives | 4 ms |
| Recherche d'un nom (1 562 résultats) | 21 ms |
| Recherche de deux mots (prénom et nom) | 20 ms |
| Recherche d'un téléphone complet, ou de son début, écrit « 06… » ou « +33… » | 19 à 21 ms |
| Recherche d'un courriel, d'une adresse | 19 ms |
| Recherche sans aucun résultat | 19 ms |
| Quatre filtres combinés (rôle, étiquette, source, température) | 13 ms |
| Liste des étiquettes utilisées | 34 ms |
| Détection des doublons (téléphone, courriel, nom proche) | 140 à 160 ms (630 à 750 ms avant la migration 0004) |

Conclusion : l'objectif « moins d'une seconde » est tenu avec une large marge. La détection des doublons, seule opération qui s'en approchait, a été réécrite par la migration 0004 et répond maintenant en 0,15 seconde.

Ce que les mesures ont appris : avec les règles d'accès par ligne, la base vérifie d'abord à qui appartient chaque fiche, puis applique la recherche. Elle ne peut donc pas utiliser d'index de recherche « contient » : elle lit les fiches du compte une à une, ce qui reste très rapide à cette échelle (20 ms pour 30 000 fiches, donc de l'ordre de 70 ms pour 100 000). Les index de ce type créés par la migration 0003 ne servaient à rien ; la migration 0004 les a retirés. L'index de la liste alphabétique, lui, est bien utilisé.

Le script qui a créé ces fiches est `supabase/tests/contacts-fictifs-volume.sql` (projet de test uniquement). Les 30 000 fiches y restent pour vos essais ; la commande pour les retirer est en tête du script.

## Mesures de l'étape 1.11 — écran « Aujourd'hui »

Faites le 17/11/2026 sur le projet de test (30 000 contacts d'essai, données fictives variées), dans les conditions d'un compte connecté. Temps de la base seule ; les requêtes partent en même temps, en deux vagues, soit deux allers-retours par Internet (0,1 à 0,6 seconde selon le réseau).

| Bloc | Temps de la base |
| --- | --- |
| Agenda du jour | 3 ms |
| À relancer (deux lectures) | 1 ms |
| Tâches (deux lectures) | 1 ms |
| Contacts sans prochaine action (nombre et 5 plus récents, sur 30 000 fiches) | 200 ms |
| Projets sans activité depuis 15 jours | 6 ms |
| Nouveautés | moins de 1 ms |
| Dernière activité des contacts à relancer | 4 ms |

Conclusion : l'objectif « moins de deux secondes » est tenu. Le bloc le plus lent est le compte des contacts sans prochaine action, gonflé par les 30 000 fiches d'essai ; sans elles, il est instantané.

## Mesures de l'étape 1.12 — gestes des saisies courantes

Comptés le 18/11/2026 au format iPhone, dans un navigateur piloté par un automate, avec des données fictives. Un geste est un toucher ; un champ tapé demande en plus le clavier (ou son micro, pour dicter). Le premier champ d'une fenêtre reçoit le curseur à l'ouverture : il ne compte pas de toucher. Chaque saisie part de n'importe quelle page, par le bouton « + ».

| Saisie | Touchers | Champs tapés au clavier | Écrans |
| --- | --- | --- | --- |
| Nouveau contact complet : prénom, nom, téléphone, source, température, première note, prochaine action | 8 | 4 (prénom, nom, téléphone, note) | 1 |
| Compte rendu d'un appel, juste après (contact consulté à l'instant, résultat, relance proposée) | 6 | 1 (le compte rendu) | 1 |
| Compte rendu de visite (points positifs et négatifs, intérêt, suite, rappel le lendemain) | 9 | 2 (points positifs, points négatifs) | 1 |
| Nouvelle tâche (titre et date) | 4 | 1 (le titre) | 1 |
| Demande entrante d'un nouvel acquéreur (nom, téléphone, portail, appel de qualification du jour) | 6 | 4 | 1 |

Détail du nouveau contact : « + », « Nouveau contact », prénom (le curseur y est déjà), nom, téléphone, une source, une température, la note, « Enregistrer ». La prochaine action est proposée (« Relancer Prénom Nom », dans une semaine pour un contact chaud) : l'accepter ne coûte aucun geste. Les chiffres ont été recomptés à la main après le retrait de la dictée par le navigateur : le texte se tape, ou se dicte avec le micro du clavier.

Pour comparaison (estimation à partir des écrans existants, non chronométrée) : avant cette étape, le même contact complet demandait quatre écrans (création, modification pour la source et la température, journal pour la note, tâche pour la relance), soit environ 18 touchers.

## Points à garder en tête

- Projets acquéreurs (étape 1.10) : le budget est demandé dès l'entrée en Qualification (et non à sa sortie), comme le veut la rubrique « À tester » (choix validé le 17/11/2026) ; la colonne Demande garde son critère du cadrage, « Appel ou portail ».
- Types de bien (décision du 17/11/2026, migration `0014_types_biens`) : type principal appartement, maison, terrain, commerce ; type secondaire ancien, neuf, viager (sans objet pour un terrain), sur la fiche Bien comme dans la recherche des acquéreurs. Les biens déjà saisis ont été reclassés : un bien ancien, neuf ou en viager garde cette valeur en type secondaire et devient un appartement s'il est en copropriété, à un étage ou s'il a un numéro de lot, une maison sinon. Le projet réel ne contenait encore aucun bien : rien n'y a été reclassé. Une recherche « ancien » devient « appartement, maison » + « ancien ».
- Biens : l'étage n'existe plus pour une maison (il est vidé au prochain enregistrement de la fiche). Les champs de l'ancien (copropriété, charges, taxe foncière) suivent le type secondaire, y compris pour un commerce.
- Demande entrante : « Demande à être rappelé » enregistre l'accord pour être appelé, avec la demande pour preuve (règle validée le 17/11/2026).
- Visites : la boucle propose de rappeler l'acquéreur le lendemain, quelle que soit sa température (cadrage, automatisations). Depuis la migration `0015_visite_reaction_bien`, clôturer la visite met aussi à jour la réaction au bien dans la sélection, d'après la suite envisagée et l'intérêt (« Voir d'autres biens » la laisse inchangée) ; elle se change dans l'écran avant l'enregistrement. Une visite consignée directement au journal ne la change pas.
- Projets acquéreurs : l'offre acceptée gagne le projet ; le dossier de vente (compromis, financement, acte) viendra avec les transactions (étape 2.3). « Remettre dans le pipeline » efface l'offre. Une tâche ou une activité est liée à un seul projet, de vente ou d'achat.
- Pipelines : l'onglet et la vue choisis sont désormais gardés séparément pour chaque pipeline pendant la session (la vue retenue avant cette étape est oubliée une fois).
- Écran Aujourd'hui (étape 1.11) : une tâche du jour qui a une heure va dans l'Agenda, même si c'est une relance (un appel à heure fixe est un rendez-vous) ; une relance sans heure ou en retard va dans « À relancer » ; tout le reste dans « Tâches ». Les relances apparaissent une ligne par tâche (un contact qui a deux relances en retard apparaît deux fois).
- Alertes : un contact dont l'absence de prochaine action a été confirmée dans la boucle n'est pas signalé (c'est un choix, pas un oubli) ; tous les autres contacts actifs le sont, quel que soit leur rôle (notaires compris). Un projet « sans activité » compte le journal du projet et de son contact principal (notes exclues) ; un changement d'étape compte aussi comme une activité. Choix à confirmer à l'usage.
- Migration `0016_ecran_aujourdhui` : la fonction `projets_sans_activite` a été corrigée sur le projet de test juste après sa première application (le changement d'étape compte comme une activité), avant tout commit ; le fichier du dépôt contient la version corrigée, appliquée telle quelle sur le projet réel.
- Projet réel : l'historique des migrations de Supabase s'arrête à 0012 puis reprend à 0016, car 0013, 0014 et 0015 y ont été collées à la main. Leur présence a été vérifiée par la structure le 17/11/2026 (table `projets_acquereurs`, colonne `biens.categorie`, paramètre `p_reaction_bien` de `boucler_tache`).
- Projet de test : un projet acquéreur fictif (notes « contrôle de sécurité de l'étape 1.10 ») a été ajouté pour que le test de sécurité porte sur des tables non vides.

- Sauvegardes (étape 1.13) : on ne restaure jamais une sauvegarde du projet réel sur le projet de test (règle « données fictives seulement » ; le workflow le refuse). L'exercice de restauration se fait avec une sauvegarde du projet de test. Choix à confirmer.
- Sauvegardes : ni les photos (fichiers du stockage) ni le compte de connexion ne sont sauvegardés. Une restauration rattache toutes les lignes à l'unique compte du projet cible ; sur un nouveau projet, on crée d'abord le compte.
- Sauvegardes : le workflow écrit une seule chose dans la base réelle, la date de la sauvegarde (`reglages.derniere_sauvegarde_le`). L'export complet n'est pas encore réimportable par l'application ; la restauration passe par le workflow.
- Sauvegardes : dans un dépôt public, GitHub désactive les tâches programmées après 60 jours sans modification du dépôt (il prévient par courriel ; « Enable workflow » les relance). Les fichiers de sauvegarde sont téléchargeables par tout compte GitHub : seule la phrase secrète les protège.
- Sauvegardes : le workflow n'a pas pu être lancé depuis l'environnement de Claude Code (Supabase n'y est pas joignable par le réseau). Les scripts ont été essayés sur une base PostgreSQL locale qui imite Supabase (sauvegarde, chiffrement, refus d'une phrase fausse, restauration, rattachement au compte, annulation complète en cas d'erreur) ; le premier vrai lancement se fait sur GitHub.
- Au premier lancement du workflow (18/11/2026), la variable `VITE_SUPABASE_URL` du dépôt pointait vers le projet de test : le site publié sur GitHub Pages était donc branché sur le projet de test, pas sur le projet réel. À corriger par l'utilisateur dans les variables du dépôt, puis republier.
- Chaque nouvelle table entre d'elle-même dans l'export complet et dans les sauvegardes ; elle doit seulement recevoir un libellé dans `LIBELLES_TABLES` (`src/features/sauvegarde/export-complet.ts`), ce que TypeScript rappelle.
- Dictée (étape 1.12) : la dictée par la reconnaissance vocale du navigateur ne fonctionnait pas correctement à l'essai ; elle a été retirée sans chercher à la corriger (décision du 18/11/2026). On dicte avec le micro du clavier du téléphone ; les notes vocales transcrites restent prévues à l'étape 4.1.
- Fiches consultées récemment : gardées sur l'appareil (12 au plus : nom et résumé de la fiche), propres à chaque appareil, effacées à la déconnexion. Une fiche supprimée ou absorbée par une fusion en est retirée.
- Compte rendu express : l'activité est liée au contact seulement (pas au bien ni au projet). Pour une visite planifiée, cocher la tâche de visite (boucle de relance) reste la voie qui met aussi à jour le bien et la sélection du projet d'achat.
- Saisie rapide : une création qui n'ouvre pas de fiche (compte rendu, tâche) fait relire la page affichée. Le bouton « Ajouter » de la page Contacts garde sa fenêtre courte (qui permet aussi une société) ; le contact express passe par le bouton « + ».
- Projets vendeurs (étape 1.9) : un bien n'a qu'un projet en cours ou à recontacter à la fois ; pour le relancer, on reprend le projet existant (« Remettre dans le pipeline »). Un projet repris perd son motif de perte ou sa date de relance (la tâche de relance, elle, reste).
- Projets : la source exigée pour quitter « Premier contact » est celle du contact (enregistrée sur sa fiche), pas une source propre au projet. Le « projet » du critère de découverte est le bien, toujours connu ; seuls le motif et l'échéance sont demandés.
- Projets : arriver à « Mandat signé » fait passer le bien « En mandat » s'il était repéré, en veille ou en estimation ; revenir en arrière ne remet pas l'ancien statut du bien. La colonne « Mandat signé » ne montre que les 30 derniers jours ; tous les mandats sont dans la vue « Gagnés ».
- Projets : la relance avant la fin d'un mandat concurrent n'est proposée que pour le motif « Mandat signé ailleurs ». Le tableau affiche au plus 200 projets en cours.
- Projets : le glisser-déposer se fait par la poignée de la carte (tablette et ordinateur) ; sur téléphone, on change d'étape depuis la fiche du projet. Il n'a pas pu être essayé sur un vrai iPad : à vérifier.
- Les règles juridiques citées dans le cadrage sont à vérifier (section Conformité). Les chiffres de l'offre gratuite de Supabase ont été vérifiés le 18/11/2026 (étape 1.13).
- Depuis l'environnement de Claude Code, Supabase n'est pas joignable par le réseau : la connexion a été vérifiée avec des réponses simulées, pas avec un vrai compte. La vérification réelle se fait sur le site publié.
- Supabase signale, sur le projet de test, que la protection contre les mots de passe compromis est désactivée (réglage d'Auth, hors migrations). À activer si l'offre le permet.
- Chaque étape qui crée une table liée aux contacts (biens, projets, tâches, journal…) doit faire quatre choses : ajouter le transfert de ses lignes à la fonction de fusion (`fusionner_contacts`), poser `on delete cascade` sur son lien vers le contact (suppression définitive), s'ajouter à l'export d'un contact, et, si elle enregistre un échange, entrer dans le calcul de la date du dernier contact. Détail dans `docs/donnees.md`, « Consentement et RGPD des contacts ».
- Tâches (étape 1.6) : rouvrir une occurrence d'une tâche récurrente ne retire pas l'occurrence suivante déjà créée ; il faut annuler l'une des deux (« Arrêter la série » sur la plus récente, par exemple).
- Tâches : « Cette semaine » va de demain à dimanche ; le dimanche, elle est vide et le lundi est « Plus tard ». Les reports se comptent depuis aujourd'hui, même pour une tâche prévue plus tard.
- Tâches : les tâches ne comptent pas dans la date du dernier contact : ce sont des actions à venir, pas des échanges. Depuis l'étape 1.8, cocher une tâche liée à un contact consigne l'échange au journal, qui, lui, compte.
- Boucle de relance (étape 1.8) : seules les tâches liées à un contact passent par la boucle. Une tâche sans contact (même liée à un bien) est cochée en un geste, sans activité au journal. Annuler une tâche ne passe pas par la boucle : si c'était la dernière, le contact se retrouve sans prochaine action, sans confirmation (il apparaît dans la vue et la fiche l'avertit).
- Boucle : la date proposée suit la température seule, quel que soit le résultat de l'appel ; après « messagerie » ou « pas de réponse », le raccourci « 2 jours » permet de rappeler vite. « Au cas par cas » s'entend au moment de la clôture (date, raccourcis, température) : il n'y a pas de rythme propre à une fiche.
- Boucle : un contact sans température reçoit le délai d'un contact tiède ; la température peut être choisie dans l'écran de la boucle, elle est alors enregistrée sur la fiche.
- Vue « Sans prochaine action » : elle compte toutes les fiches actives sans tâche à faire, y compris celles qui n'en ont jamais eu (sur le projet de test, les 30 000 fiches fictives de l'étape 1.2 y figurent). Une absence confirmée est indiquée sur la ligne (« Confirmé le… »), mais la fiche reste dans la vue : c'est voulu, pour la revue du vendredi. Le compteur de l'onglet ne suit pas la recherche ni les filtres.
- Boucle : l'activité est datée du moment de l'enregistrement, pas de l'échéance de la tâche. La prochaine action reprend le bien de la tâche close.
- Journal (étape 1.7) : toute activité liée à un contact compte comme un contact, y compris un appel sans réponse ou un message laissé sur la messagerie ; seule la note est écartée. À faire valider avec les autres règles RGPD : la durée de conservation se compte-t-elle depuis le dernier échange réel, ou depuis la dernière tentative ?
- Journal : une activité ne peut pas être datée dans le futur (l'application le refuse ; pour l'avenir, on crée une tâche). Ajouter une activité met à jour la date « modifiée le » de la fiche du contact (la date du dernier contact y est recalculée).
- Journal : la dictée passe par le micro du clavier du téléphone ; les notes vocales transcrites par l'application viendront à l'étape 4.1. Une activité retirée du journal reste dans la base (archivée) et figure dans l'export ; aucun écran ne la fait revenir.
- Journal : la page Journal est rangée sous « Plus », la barre de navigation étant limitée à six entrées. Le champ de recherche en haut des pages ne cherche pas dans les comptes rendus.
- Tâches : la suppression définitive d'un contact emporte toutes ses tâches, même celles liées aussi à un bien (règle commune des tables liées aux contacts). Les tâches n'ont pas d'archivage dans l'écran : on les annule.
- Fenêtres : le curseur se place désormais dans le champ prévu à l'ouverture (titre d'une nouvelle tâche, recherche d'un propriétaire) ; auparavant il restait sur la croix de fermeture.
- Biens (étape 1.4) : changer le type d'un bien vide, à l'enregistrement, les champs propres à l'ancien type (un message le rappelle sous le champ Type).
- Biens : la surface de terrain n'existe que pour le type « Terrain », comme le prévoit le plan. Une maison avec jardin n'a donc pas de champ pour son terrain : à noter dans la description, ou à ajouter si le besoin se confirme.
- Biens : l'historique garde chaque prix enregistré, y compris une faute de frappe corrigée ensuite. Il n'y a pas d'écran pour retirer une ligne de l'historique.
- Biens : la suppression définitive d'un contact retire son lien de propriétaire, mais le bien et son adresse restent dans la base. À faire valider avec les autres règles RGPD : faut-il proposer d'archiver ou d'effacer aussi le bien ?
- Biens : le champ de recherche en haut de toutes les pages ne cherche que les contacts ; un bien se cherche depuis la page Biens.
- Photos (étape 1.5) : archiver un bien ne supprime pas ses photos ; pour libérer de la place, il faut les supprimer une à une depuis la fiche. Il n'y a pas encore de suppression groupée.
- Photos : la jauge de Réglages compare le poids des photos à 1 Go, chiffre de l'offre gratuite vérifié le 18/11/2026. Elle ne compte que les photos : si d'autres fichiers sont stockés un jour (documents), il faudra les ajouter.
- Photos : si la connexion coupe entre l'envoi d'un fichier et son inscription dans la liste, un fichier peut rester dans le stockage sans apparaître nulle part. Il pèse dans la jauge ; aucun écran ne le retire.
- Photos : l'ordre se change avec les boutons « Avancer » et « Reculer », pas en faisant glisser les photos. Les données fictives ne contiennent pas de photos.
- Consentement (étape 1.3), à faire valider par un juriste : qui est concerné par l'accord préalable (particuliers seulement ?), ce qui vaut preuve d'un accord, la portée exacte de l'exception « client existant », et si les SMS et courriels de prospection doivent être bloqués de la même façon (aujourd'hui seul l'appel l'est ; une opposition au démarchage n'est que signalée pour le SMS et le courriel).
- À la migration 0005, toutes les fiches déjà enregistrées passent en accord « inconnu » : leur bouton Appeler est remplacé par l'avertissement tant que l'accord n'est pas noté, fiche par fiche. Leur date de collecte est le jour de création de la fiche.
- La date du dernier contact suit la collecte, l'accord, l'opposition, les appels passés outre et, depuis l'étape 1.7, le journal d'activité. La purge des fiches inactives (repère : 3 ans) viendra ensuite.
- Enregistrer le motif d'un appel sans accord met à jour la date « modifiée le » de la fiche (la date du dernier contact y est recalculée).
- Une suppression définitive efface tout de la base, mais les sauvegardes (exports manuels gardés par vous, sauvegardes chiffrées du workflow pendant 90 jours) gardent les données jusqu'à leur expiration ou leur suppression. L'offre gratuite de Supabase, elle, n'en fait aucune. Aucune liste des personnes effacées n'est conservée : rien n'empêche de recréer plus tard la fiche d'une personne qui avait demandé son effacement.
- Une fiche fusionnée reste archivée telle qu'elle était, avec un lien vers la fiche gardée. Il n'y a pas de bouton pour défaire une fusion.
- Le filtre par étiquette distingue majuscules et accents (« Investisseur » et « investisseur » sont deux étiquettes pour le filtre) ; la saisie évite déjà ce doublon sur une même fiche.
- L'alerte de doublon ne se déclenche qu'à la création, pas à la modification d'une fiche.
- Un contact se crée avec un nom seul : le téléphone est conseillé, pas obligatoire (un notaire peut n'avoir qu'un courriel).
- `npm audit` signale 7 alertes de niveau modéré dans des outils de développement (chaîne ESLint). Elles ne concernent pas le site publié ; à revoir lors d'une mise à jour des dépendances.
- L'installation sur l'écran d'accueil ne met rien en réserve dans l'appareil : sans réseau, l'application installée ne s'ouvre pas (choix du cadrage : pas de mode hors réseau).
