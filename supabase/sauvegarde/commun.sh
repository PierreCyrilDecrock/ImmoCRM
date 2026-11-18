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

# Vérifie l'adresse de connexion d'un projet (secret SUPABASE_BASE_…) et masque son mot de
# passe. Usage : verifier_adresse <reel|test> <adresse>
verifier_adresse() {
  local projet="$1" adresse="$2" ref attendu
  [ -n "$adresse" ] || echec "Le secret de l'adresse du projet « $projet » est vide ou absent. Voir docs/sauvegarde.md, « Les secrets à ajouter »."
  case "$adresse" in
    *YOUR-PASSWORD* | *'['*)
      echec "L'adresse du projet « $projet » contient encore [YOUR-PASSWORD] : remplacez-le (crochets compris) par le mot de passe de la base." ;;
  esac
  case "$adresse" in
    postgres://* | postgresql://*) ;;
    *) echec "L'adresse du projet « $projet » doit commencer par postgresql:// (à copier depuis le bouton Connect de Supabase)." ;;
  esac
  case "$adresse" in
    *pooler.supabase.com:5432/*) ;;
    *:6543/*) echec "L'adresse du projet « $projet » est celle du « Transaction pooler » (port 6543). Prenez celle du « Session pooler » (port 5432)." ;;
    *) echec "L'adresse du projet « $projet » n'est pas celle du « Session pooler » (…pooler.supabase.com:5432). Les serveurs de GitHub ne joignent pas l'adresse directe de la base." ;;
  esac
  # Le mot de passe, tel qu'écrit dans l'adresse et une fois décodé, ne doit jamais s'afficher.
  local motdepasse
  motdepasse="$(python3 -c 'import sys, urllib.parse as u; print(u.urlsplit(sys.argv[1]).password or "")' "$adresse")"
  masquer "$motdepasse"
  masquer "$(python3 -c 'import sys, urllib.parse as u; print(u.unquote(sys.argv[1]))' "$motdepasse")"
  # L'identifiant du projet figure dans le nom d'utilisateur : postgres.<identifiant>.
  ref="$(python3 -c 'import sys, urllib.parse as u; n = u.urlsplit(sys.argv[1]).username or ""; print(n.split(".", 1)[1] if "." in n else "")' "$adresse")"
  if [ "$projet" = test ]; then attendu="$REF_PROJET_TEST"; else attendu="$REF_PROJET_REEL"; fi
  [ "$ref" = "$attendu" ] || echec "Le secret de l'adresse du projet « $projet » pointe vers un autre projet Supabase. Vérifiez que les secrets SUPABASE_BASE_REELLE et SUPABASE_BASE_TEST ne sont pas inversés."
}

# Vérifie la phrase secrète (sans jamais l'afficher).
verifier_phrase() {
  [ -n "${PHRASE:-}" ] || echec "Le secret SAUVEGARDE_PHRASE_SECRETE est absent. Voir docs/sauvegarde.md, « Les secrets à ajouter »."
  [ "${#PHRASE}" -ge "$LONGUEUR_MIN_PHRASE" ] || echec "La phrase secrète est trop courte : au moins $LONGUEUR_MIN_PHRASE caractères (six mots au hasard, par exemple)."
  # La phrase vient d'un secret GitHub : elle est déjà masquée dans les journaux.
}

# Installe 7-Zip s'il manque (il est en principe présent sur les serveurs de GitHub).
exiger_7z() {
  command -v 7z >/dev/null 2>&1 && return 0
  sudo apt-get update -qq >/dev/null && sudo apt-get install -y -qq 7zip >/dev/null
  command -v 7z >/dev/null 2>&1 || echec "7-Zip n'a pas pu être installé."
}

# Choisit l'adresse de connexion d'un projet parmi les deux secrets.
# Usage : adresse_du_projet <reel|test>
adresse_du_projet() {
  case "$1" in
    reel) printf '%s' "${BASE_REELLE:-}" ;;
    test) printf '%s' "${BASE_TEST:-}" ;;
    *) echec "Projet inconnu : « $1 » (attendu : reel ou test)." ;;
  esac
}
