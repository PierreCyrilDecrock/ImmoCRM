#!/usr/bin/env bash
# Outils communs aux scripts de sauvegarde et de restauration (lancés par GitHub Actions).
# Guide pour l'utilisateur : docs/sauvegarde.md.
#
# Ces scripts ne doivent JAMAIS afficher le contenu de la base ni un secret : le dépôt est
# public, et les journaux des workflows aussi.

# Identifiants des deux projets Supabase (ils figurent déjà dans l'adresse publique du site ;
# ce ne sont pas des secrets). Ils servent à vérifier que chaque secret pointe bien vers le
# projet annoncé, pour ne jamais restaurer sur le mauvais projet.
REF_PROJET_TEST='kgodrynbcaacteolgorr'
REF_PROJET_REEL='pikagadwyntsebprgwns'

# Longueur minimale de la phrase secrète : une phrase courte se devine par essais répétés.
LONGUEUR_MIN_PHRASE=20

# Affiche une erreur lisible dans GitHub Actions et arrête le script.
echec() {
  echo "::error::$*"
  exit 1
}

# Masque un texte dans les journaux GitHub (il y apparaîtra sous la forme ***).
masquer() {
  if [ -n "${1:-}" ]; then echo "::add-mask::$1"; fi
}

# Dossier de ces scripts (commun.sh est lu par les autres scripts et par les workflows).
DOSSIER_SAUVEGARDE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Outil d'examen des adresses (adresse.py), lancé en mode isolé.
examiner() {
  python3 -I "$DOSSIER_SAUVEGARDE/adresse.py" "$@"
}

# Vérifie l'adresse de connexion d'un projet (secret SUPABASE_BASE_…) et masque son mot de
# passe. L'adresse reçue est déjà nettoyée par adresse_du_projet ; le diagnostic porte sur
# la valeur brute du secret, pour expliquer précisément ce qui ne va pas, sans l'afficher.
# Usage : verifier_adresse <reel|test> <adresse> [valeur brute du secret]
verifier_adresse() {
  local projet="$1" adresse="$2" brute="${3:-$2}" nom_secret ref attendu
  if [ "$projet" = test ]; then nom_secret=SUPABASE_BASE_TEST; else nom_secret=SUPABASE_BASE_REELLE; fi
  case "$(examiner diagnostic "$brute")" in
    ok) ;;
    vide) echec "Le secret $nom_secret est vide ou absent. Voir docs/sauvegarde.md, « Les secrets à ajouter »." ;;
    jdbc) echec "Le secret $nom_secret est au format JDBC (il commence par jdbc:). Dans la fenêtre Connect de Supabase, choisissez le type « URI »." ;;
    psql) echec "Le secret $nom_secret contient une commande psql. Dans la fenêtre Connect de Supabase, choisissez le type « URI » : l'adresse commence par postgresql://." ;;
    parametres) echec "Le secret $nom_secret contient des paramètres séparés (host=…, port=…). Dans la fenêtre Connect de Supabase, choisissez le type « URI » : l'adresse commence par postgresql://." ;;
    site) echec "Le secret $nom_secret contient l'adresse du site Supabase (https://…), pas celle de la base. Prenez celle de la fenêtre Connect, type « URI », ligne « Session pooler » : elle commence par postgresql://." ;;
    autre) echec "Le secret $nom_secret contient une adresse qui ne commence pas par postgresql://. Prenez celle de la fenêtre Connect, type « URI », ligne « Session pooler »." ;;
    *) echec "Le secret $nom_secret ne contient pas d'adresse postgresql:// (seulement un mot de passe, ou une adresse coupée ?). Il faut l'adresse complète de la fenêtre Connect, type « URI », ligne « Session pooler », avec le mot de passe à la place de [YOUR-PASSWORD]." ;;
  esac
  case "$adresse" in
    *YOUR-PASSWORD* | *'['*)
      echec "L'adresse du secret $nom_secret contient encore [YOUR-PASSWORD] : remplacez-le (crochets compris) par le mot de passe de la base." ;;
  esac
  case "$adresse" in
    *pooler.supabase.com:5432/*) ;;
    *:6543/*) echec "L'adresse du secret $nom_secret est celle du « Transaction pooler » (port 6543). Prenez celle du « Session pooler » (port 5432)." ;;
    *) echec "L'adresse du secret $nom_secret n'est pas celle du « Session pooler » (…pooler.supabase.com:5432). Les serveurs de GitHub ne joignent pas l'adresse directe de la base (db.….supabase.co)." ;;
  esac
  # L'adresse et le mot de passe, tel qu'écrit et une fois décodé, ne doivent jamais s'afficher.
  masquer "$adresse"
  local ligne
  while IFS= read -r ligne; do masquer "$ligne"; done < <(examiner motdepasse "$adresse")
  [ -n "$(examiner motdepasse "$adresse" | head -n 1)" ] ||
    echec "L'adresse du secret $nom_secret ne contient pas de mot de passe : remplacez [YOUR-PASSWORD] par le mot de passe de la base."
  # L'identifiant du projet figure dans le nom d'utilisateur : postgres.<identifiant>.
  ref="$(examiner identifiant "$adresse")"
  [ -n "$ref" ] || echec "L'adresse du secret $nom_secret ne contient pas le nom d'utilisateur postgres.<identifiant du projet>. Prenez l'adresse de la fenêtre Connect, type « URI », ligne « Session pooler »."
  if [ "$projet" = test ]; then attendu="$REF_PROJET_TEST"; else attendu="$REF_PROJET_REEL"; fi
  [ "$ref" = "$attendu" ] || echec "Le secret $nom_secret pointe vers un autre projet Supabase. Vérifiez que les secrets SUPABASE_BASE_REELLE et SUPABASE_BASE_TEST ne sont pas inversés."
}

# Vérifie la phrase secrète (sans jamais l'afficher).
# Les espaces et retours à la ligne autour de la phrase (souvent collés avec elle) sont
# retirés : invisibles, ils rendraient la phrase impossible à retaper à l'ouverture.
# PHRASE_BRUTE garde la valeur exacte du secret, pour ouvrir les sauvegardes faites avant.
verifier_phrase() {
  [ -n "${PHRASE:-}" ] || echec "Le secret SAUVEGARDE_PHRASE_SECRETE est absent. Voir docs/sauvegarde.md, « Les secrets à ajouter »."
  PHRASE_BRUTE="$PHRASE"
  PHRASE="$(printf '%s' "$PHRASE_BRUTE" | python3 -I -c 'import sys; print(sys.stdin.read().strip(), end="")')"
  [ "${#PHRASE}" -ge "$LONGUEUR_MIN_PHRASE" ] || echec "La phrase secrète est trop courte : au moins $LONGUEUR_MIN_PHRASE caractères (six mots au hasard, par exemple)."
  if [ "$PHRASE" != "$PHRASE_BRUTE" ]; then
    echo "::warning::La phrase secrète enregistrée dans GitHub commence ou finit par un espace ou un retour à la ligne. Ils sont désormais ignorés ; les sauvegardes faites avant cette correction les contiennent (le workflow Restauration sait les ouvrir)."
  fi
  if printf '%s' "$PHRASE" | LC_ALL=C grep -q '[^ -~]'; then
    echo "::warning::La phrase secrète contient des lettres accentuées ou des signes spéciaux : selon le clavier et le logiciel, ils peuvent être mal reconnus à l'ouverture. Préférez des lettres sans accent, des chiffres et des espaces (voir docs/sauvegarde.md)."
  fi
  # La phrase vient d'un secret GitHub : elle est déjà masquée dans les journaux.
}

# Installe 7-Zip s'il manque (il est en principe présent sur les serveurs de GitHub).
exiger_7z() {
  command -v 7z >/dev/null 2>&1 && return 0
  sudo apt-get update -qq >/dev/null && sudo apt-get install -y -qq 7zip >/dev/null
  command -v 7z >/dev/null 2>&1 || echec "7-Zip n'a pas pu être installé."
}

# Valeur brute d'un des deux secrets d'adresse. Usage : secret_du_projet <reel|test>
secret_du_projet() {
  case "$1" in
    reel) printf '%s' "${BASE_REELLE:-}" ;;
    test) printf '%s' "${BASE_TEST:-}" ;;
    *) echec "Projet inconnu : « $1 » (attendu : reel ou test)." ;;
  esac
}

# Adresse de connexion d'un projet, débarrassée de ce qui l'entoure souvent quand on la
# copie (espaces, retour à la ligne, guillemets, « DATABASE_URL= »…).
# Usage : adresse_du_projet <reel|test>
adresse_du_projet() {
  local brute
  brute="$(secret_du_projet "$1")"
  [ -n "$brute" ] || return 0
  examiner nettoyer "$brute"
}

# Vérifie l'adresse d'un projet à partir des secrets. Usage : verifier_projet <reel|test>
verifier_projet() {
  verifier_adresse "$1" "$(adresse_du_projet "$1")" "$(secret_du_projet "$1")"
}
