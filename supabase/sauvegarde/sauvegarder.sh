#!/usr/bin/env bash
# Sauvegarde chiffrée de la base d'un projet Supabase d'ImmoCRM. Lancé par GitHub Actions
# (workflows « Sauvegarde » et « Restauration »). Guide : docs/sauvegarde.md.
#
# Usage : sauvegarder.sh <reel|test> <dossier de sortie> [préfixe du nom]
# Variables d'environnement (secrets GitHub) :
#   BASE_REELLE, BASE_TEST : adresses de connexion des deux projets (une seule suffit) ;
#   PHRASE                 : la phrase secrète qui chiffre l'archive.
# Produit : <dossier>/<préfixe>-<projet>-<AAAA-MM-JJ-HHMM>.7z, chiffré (AES-256, noms des
# fichiers compris). Rien n'est jamais écrit en clair hors d'un dossier temporaire effacé
# à la fin, ni affiché dans le journal.
set -euo pipefail

projet="${1:?projet attendu : reel ou test}"
sortie="${2:?dossier de sortie attendu}"
prefixe="${3:-immocrm}"
ici="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=commun.sh
source "$ici/commun.sh"

verifier_phrase
verifier_projet "$projet"
adresse="$(adresse_du_projet "$projet")"
exiger_7z
command -v supabase >/dev/null 2>&1 || echec "Le CLI Supabase est absent (étape supabase/setup-cli du workflow)."
command -v psql >/dev/null 2>&1 || echec "psql est absent."

# Dossier de travail privé, effacé quoi qu'il arrive.
travail="$(mktemp -d)"
chmod 700 "$travail"
trap 'rm -rf "$travail"' EXIT
mkdir -p "$sortie"

moment="$(date -u +%Y-%m-%d-%H%M)"
nom="${prefixe}-${projet}-${moment}.7z"

echo "Lecture de la structure de la base…"
supabase db dump --remote="$adresse" --file "$travail/structure.sql" >/dev/null
echo "Lecture des données (tables de l'application)…"
supabase db dump --remote="$adresse" --data-only --use-copy --schema public \
  --file "$travail/donnees.sql" >/dev/null
echo "Inventaire des tables…"
psql "$adresse" -X -q -A -t -v ON_ERROR_STOP=1 -f "$ici/inventaire.sql" >"$travail/inventaire.txt"

[ -s "$travail/donnees.sql" ] || echec "Le fichier des données est vide : la sauvegarde est abandonnée."
grep -q '^contacts=' "$travail/inventaire.txt" || echec "La table des contacts est introuvable : la sauvegarde est abandonnée."

version="$(python3 -c 'import json; print(json.load(open("package.json"))["version"])' 2>/dev/null || echo inconnue)"
cat >"$travail/LISEZMOI.txt" <<TEXTE
Sauvegarde ImmoCRM
==================

projet=${projet}
sauvegarde_le=$(date -u +%Y-%m-%dT%H:%M:%SZ)
version_application=${version}

Contenu :
- donnees.sql     : toutes les lignes des tables de l'application (contacts, biens, projets,
                    tâches, journal, réglages…), à recharger avec psql.
- structure.sql   : la structure de la base à ce moment-là (tables, règles d'accès, fonctions).
- inventaire.txt  : le nombre de lignes de chaque table.

Ne contient pas : les photos des biens (fichiers du stockage), ni le compte de connexion
(mot de passe). Pour restaurer : docs/sauvegarde.md dans le dépôt ImmoCRM.
TEXTE

echo "Chiffrement…"
(
  cd "$travail"
  # -mhe=on chiffre aussi la liste des fichiers ; -bd : pas d'indicateur de progression.
  7z a -t7z -mx=9 -mhe=on -bd -p"$PHRASE" "$sortie/$nom" \
    LISEZMOI.txt donnees.sql structure.sql inventaire.txt >/dev/null
)

echo "Vérifications de l'archive…"
7z t -bd -p"$PHRASE" "$sortie/$nom" >/dev/null || echec "L'archive chiffrée est illisible avec la phrase secrète."
if 7z l -bd -p"phrase-volontairement-fausse" "$sortie/$nom" >/dev/null 2>&1; then
  echec "L'archive s'ouvre sans la phrase secrète : elle n'est pas chiffrée. Rien n'est conservé."
fi

taille="$(du -k "$sortie/$nom" | cut -f1)"
echo "Sauvegarde chiffrée prête : $nom ($taille Ko)."
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "nom=${nom%.7z}"
    echo "fichier=$sortie/$nom"
  } >>"$GITHUB_OUTPUT"
fi
