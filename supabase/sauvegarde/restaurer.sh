#!/usr/bin/env bash
# Restauration d'une sauvegarde chiffrée sur un projet Supabase d'ImmoCRM. Lancé par le
# workflow GitHub « Restauration ». Guide : docs/sauvegarde.md.
#
# Usage : restaurer.sh <archive .7z> <reel|test>
# Variables d'environnement (secrets GitHub) : BASE_REELLE ou BASE_TEST, PHRASE.
#
# Ce que fait la restauration, en une seule transaction (tout ou rien) :
#   1. vide toutes les tables de l'application du projet cible ;
#   2. recharge les lignes de la sauvegarde ;
#   3. les rattache à l'unique compte du projet cible.
# Le projet cible doit avoir les mêmes tables (toutes les migrations appliquées) et un compte.
# Si quoi que ce soit échoue, rien n'est modifié.
set -euo pipefail

archive="${1:?archive .7z attendue}"
cible="${2:?projet cible attendu : reel ou test}"
ici="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=commun.sh
source "$ici/commun.sh"

verifier_phrase
verifier_projet "$cible"
adresse="$(adresse_du_projet "$cible")"
exiger_7z
command -v psql >/dev/null 2>&1 || echec "psql est absent."
[ -f "$archive" ] || echec "Archive introuvable : $archive"

travail="$(mktemp -d)"
chmod 700 "$travail"
trap 'rm -rf "$travail"' EXIT

echo "Déchiffrement de $(basename "$archive")…"
# La phrase nettoyée d'abord ; puis la valeur exacte du secret, pour les sauvegardes faites
# avant que les espaces autour de la phrase ne soient ignorés.
if ! 7z x -bd -y -p"$PHRASE" -o"$travail" "$archive" >/dev/null 2>&1; then
  { [ "$PHRASE_BRUTE" != "$PHRASE" ] &&
    7z x -bd -y -p"$PHRASE_BRUTE" -o"$travail" "$archive" >/dev/null 2>&1; } ||
    echec "Déchiffrement impossible : la phrase secrète ne correspond pas à cette sauvegarde, ou le fichier est abîmé."
fi
for fichier in LISEZMOI.txt donnees.sql inventaire.txt; do
  [ -s "$travail/$fichier" ] || echec "La sauvegarde est incomplète : $fichier manque."
done

origine="$(sed -n 's/^projet=//p' "$travail/LISEZMOI.txt")"
date_sauvegarde="$(sed -n 's/^sauvegarde_le=//p' "$travail/LISEZMOI.txt")"
echo "Sauvegarde du projet « $origine », faite le $date_sauvegarde (temps universel)."
# Règle du dépôt : le projet de test ne contient que des données fictives.
if [ "$origine" = reel ] && [ "$cible" = test ]; then
  echec "Une sauvegarde du projet réel ne se restaure pas sur le projet de test : celui-ci ne doit contenir que des données fictives. Pour vous entraîner, sauvegardez puis restaurez le projet de test (voir docs/sauvegarde.md)."
fi

comptes="$(psql "$adresse" -X -q -A -t -v ON_ERROR_STOP=1 -c 'select count(*) from auth.users')"
[ "$comptes" = 1 ] ||
  echec "Le projet cible doit avoir exactement un compte de connexion (il en a $comptes). Sur un nouveau projet, créez d'abord votre compte (voir docs/sauvegarde.md)."

echo "Restauration (tout ou rien)…"
# Les messages d'erreur de la base peuvent citer une ligne de données : ils ne sont affichés
# que pour le projet de test (données fictives), jamais pour le projet réel.
if ! psql "$adresse" -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=terse --single-transaction \
  -f "$ici/vider.sql" -f "$travail/donnees.sql" -f "$ici/rattacher.sql" \
  >/dev/null 2>"$travail/erreurs.txt"; then
  if [ "$cible" = test ]; then cat "$travail/erreurs.txt" >&2; fi
  echec "La restauration a échoué ; rien n'a été modifié sur le projet « $cible ». Cause la plus fréquente : la sauvegarde ne correspond pas aux tables du projet (une migration manque d'un côté ou de l'autre)."
fi

echo "Comparaison avec l'inventaire de la sauvegarde…"
psql "$adresse" -X -q -A -t -v ON_ERROR_STOP=1 -f "$ici/inventaire.sql" >"$travail/apres.txt"
ecarts=0
while IFS='=' read -r table nombre; do
  [ -n "$table" ] || continue
  if ! grep -qx "${table}=${nombre}" "$travail/apres.txt"; then
    echo "::warning::La table « $table » n'a pas le même nombre de lignes que dans la sauvegarde."
    ecarts=$((ecarts + 1))
  fi
done <"$travail/inventaire.txt"
[ "$ecarts" -eq 0 ] || echec "$ecarts table(s) ne correspondent pas à la sauvegarde : vérifiez le projet « $cible »."

echo "Restauration terminée : chaque table a retrouvé le nombre de lignes de la sauvegarde."
