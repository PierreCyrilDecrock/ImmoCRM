# ImmoCRM — Analyse des besoins et cadrage

Version du 16 novembre 2026

## En bref

ImmoCRM doit répondre chaque matin à une seule question : **qui dois-je contacter aujourd'hui, et pourquoi ?** Tout le reste (fiches, pipelines, statistiques) sert à alimenter cette réponse.

Cinq choix structurants sont proposés :

1. **Un écran « Aujourd'hui » comme page d'accueil.** Il réunit rendez-vous, relances dues, tâches et alertes d'échéance. C'est l'écran ouvert dix fois par jour.
2. **Aucun contact sans prochaine action datée.** Un prospect sans relance planifiée est un prospect perdu. Le CRM l'impose à chaque clôture d'action.
3. **Trois pipelines distincts mais reliés :** vendeurs (jusqu'au mandat), acquéreurs (jusqu'à l'offre), transactions (de l'offre à l'encaissement des honoraires).
4. **Mobile d'abord.** Un mandataire travaille en voiture, en visite et en porte-à-porte. La saisie d'un compte rendu doit prendre moins de 30 secondes, idéalement à la voix.
5. **Conformité intégrée, pas ajoutée.** Consentement RGPD, Bloctel, numérotation des mandats et dates d'échéance sont gérés par le CRM, sans effort de mémoire.

Le périmètre reste volontairement léger : ImmoCRM gère l'organisation personnelle et la relation, et laisse mandats, annonces, signature et facturation à d'autres outils. La première version tient en six briques : contacts, biens, pipelines vendeur et acquéreur, tâches avec relances, écran Aujourd'hui, journal d'activité.

## Le métier de mandataire

Un mandataire est un indépendant seul face à quatre métiers à la fois : prospecteur, commercial, gestionnaire de dossiers et chef d'entreprise. Le CRM doit couvrir les quatre, sans devenir un logiciel d'agence.

| Rôle | Ce qu'il fait | Ce qui se perd sans outil |
| --- | --- | --- |
| Prospecteur | Pige, porte-à-porte, boitage, téléphone, réseau, recommandations | Les relances à 3, 6 ou 12 mois des projets « pas tout de suite » |
| Commercial | Estimations, prise de mandats, visites, négociation des offres | Les comptes rendus de visite et le suivi promis au vendeur |
| Gestionnaire | Diagnostics, compromis, financement, notaire, acte | Les échéances : fin de mandat, délai de rétractation, conditions suspensives |
| Chef d'entreprise | Objectifs, chiffre d'affaires, charges, formation, obligations légales | La vision du revenu à venir et le lien entre effort et résultat |

Trois contraintes propres au statut orientent la conception :

- **Pas d'agence physique.** Le téléphone et la tablette sont le bureau de terrain ; l'ordinateur sert à la gestion au calme. Tout doit être faisable d'une main, entre deux rendez-vous.
- **Un réseau au-dessus.** Aucun réseau n'est désigné pour ce projet : les mandats, la diffusion des annonces, la signature et la facturation se font avec d'autres outils. ImmoCRM ne les remplace pas : il gère ce que ces outils font mal, l'organisation personnelle et la relation.
- **Un cycle long et irrégulier.** Entre un premier contact et les honoraires, il s'écoule couramment 6 à 18 mois. La mémoire du CRM remplace celle du mandataire.

## Analyse des besoins par domaine

Douze domaines couvrent l'ensemble de l'activité. La colonne Priorité indique ce qui est indispensable dès la première version (P1), utile ensuite (P2) ou de confort (P3).

| Domaine | Besoin | Fonctions clés | Priorité |
| --- | --- | --- | --- |
| Contacts | Retrouver n'importe qui en 5 secondes, avec tout l'historique | Fiche unique par personne, rôles multiples (vendeur, acquéreur, notaire, prescripteur), origine du contact, étiquettes, détection des doublons, recherche instantanée | P1 |
| Biens | Connaître chaque bien suivi, en mandat ou non, quel que soit son type | Adresse, type (appartement, maison, terrain, commerce) et type secondaire (ancien, neuf, viager) avec leurs champs propres, surface, prix, photos, propriétaires liés, historique de prix, DPE | P1 |
| Projets vendeurs | Transformer un contact en mandat | Pipeline du premier contact à la signature, estimation, motif et échéance du projet, concurrence | P1 |
| Projets acquéreurs | Proposer le bon bien à la bonne personne | Critères de recherche, budget, financement validé ou non, rapprochement automatique avec les biens | P1 |
| Tâches et agenda | Ne rien oublier | Tâches liées à un contact ou un bien, relances datées, récurrences, synchronisation avec l'agenda du téléphone | P1 |
| Journal d'activité | Savoir ce qui a été dit et fait | Appels, SMS, courriels, visites, notes vocales, le tout horodaté sur la fiche | P1 |
| Prospection | Travailler un secteur avec méthode | Zones et rues, campagnes de boitage et de porte-à-porte, pige des annonces de particuliers, suivi des retours | P2 |
| Transactions | Sécuriser le dossier jusqu'à l'acte | Offre, compromis, délais légaux, financement, notaire, checklist de pièces, honoraires prévus | P2 |
| Pilotage | Savoir où l'on en est | Objectifs, taux de transformation, chiffre d'affaires prévisionnel, répartition du temps | P2 |
| Mandats | Suivre la vie du mandat, sans le rédiger | Type, numéro, dates, prix, avenants, compte rendu périodique au vendeur | P2 |
| Communication | Gagner du temps sur les messages répétitifs | Modèles de SMS et de courriels, envois groupés ciblés, lettre d'information de secteur | P3 |
| Administratif | Tenir l'entreprise | Suivi des commissions encaissées, dépenses, kilomètres, heures de formation obligatoire | P3 |

Le besoin transversal est la **rapidité de saisie**. Un CRM abandonné l'est presque toujours parce que le remplir coûte plus que l'oubli qu'il évite.

## Les objets du CRM

Huit objets suffisent, et la règle centrale est qu'une **personne** et son **projet** sont deux choses distinctes. Un même contact peut vendre son appartement, chercher une maison et recommander son voisin : une fiche, trois projets.

| Objet | Ce qu'il représente | Lié à |
| --- | --- | --- |
| Contact | Une personne ou une société : coordonnées, origine, consentement, étiquettes | Projets, biens, activités |
| Bien | Un logement ou un terrain, qu'il soit en mandat, en veille ou simplement repéré | Propriétaires (contacts), mandat, visites |
| Projet vendeur | L'intention de vendre un bien donné, avec son étape dans le pipeline | Contact, bien, mandat |
| Projet acquéreur | Une recherche : critères, budget, financement, urgence | Contact, visites, offres |
| Mandat | Le contrat : type, numéro, dates, prix, honoraires | Projet vendeur, bien |
| Transaction | Un dossier de vente, de l'offre acceptée à l'acte | Mandat, acquéreur, notaires |
| Activité | Tout événement passé : appel, message, visite, note, document envoyé | Contact, bien ou projet |
| Tâche | Toute action à venir, avec une date et un motif | Contact, bien ou projet |

Deux objets secondaires arrivent avec la prospection : la **zone** (secteur, quartier, rue) et la **campagne** (une opération de boitage, de porte-à-porte ou d'appels sur une zone).

Activité et Tâche sont volontairement séparées : l'une est le passé, l'autre le futur. Clôturer une tâche crée une activité et propose aussitôt la tâche suivante.

## Les pipelines

Trois pipelines s'enchaînent : le mandat signé ouvre le bien aux visites, et l'offre acceptée ouvre un dossier de transaction.

| Pipeline | Étapes (critère de sortie) |
| --- | --- |
| Vendeur · du premier contact au mandat | Premier contact (source identifiée) → Découverte (projet, délai, motif) → Estimation (avis de valeur remis) → Suivi (relances, objections) → Mandat signé (simple ou exclusif) |
| Acquéreur · de la demande à la visite | Demande (appel ou portail) → Qualification (budget, critères) → Sélection (biens proposés) → Visites (comptes rendus) |
| Transaction · de l'offre à l'encaissement | Offre acceptée (prix, conditions) → Compromis (rétractation 10 j) → Financement (accord de prêt) → Acte (chez le notaire) → Honoraires (encaissés) |

Passages de relais : le mandat signé rend le bien visitable (pipeline acquéreur, étape Visites) ; une offre acceptée ouvre le pipeline transaction.

Chaque étape a un critère de sortie vérifiable, indiqué sous son nom, pour que le pipeline reflète des faits et non des impressions.

Deux sorties existent à toute étape, et aucune n'est une suppression :

- **À recontacter**, avec une date : le projet est reporté. Le contact quitte le pipeline et revient par une relance.
- **Perdu**, avec un motif : mandat signé ailleurs, vente entre particuliers, projet abandonné, achat par un confrère. Les motifs alimentent les statistiques, et un mandat concurrent qui expire redevient une opportunité.

Après l'acte, le vendeur comme l'acquéreur passent en **veille client** : avis, recommandations, nouvelles à date anniversaire.

## La journée type et l'écran « Aujourd'hui »

L'écran d'accueil présente la journée dans l'ordre où elle se vit, et rien d'autre.

| Bloc | Contenu | Geste principal |
| --- | --- | --- |
| Agenda du jour | Rendez-vous, visites, estimations, avec adresse et itinéraire | Ouvrir la fiche, lancer le GPS, appeler |
| À relancer | Contacts dont la prochaine action tombe aujourd'hui ou est en retard | Appeler, puis consigner le résultat en un geste |
| Tâches | Actions hors relance : envoyer un document, commander un diagnostic, publier une annonce | Cocher, reporter, déléguer |
| Alertes | Mandats qui expirent, conditions suspensives proches, vendeurs sans nouvelles depuis 15 jours | Traiter ou planifier |
| Nouveautés | Demandes entrantes des portails, nouveaux biens correspondant à un acquéreur | Qualifier dans l'heure |

Trois rituels structurent la semaine :

- **Le matin (5 minutes).** Lire l'écran Aujourd'hui, choisir les trois actions qui comptent.
- **Après chaque échange (30 secondes).** Dicter le compte rendu, fixer la prochaine action. C'est le seul effort de saisie demandé.
- **Le vendredi (20 minutes).** Revue de la semaine : pipelines, tâches en retard, objectifs, plan de prospection de la semaine suivante.

Pour les tâches, trois règles simples valent mieux qu'un système riche :

1. Toute tâche a une date, et presque toujours un contact ou un bien.
2. Les tâches récurrentes de la vie professionnelle (compte rendu vendeur, publication sur les réseaux, comptabilité du mois) sont créées une fois et se régénèrent.
3. Le temps de prospection se bloque dans l'agenda comme un rendez-vous client, sinon il disparaît.

## Suivi de prospection

La prospection se pilote sur deux axes : **d'où vient le contact** (la source) et **quand il aura un projet** (la température). Chaque contact porte ces deux informations dès sa création.

| Source | Ce que le CRM enregistre | Ce qu'il mesure |
| --- | --- | --- |
| Pige (annonces de particuliers) | Annonce, prix, date du premier appel, réponse obtenue | Appels passés, rendez-vous obtenus |
| Porte-à-porte | Rue, numéro, personne rencontrée, intérêt | Portes frappées, contacts créés |
| Boitage | Zone, date, support distribué, nombre d'exemplaires | Retours par campagne |
| Recommandation | Qui a recommandé qui | Meilleurs prescripteurs, remerciements à faire |
| Demandes entrantes | Portail d'origine, bien concerné | Délai de première réponse |
| Réseaux sociaux et site | Publication ou formulaire d'origine | Contacts par canal |
| Sphère personnelle | Lien (famille, amis, anciens clients) | Fréquence des prises de nouvelles |

La température détermine le rythme de relance par défaut, modifiable au cas par cas :

| Température | Signification | Relance par défaut |
| --- | --- | --- |
| Chaud | Projet dans les 3 mois | Chaque semaine |
| Tiède | Projet dans les 3 à 12 mois | Chaque mois |
| Froid | Projet lointain ou incertain | Chaque trimestre |
| Veille | Propriétaire du secteur sans projet déclaré | Deux fois par an, avec une information utile (vente récente dans la rue, évolution des prix) |

Deux idées à creuser pour le travail de secteur :

- **Une carte du secteur** où chaque bien connu apparaît avec sa couleur : en mandat, vendu, propriétaire en veille, jamais contacté. Elle montre où prospecter.
- **Un compteur d'effort hebdomadaire** (appels, portes, estimations) placé à côté des résultats. Il relie l'activité d'aujourd'hui au chiffre d'affaires de dans six mois.

## Automatisations et rappels

Le CRM automatise la création de tâches et de rappels, jamais l'envoi d'un message sans validation. La relation reste humaine ; c'est la mémoire qui est déléguée.

| Déclencheur | Action automatique |
| --- | --- |
| Une tâche de relance est clôturée | Proposer la relance suivante selon la température du contact |
| Une estimation est réalisée | Tâches à J+2 (envoi de l'avis de valeur) et J+7 (rappel du vendeur) |
| Un mandat est signé | Checklist de mise en vente : diagnostics, photos, annonce, panneau, diffusion |
| Un mandat est actif | Compte rendu au vendeur tous les 15 jours, avec le nombre de visites et les retours |
| Un mandat approche de son terme | Alertes à 30 et 15 jours : renouveler, renégocier le prix ou clôturer |
| Une visite est terminée | Demander le compte rendu à chaud, puis tâche de rappel de l'acquéreur à J+1 |
| Un bien entre en portefeuille ou baisse de prix | Lister les acquéreurs dont les critères correspondent |
| Un compromis est signé | Échéancier du dossier : rétractation, dépôt du prêt, accord de prêt, date d'acte |
| Un acte est signé | Demande d'avis client, demande de recommandation, rappels à 6 mois et à la date anniversaire |
| Un contact n'a aucune prochaine action | Le signaler dans la revue du vendredi |

Les modèles de messages (confirmation de visite, envoi d'estimation, compte rendu vendeur) sont préremplis avec les données de la fiche, puis relus et envoyés d'un geste.

## Tableaux de bord et indicateurs

Un seul tableau de bord, lu le vendredi, répond à trois questions : est-ce que je travaille assez, est-ce que je transforme bien, combien vais-je encaisser.

| Question | Indicateurs | Lecture |
| --- | --- | --- |
| Effort | Appels de prospection, portes frappées, nouveaux contacts, estimations réalisées, par semaine | Comparé à l'objectif hebdomadaire fixé par le mandataire |
| Transformation | Estimations → mandats, part de mandats exclusifs, mandats → ventes, visites par offre, délai moyen de vente | Montre l'étape où les dossiers se perdent |
| Revenu | Honoraires signés en attente d'acte, honoraires potentiels du portefeuille, chiffre d'affaires encaissé sur l'année | Donne la visibilité de trésorerie à 3 à 6 mois |
| Sources | Mandats et ventes par origine de contact | Indique où investir le temps de prospection |
| Hygiène | Contacts sans prochaine action, tâches en retard, vendeurs sans compte rendu récent | Doit tendre vers zéro |

Le calcul le plus utile part de l'objectif annuel et remonte le pipeline : tant d'euros d'honoraires demandent tant de ventes, donc tant de mandats, donc tant d'estimations, donc tant de contacts par semaine. Le CRM le recalcule avec les taux réels du mandataire dès qu'il a quelques mois de données.

## Conformité

Six obligations ont un effet direct sur la conception du CRM. Elles sont résumées de mémoire, sans vérification des textes à jour : à valider avec un juriste ou le titulaire de la carte avant développement.

| Sujet | Règle, en résumé | Conséquence dans le CRM |
| --- | --- | --- |
| RGPD | Données limitées au nécessaire, information des personnes, droits d'accès et d'effacement, durée de conservation limitée (repère CNIL : 3 ans après le dernier contact pour un prospect) | Origine et date de collecte sur chaque fiche, export et suppression d'un contact, purge ou anonymisation des fiches inactives |
| Démarchage téléphonique | Bloctel, puis consentement préalable exigé par la loi du 30 juin 2025, applicable depuis août 2026 | Champ « accord pour être appelé » avec date et preuve, blocage visuel des numéros sans accord, exception à documenter pour les clients existants |
| Loi Hoguet | Aucun acte sans mandat écrit préalable, numéroté au registre du titulaire de la carte | Numéro, type et dates du mandat obligatoires avant toute visite ; le registre officiel reste tenu par le titulaire de la carte |
| Mandat hors établissement | Droit de rétractation de 14 jours pour un mandat signé à domicile | Date de fin de rétractation calculée, diffusion bloquée avant, sauf demande expresse du vendeur |
| Annonces | Mentions obligatoires : honoraires et qui les paie, DPE, statut d'agent commercial | Contrôle des champs avant de marquer une annonce « prête » |
| Lutte contre le blanchiment | Identification du client et vigilance sur l'origine des fonds | Case et pièce d'identité dans la checklist de transaction |

Deux obligations personnelles se suivent comme de simples tâches récurrentes : les heures de formation continue (14 heures par an) et le renouvellement de l'attestation d'habilitation et de l'assurance de responsabilité civile professionnelle.

Les données doivent être hébergées dans l'Union européenne, chiffrées et sauvegardées chaque jour. Un fichier clients est le principal actif d'un mandataire.

## Priorisation

La première version doit être utilisable tous les jours avec six briques seulement ; le reste s'ajoute quand l'habitude est prise.

| Version | Objectif | Contenu | Critère de réussite |
| --- | --- | --- | --- |
| V1 — Le quotidien | Ne plus rien oublier | Contacts, biens de tous types, pipelines vendeur et acquéreur, tâches et relances, journal d'activité, écran Aujourd'hui, saisie rapide, affichage téléphone, tablette et ordinateur | Le CRM est ouvert chaque matin pendant 3 semaines de suite |
| V2 — Les dossiers | Sécuriser mandats et ventes | Mandats et échéances, pipeline transaction, checklists, automatisations de tâches, rapprochement acquéreurs-biens, modèles de messages, synchronisation de l'agenda | Aucune échéance manquée sur un trimestre |
| V3 — Le pilotage | Décider avec des chiffres | Tableau de bord, objectifs, suivi des sources, zones et campagnes de prospection, carte du secteur | La revue du vendredi se fait entièrement dans le CRM |
| V4 — Le confort | Gagner du temps | Notes vocales transcrites, résumé automatique d'une fiche avant un appel, envois groupés, suivi des commissions et des frais | Moins de 15 minutes de saisie par jour |

Ce qui est volontairement exclu : la rédaction des mandats et compromis, la diffusion des annonces sur les portails, la signature électronique, la facturation, ainsi que la location et la gestion locative. D'autres outils couvrent les quatre premiers points, et les refaire alourdirait le projet pour peu de valeur.

## Architecture technique

ImmoCRM est une application web statique hébergée sur GitHub Pages, qui dialogue directement avec Supabase pour les données. Il n'y a aucun serveur à administrer, et le coût de départ est nul.

| Brique | Choix | Ce que cela implique |
| --- | --- | --- |
| Développement | Claude Code dans le cloud, dépôt GitHub | Chaque évolution est une demande en langage courant ; l'historique du dépôt permet de revenir en arrière |
| Application | Site statique adapté au téléphone, à la tablette et à l'ordinateur, installable sur l'écran d'accueil | Tout le code s'exécute dans le navigateur |
| Hébergement | GitHub Pages, puis un hébergeur web | La migration se résume à copier les fichiers et changer l'adresse |
| Données | Supabase gratuit : base PostgreSQL, connexion, stockage de fichiers | Les huit objets du CRM deviennent des tables reliées entre elles |
| Connexion | Un seul compte, inscriptions fermées | Personne d'autre ne peut créer de compte |

Quatre points de vigilance. Les chiffres de l'offre gratuite ont été vérifiés dans la documentation de Supabase le 18 novembre 2026 (étape 1.13) ; aucun n'avait changé, quelques précisions ont été ajoutées :

- **La sécurité repose sur la base, pas sur le site.** Le code d'un site statique est lisible par tous. Chaque table doit donc être verrouillée pour n'être accessible qu'au compte connecté (règles d'accès par ligne de Supabase). Seule la clé publique figure dans le code ; la clé d'administration n'entre jamais dans le dépôt.
- **L'offre gratuite n'a aucune sauvegarde automatique** (seuls les projets payants sont sauvegardés chaque jour), et Supabase recommande de faire ses propres exports. Depuis l'étape 1.13 : export complet à la demande dans Réglages, avec rappel au bout de 7 jours, et sauvegarde hebdomadaire chiffrée par GitHub Actions, gardée 90 jours (voir [sauvegarde.md](sauvegarde.md)).
- **Un projet gratuit est mis en pause après 7 jours de faible activité.** Supabase prévient par courriel environ une semaine avant ; un projet en pause se rouvre en un clic pendant 90 jours, plus ensuite. Le workflow de sauvegarde interroge les projets chaque jour pour l'éviter.
- **Les limites gratuites suffisent pour les fiches, moins pour les photos.** 500 Mo de base (au-delà, elle passe en lecture seule), largement assez pour des dizaines de milliers de fiches, 1 Go de fichiers (les photos sont donc compressées et limitées), 5 Go d'échanges par mois, deux projets gratuits actifs au plus (ici : test et réel). Le passage à l'offre payante (sauvegardes quotidiennes, plus de pause) sera à prévoir quand l'activité le justifiera.

Pour le RGPD, le projet Supabase est à créer dans une région européenne dès le départ, ce choix étant difficile à changer ensuite.

L'absence de serveur a une limite : les fonctions qui doivent tourner sans que l'application soit ouverte, comme une notification de rappel ou la réception automatique d'une demande, demanderont plus tard les fonctions planifiées de Supabase. Rien de cela n'est nécessaire en V1.

## Décisions prises

Les réponses du 16 novembre 2026 fixent le cadre : un outil personnel et léger, parti de zéro, qui grandit avec l'activité.

| Sujet | Décision | Ce que cela change |
| --- | --- | --- |
| Outils du réseau | Aucun réseau désigné pour le projet ; périmètre figé en l'état | Mandats, annonces, signature et facturation restent hors périmètre |
| Utilisateurs | Usage strictement personnel | Un seul compte, pas de droits ni de partage |
| Activité | Toutes les transactions (ancien, neuf, viager, commerces, terrains), ni location ni gestion | La fiche Bien s'adapte au type de bien |
| Types de bien (17 novembre) | Type principal : appartement, maison, terrain, commerce ; type secondaire : ancien, neuf, viager | Un appartement peut être ancien, neuf ou en viager ; la fiche Bien et la recherche des acquéreurs utilisent les deux niveaux |
| Volume | Zéro aujourd'hui ; à terme, l'ordre de grandeur d'une ville comme Oullins, soit quelques dizaines de milliers de fiches | Aucun chargement en masse : contacts et adresses se créent au fur et à mesure. Recherche et listes doivent rester rapides quand la base grossit |
| Données existantes | Aucune | Pas d'import en V1 ; la saisie rapide est la seule porte d'entrée |
| Point de douleur | Pas encore identifié | V1 généraliste ; bilan après 4 à 6 semaines d'usage pour choisir quoi approfondir |
| Appareils | Téléphone, tablette et ordinateur ; mode hors réseau non requis | Une application web unique, adaptée aux trois tailles d'écran |
| Développement | Claude Code dans le cloud, dépôt GitHub public | Voir Architecture technique |
| Hébergement | GitHub Pages d'abord, hébergeur web ensuite | Application statique, sans serveur |
| Données | Supabase, offre gratuite | Voir Architecture technique |

Il ne reste aucune question bloquante. Le dépôt GitHub sera public, ce qui impose trois règles : aucune donnée réelle de client dans le dépôt (ni fichier d'exemple, ni capture d'écran), aucune clé d'administration Supabase dans le code, et des jeux de données fictifs pour les tests.
