#!/usr/bin/env bash
# Maintien en activité des projets Supabase. L'offre gratuite met en pause un projet qui n'a
# pas reçu assez de requêtes pendant 7 jours ; le workflow « Sauvegarde » lance ce script
# chaque jour. Il lit sans rien afficher ni modifier. Guide : docs/sauvegarde.md.
#
# Variables d'environnement (toutes facultatives, chacune ajoute une visite) :
#   URL_REELLE, CLE_PUBLIQUE : adresse et clé publique du site (variables du dépôt) ;
#   BASE_REELLE, BASE_TEST   : adresses de connexion des bases (secrets du dépôt).
set -euo pipefail

ici="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=commun.sh
source "$ici/commun.sh"

visites=0
probleme_reel=0

# 1. Une requête par l'interface du site, comme l'application : sans session, les règles
#    d'accès par ligne ne renvoient rien, mais la base a bien travaillé.
if [ -n "${URL_REELLE:-}" ] && [ -n "${CLE_PUBLIQUE:-}" ]; then
  if curl -fsS --max-time 30 -o /dev/null \
    -H "apikey: ${CLE_PUBLIQUE}" "${URL_REELLE%/}/rest/v1/reglages?select=id&limit=1"; then
    echo "Projet réel : visite par le site réussie."
    visites=$((visites + 1))
  else
    echo "::error::Le projet réel ne répond pas par le site. Il est peut-être en pause : ouvrez-le dans Supabase et cliquez sur « Resume project » (voir docs/sauvegarde.md)."
    probleme_reel=1
  fi
fi

# 2. Une lecture directe dans chaque base dont l'adresse est connue.
for projet in reel test; do
  adresse="$(adresse_du_projet "$projet")"
  [ -n "$adresse" ] || continue
  verifier_adresse "$projet" "$adresse"
  if psql "$adresse" -X -q -A -t -v ON_ERROR_STOP=1 \
    -c 'select count(*) from public.contacts' -c 'select count(*) from public.taches' >/dev/null 2>&1; then
    if [ "$projet" = reel ]; then echo "Projet réel : lecture de la base réussie."; else echo "Projet de test : lecture de la base réussie."; fi
    visites=$((visites + 1))
  elif [ "$projet" = reel ]; then
    echo "::error::La base du projet réel ne répond pas. Elle est peut-être en pause : ouvrez-la dans Supabase et cliquez sur « Resume project » (voir docs/sauvegarde.md)."
    probleme_reel=1
  else
    echo "::warning::La base du projet de test ne répond pas (peut-être en pause). Sans gravité pour vos vraies fiches."
  fi
done

[ "$probleme_reel" -eq 0 ] || exit 1
[ "$visites" -gt 0 ] || echec "Aucun projet à visiter : ajoutez au moins le secret SUPABASE_BASE_REELLE (voir docs/sauvegarde.md)."
echo "Visites réussies : $visites."
