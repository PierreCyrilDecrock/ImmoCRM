# src/features

Un sous-dossier par domaine métier (`contacts`, `biens`, `taches`, etc.), créé à l'étape qui introduit le domaine. Chaque dossier regroupe les composants, la logique et les tests propres à ce domaine.

Domaines en place : `connexion` (session, messages d'erreur, retour depuis le courriel « mot de passe oublié »), `reglages`, `contacts` (règles de la fiche, téléphones, formulaire, consentement, export), `biens` (fiche, propriétaires, photos), `taches` (tâches et rendez-vous), `activites` (journal d'activité). Le dossier `liens` réunit ce qui sert à lier une tâche ou une activité à un contact et à un bien.
