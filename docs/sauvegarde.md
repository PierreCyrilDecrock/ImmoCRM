# Sauvegardes et restauration

Votre fichier clients est l'actif principal de votre activité. Ce guide explique, pas à pas et sans connaissance technique, comment il est protégé, comment vérifier qu'une sauvegarde existe, comment l'ouvrir et comment la restaurer.

## Pourquoi c'est indispensable

L'offre gratuite de Supabase, qui héberge vos données, a trois limites (vérifiées dans la documentation de Supabase le 18/11/2026) :

- **Aucune sauvegarde.** Supabase ne sauvegarde que les projets payants. Sur l'offre gratuite, si une fiche est effacée par erreur ou si le projet est perdu, rien ne permet de la retrouver… sauf vos propres sauvegardes. Supabase recommande lui-même d'en faire régulièrement.
- **Mise en pause.** Un projet qui reçoit trop peu de requêtes pendant 7 jours est mis en pause. Supabase prévient par courriel environ une semaine avant. Un projet en pause se rouvre en un clic pendant 90 jours ; au-delà, il ne peut plus être rouvert depuis le tableau de bord.
- **Place limitée.** 500 Mo pour la base (au-delà, elle passe en lecture seule), 1 Go pour les fichiers (photos), 5 Go d'échanges par mois, deux projets gratuits actifs au plus.

## Les trois protections en place

| Protection | Quand | Ce qu'elle fait | Où la voir |
| --- | --- | --- | --- |
| **Export manuel** | Quand vous le décidez ; rappel au bout de 7 jours | Télécharge sur votre appareil un fichier complet de vos données (format JSON) | Plus → Réglages → « Sauvegarde de vos données » |
| **Sauvegarde automatique chiffrée** | Chaque lundi vers 4 h | Copie toute la base du projet réel, la chiffre avec votre phrase secrète et la garde 90 jours dans GitHub | GitHub → onglet Actions → « Sauvegarde » ; et dans Réglages, « Dernière sauvegarde automatique » |
| **Maintien en activité** | Chaque jour vers 6 h | Interroge les projets pour qu'ils ne soient pas mis en pause | GitHub → onglet Actions → « Sauvegarde » |

Aucune ne copie les **photos des biens** : seules leurs références sont sauvegardées. Gardez les originaux sur votre téléphone ou votre ordinateur.

## L'export manuel

1. Ouvrez **Plus → Réglages**. La carte « Sauvegarde de vos données » est en haut.
2. Touchez **« Exporter toutes mes données »**. L'application lit chaque table (l'avancement s'affiche), puis télécharge un fichier nommé `immocrm-export-AAAA-MM-JJ.json`.
   - Sur iPhone ou iPad : le fichier va dans l'application **Fichiers**, dossier **Téléchargements**.
   - Sur ordinateur : dans le dossier **Téléchargements**.
3. **Rangez-le hors de l'appareil** : clé USB, disque externe, espace de stockage personnel. Il contient les données personnelles de vos clients : ne l'envoyez pas par courriel et ne le laissez pas traîner.
4. La carte affiche désormais « Dernier export : le … ». Tant que ce dernier export a moins de 7 jours, l'écran Aujourd'hui ne vous le rappelle pas.

Le fichier contient toutes vos fiches, archives comprises : contacts, biens, propriétaires, historique des prix, projets de vente et d'achat, biens proposés, tâches, journal, réglages. Il s'ouvre avec n'importe quel éditeur de texte, et un développeur (ou Claude Code) peut le relire ou le recharger. L'application ne sait pas encore le réimporter d'elle-même : pour une restauration complète, on utilise la sauvegarde automatique ci-dessous.

## Mettre en place la sauvegarde automatique (une seule fois)

La sauvegarde automatique a besoin de **trois secrets** dans GitHub. Un secret est une valeur que GitHub garde chiffrée et ne réaffiche jamais, même à vous : personne d'autre ne peut la lire, même si le dépôt est public.

> **À ne jamais faire** : coller une de ces valeurs dans une conversation (y compris avec Claude Code), dans un fichier du dépôt, dans un message ou une capture d'écran. Les deux adresses de base donnent un accès complet à vos données.

### Où ajouter un secret

1. Ouvrez le dépôt **ImmoCRM** sur github.com.
2. Cliquez sur **Settings** (en haut à droite des onglets du dépôt).
3. Dans le menu de gauche : **Secrets and variables → Actions**.
4. Onglet **Secrets**, bouton vert **New repository secret**.
5. Recopiez le **Name** exactement comme indiqué ci-dessous (majuscules et soulignés compris), collez la valeur dans **Secret**, puis **Add secret**.

Pour changer un secret plus tard : même endroit, cliquez sur le secret puis **Update**.

### Secret 1 — `SAUVEGARDE_PHRASE_SECRETE`

La phrase qui chiffre les sauvegardes. Sans elle, une sauvegarde est illisible : **par vous comme par n'importe qui**.

1. Choisissez une phrase d'**au moins 20 caractères**, idéalement six mots tirés au hasard (par exemple avec le générateur de votre gestionnaire de mots de passe) : `pivoine cadastre lagune fourchette orbite sable`. N'utilisez pas une phrase connue, une citation ou un mot de passe que vous utilisez ailleurs.
2. **Notez-la à deux endroits sûrs** : dans votre gestionnaire de mots de passe, et sur papier rangé chez vous. Si elle est perdue, personne ne pourra ouvrir les sauvegardes, pas même Supabase ou GitHub.
3. Ajoutez-la comme secret `SAUVEGARDE_PHRASE_SECRETE`.

Le workflow refuse une phrase de moins de 20 caractères.

### Secret 2 — `SUPABASE_BASE_REELLE`

L'adresse de connexion à la base du **projet réel**, avec son mot de passe.

1. Ouvrez [supabase.com](https://supabase.com/dashboard) et le projet **Immo CRM** (celui dont le nom ne finit **pas** par « - test »).
2. **Le mot de passe de la base.** Si vous ne l'avez pas noté à la création du projet : **Project Settings** (roue dentée en bas à gauche) → **Database** → **Reset database password** → **Generate a password** → copiez-le, puis enregistrez. Le site n'utilise pas ce mot de passe : le changer ne casse rien. Gardez-le dans votre gestionnaire de mots de passe. Utilisez un mot de passe généré (lettres et chiffres seulement) : les signes comme `@`, `#` ou `/` cassent l'adresse.
3. **L'adresse.** Revenez à l'accueil du projet et cliquez sur le bouton **Connect** en haut de la page. Dans la fenêtre :
   - choisissez la chaîne de connexion de type **URI** ;
   - prenez la ligne **Session pooler** (et non « Direct connection », que les serveurs de GitHub ne peuvent pas joindre, ni « Transaction pooler ») ;
   - copiez-la. Elle ressemble à :
     `postgresql://postgres.pikagadwyntsebprgwns:[YOUR-PASSWORD]@aws-…pooler.supabase.com:5432/postgres`
4. Dans un éditeur de texte (pas dans une conversation), remplacez **`[YOUR-PASSWORD]`, crochets compris**, par le mot de passe de l'étape 2.
5. Vérifiez que l'adresse contient bien `postgres.pikagadwyntsebprgwns` (votre projet réel) et `pooler.supabase.com:5432`.
6. Ajoutez-la comme secret `SUPABASE_BASE_REELLE`, puis effacez la note de l'éditeur de texte.

### Secret 3 — `SUPABASE_BASE_TEST`

La même chose pour le projet **Immo CRM - test** : son adresse contient `postgres.kgodrynbcaacteolgorr`. Elle sert à vous entraîner à restaurer, et à garder le projet de test actif.

### Ce qui est déjà en place

Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_CLE_PUBLIQUE` (onglet **Variables**, même page), ajoutées pour la publication du site, servent aussi au maintien en activité. Rien à faire.

Les workflows vérifient chaque secret avant de s'en servir : une adresse qui contient encore `[YOUR-PASSWORD]`, qui n'est pas celle du « Session pooler », ou qui pointe vers l'autre projet est refusée avec un message en français.

## Premier essai : lancer la sauvegarde à la main

1. Sur GitHub, onglet **Actions** du dépôt.
2. Dans la liste de gauche, cliquez sur **Sauvegarde**.
3. À droite, bouton **Run workflow** : laissez **reel**, puis **Run workflow**.
4. Rafraîchissez la page : une ligne apparaît. Attendez 3 à 5 minutes, jusqu'à la coche verte ✓.
5. Cliquez sur la ligne. En bas de la page, rubrique **Artifacts**, vous voyez un fichier `immocrm-reel-AAAA-MM-JJ-HHMM.7z`. C'est la sauvegarde chiffrée.
6. Dans l'application (projet réel), **Plus → Réglages** affiche « Dernière sauvegarde automatique : le … ».

Si la coche est rouge ✗ : cliquez sur la ligne, puis sur l'étape en rouge. Le message d'erreur est en français et dit quoi corriger (voir aussi « En cas de problème » plus bas).

## Vérifier qu'une sauvegarde existe

- **Dans l'application** : Plus → Réglages → « Dernière sauvegarde automatique ». Elle doit dater de moins de 8 jours.
- **Sur GitHub** : onglet **Actions** → **Sauvegarde**. Chaque lundi, une exécution « Sauvegarde chiffrée » réussie (coche verte) ; les autres jours, seulement « Maintien en activité ». Ouvrez une exécution du lundi : le fichier `.7z` est dans **Artifacts**.
- **Par courriel** : GitHub vous écrit quand une exécution programmée échoue (réglage par défaut, modifiable sur github.com → votre photo → **Settings → Notifications → Actions**).

Chaque sauvegarde est gardée **90 jours** (le maximum pour un dépôt public) : vous disposez donc en permanence d'environ 13 sauvegardes hebdomadaires. **Une fois par mois**, téléchargez la plus récente (cliquez sur son nom dans Artifacts) et rangez-la avec vos exports, hors de l'ordinateur : c'est votre copie hors de GitHub. Elle reste chiffrée : sans la phrase secrète, elle ne révèle rien.

> **Attention, règle de GitHub** : dans un dépôt public, les tâches programmées sont **désactivées automatiquement après 60 jours sans aucune modification du dépôt**. GitHub prévient par courriel. Pour les relancer : onglet **Actions** → **Sauvegarde** → bouton **Enable workflow**. Pendant le développement du projet, le dépôt change souvent et ce cas ne se présente pas.

## Ouvrir une sauvegarde sur votre ordinateur

Utile pour vérifier qu'elle est lisible, ou pour la confier à un développeur. Ce n'est pas nécessaire pour restaurer.

1. Téléchargez le fichier `.7z` depuis la rubrique **Artifacts** d'une exécution réussie.
2. Installez un logiciel qui ouvre les archives 7-Zip chiffrées :
   - **Windows** : 7-Zip (gratuit, [7-zip.org](https://www.7-zip.org)). Clic droit sur le fichier → **7-Zip → Extraire ici**.
   - **Mac** : Keka ([keka.io](https://www.keka.io), gratuit) ou The Unarchiver (App Store). Double-cliquez sur le fichier.
3. Le logiciel demande un mot de passe : tapez la **phrase secrète**. Sans elle, ou avec une phrase fausse, l'archive refuse de s'ouvrir et ne montre même pas la liste de ses fichiers.
4. Vous obtenez quatre fichiers :
   - `LISEZMOI.txt` : le projet, la date et l'heure de la sauvegarde (en temps universel : une heure de moins qu'à Paris en hiver) ;
   - `donnees.sql` : toutes les lignes des tables, en texte ;
   - `structure.sql` : la structure de la base à ce moment-là ;
   - `inventaire.txt` : le nombre de lignes de chaque table (par exemple `contacts=12`).

Ces fichiers sont **en clair** : ils contiennent les données de vos clients. Supprimez-les (et videz la corbeille) une fois la vérification faite ; gardez seulement le `.7z`.

## Restaurer une sauvegarde

Restaurer **remplace tout le contenu** du projet choisi par celui de la sauvegarde : ce qui a été saisi depuis est perdu. Pour vous protéger d'une erreur, le workflow commence toujours par sauvegarder le projet tel qu'il est (fichier `avant-restauration-….7z`, gardé 90 jours, restaurable de la même façon). La restauration se fait d'un seul bloc : si elle échoue, rien n'est modifié.

Pour s'entraîner, on restaure une sauvegarde **du projet de test** sur **le projet de test**. Une sauvegarde du projet réel ne peut pas être restaurée sur le projet de test : celui-ci ne doit contenir que des données fictives (règle du dépôt). Le workflow le refuse.

### Exercice sur le projet de test

1. **Faire une sauvegarde du test.** Actions → **Sauvegarde** → **Run workflow** → choisissez **test** → **Run workflow**. Attendez la coche verte.
2. **Noter son numéro.** Cliquez sur cette exécution. Dans la barre d'adresse du navigateur, l'adresse se termine par `/actions/runs/` suivi d'un grand nombre (par exemple `/actions/runs/12345678901`). Notez ce nombre.
3. **Modifier quelque chose.** Dans l'application branchée sur le projet de test (Réglages affiche TEST), faites un changement facile à reconnaître : créez un contact « Essai Restauration », ou archivez un contact fictif.
4. **Restaurer.** Actions → **Restauration** → **Run workflow** :
   - **Numéro de l'exécution** : le nombre noté à l'étape 2 ;
   - **Projet** : **test** ;
   - **Confirmation** : laissez vide ;
   - **Run workflow**.
5. Attendez la coche verte (3 à 5 minutes). Dans le détail de l'étape « Restauration », la dernière ligne dit : « Restauration terminée : chaque table a retrouvé le nombre de lignes de la sauvegarde. »
6. **Vérifier.** Rouvrez l'application (ou rechargez la page) : le contact « Essai Restauration » a disparu, ou le contact archivé est revenu. Vous n'avez pas besoin de vous reconnecter.

### Après un incident sur le projet réel (le projet existe toujours)

Par exemple : des fiches effacées par erreur, ou des données abîmées.

1. Choisissez la sauvegarde **d'avant l'incident** : Actions → **Sauvegarde**, ouvrez l'exécution du bon lundi et notez son numéro (comme ci-dessus).
2. Faites d'abord un **export manuel** depuis Réglages : il garde une trace lisible de ce que vous avez saisi depuis cette sauvegarde, pour le ressaisir ensuite.
3. Actions → **Restauration** → **Run workflow** : le numéro, **Projet : reel**, et dans **Confirmation** écrivez exactement `ECRASER LE PROJET REEL`. **Run workflow**.
4. Vérifiez dans l'application, puis ressaisissez ce qui a été fait depuis la sauvegarde.

### Si le projet réel est perdu (supprimé, ou en pause depuis plus de 90 jours)

C'est le cas le plus rare et le plus long. Faites-vous accompagner par Claude Code, dans une nouvelle session.

1. **Créer un nouveau projet** sur supabase.com, en région **Europe** (comme l'ancien). L'offre gratuite n'autorise que deux projets actifs : mettez en pause le projet de test si besoin (Project Settings → General → **Pause project**).
2. **Recréer les tables** : demandez à Claude Code d'appliquer toutes les migrations du dépôt (`supabase/migrations`) sur ce nouveau projet. Le fichier `structure.sql` de la sauvegarde montre la structure d'origine, si besoin.
3. **Recréer votre compte** : dans le nouveau projet, **Authentication → Users → Add user → Create new user**, avec votre courriel et un mot de passe, case **Auto Confirm User** cochée. La sauvegarde ne contient pas votre mot de passe ; vos fiches seront rattachées à ce nouveau compte automatiquement.
4. **Mettre à jour la configuration** : remplacez le secret `SUPABASE_BASE_REELLE` par l'adresse du nouveau projet (voir plus haut) et les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_CLE_PUBLIQUE` par celles du nouveau projet ; demandez à Claude Code de mettre à jour l'identifiant du projet réel dans `supabase/sauvegarde/commun.sh` et dans `.claude/skills/supabase/SKILL.md`.
5. **Restaurer** : Actions → **Restauration**, la dernière sauvegarde, **Projet : reel**, confirmation `ECRASER LE PROJET REEL`.
6. Republiez le site (Actions → **Déploiement** → **Run workflow**) et reconnectez-vous.

Les photos des biens ne reviennent pas : elles ne sont dans aucune sauvegarde.

## Si le projet est mis en pause

Supabase prévient par courriel environ une semaine avant. Le maintien en activité quotidien devrait l'éviter ; s'il arrive quand même :

1. Ouvrez [supabase.com](https://supabase.com/dashboard) et le projet en pause.
2. Cliquez sur **Resume project** et confirmez. Le projet revient en quelques minutes, avec toutes ses données.

Le workflow « Sauvegarde » échoue (coche rouge, courriel de GitHub) tant que le projet réel est en pause : c'est voulu, pour que vous le sachiez.

## En cas de problème

| Message dans GitHub | Que faire |
| --- | --- |
| « Le secret SAUVEGARDE_PHRASE_SECRETE est absent » | Ajoutez le secret 1 (orthographe exacte du nom). |
| « La phrase secrète est trop courte » | Choisissez une phrase d'au moins 20 caractères et mettez le secret à jour (**Update**). Les sauvegardes déjà faites restent lisibles avec l'ancienne phrase : gardez-la tant qu'elles existent. |
| « … contient encore [YOUR-PASSWORD] » | Remplacez `[YOUR-PASSWORD]`, crochets compris, par le mot de passe de la base, puis mettez le secret à jour. |
| « … n'est pas celle du Session pooler » ou « … Transaction pooler (port 6543) » | Reprenez l'adresse dans **Connect**, ligne **Session pooler** (port 5432). |
| « … pointe vers un autre projet Supabase » | Les secrets `SUPABASE_BASE_REELLE` et `SUPABASE_BASE_TEST` sont inversés : corrigez-les. |
| « … ne répond pas … peut-être en pause » | Voir « Si le projet est mis en pause ». Si le projet est actif, le mot de passe de la base a peut-être changé : mettez le secret à jour. |
| « Déchiffrement impossible : la phrase secrète ne correspond pas » | La sauvegarde a été chiffrée avec une autre phrase. Remettez l'ancienne phrase dans le secret le temps de la restauration. |
| « Une sauvegarde du projet réel ne se restaure pas sur le projet de test » | Normal : pour l'exercice, sauvegardez le projet de test et restaurez celle-ci. |
| « Le projet cible doit avoir exactement un compte de connexion » | Créez votre compte dans le projet (Authentication → Users → Add user), ou vérifiez qu'il n'y en a qu'un. |
| « La restauration a échoué ; rien n'a été modifié » | La sauvegarde ne correspond pas aux tables du projet : une migration manque d'un côté. Demandez à Claude Code de comparer les migrations appliquées. |
| « … ne contient pas exactement une sauvegarde » | Le numéro d'exécution est faux, ou la sauvegarde a plus de 90 jours (elle a expiré). |

## Pour aller plus loin (repères techniques)

- Les workflows sont `.github/workflows/sauvegarde.yml` (sauvegarde hebdomadaire et maintien quotidien) et `.github/workflows/restauration.yml` ; les scripts qu'ils lancent sont dans `supabase/sauvegarde/`.
- La sauvegarde utilise l'outil officiel de Supabase (`supabase db dump`, version 3.2.0) : les données des tables de l'application (`donnees.sql`, instructions `COPY`), la structure (`structure.sql`) et l'inventaire. Elle est chiffrée par 7-Zip en AES-256, liste des fichiers comprise, puis vérifiée : elle doit s'ouvrir avec la phrase, et refuser une phrase fausse. Seul le fichier chiffré quitte le serveur de GitHub, qui est effacé à la fin de chaque exécution.
- Rien n'est affiché dans les journaux, qui sont publics : ni données, ni nombres de lignes, ni messages d'erreur de la base pour le projet réel.
- La restauration vide les tables de l'application, recharge les lignes en suspendant les déclencheurs (les dates et historiques reviennent tels quels) et les rattache à l'unique compte du projet cible, le tout dans une seule transaction. Elle ne touche ni aux comptes, ni au stockage des photos.
- La sauvegarde automatique écrit une seule chose dans la base : la date de la sauvegarde, dans les réglages du compte (`reglages.derniere_sauvegarde_le`), pour l'afficher dans l'application.
