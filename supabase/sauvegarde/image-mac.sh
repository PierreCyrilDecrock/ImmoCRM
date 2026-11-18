#!/usr/bin/env bash
# Copie Mac d'une sauvegarde : transforme l'archive 7-Zip chiffrée en image disque chiffrée
# (.dmg, AES-256), que macOS ouvre sans logiciel supplémentaire (double-clic, phrase
# secrète). Lancé par le workflow « Sauvegarde » sur un serveur macOS de GitHub.
# Guide : docs/sauvegarde.md.
#
# Usage : image-mac.sh <archive .7z> <dossier de sortie>
# Variable d'environnement (secret GitHub) : PHRASE, la même phrase que pour l'archive.
# Le contenu en clair n'existe que le temps de la conversion, dans un dossier privé effacé
# à la fin ; il n'est jamais affiché.
set -euo pipefail

archive="${1:?archive .7z attendue}"
sortie="${2:?dossier de sortie attendu}"
ici="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=commun.sh
source "$ici/commun.sh"

[ "$(uname -s)" = Darwin ] || echec "Ce script fabrique une image disque Mac : il doit tourner sur un serveur macOS."
command -v hdiutil >/dev/null 2>&1 || echec "hdiutil est absent : ce n'est pas un serveur macOS."
[ -f "$archive" ] || echec "Archive introuvable : $archive"
verifier_phrase

# 7-Zip : présent sous le nom 7zz ou 7z, sinon installé par Homebrew.
sept=""
for candidat in 7zz 7z; do
  if command -v "$candidat" >/dev/null 2>&1; then sept="$candidat" && break; fi
done
if [ -z "$sept" ]; then
  brew install --quiet sevenzip >/dev/null 2>&1 || echec "7-Zip n'a pas pu être installé sur le serveur Mac."
  sept=7zz
fi

travail="$(mktemp -d)"
chmod 700 "$travail"
point_de_montage="$travail/montage"
nettoyer() {
  hdiutil detach "$point_de_montage" -quiet >/dev/null 2>&1 || true
  rm -rf "$travail"
}
trap nettoyer EXIT
mkdir -p "$travail/contenu" "$sortie"

echo "Déchiffrement de $(basename "$archive")…"
# La phrase nettoyée d'abord, puis la valeur exacte du secret (sauvegardes plus anciennes).
if ! "$sept" x -bd -y -p"$PHRASE" -o"$travail/contenu" "$archive" >/dev/null 2>&1; then
  { [ "$PHRASE_BRUTE" != "$PHRASE" ] &&
    "$sept" x -bd -y -p"$PHRASE_BRUTE" -o"$travail/contenu" "$archive" >/dev/null 2>&1; } ||
    echec "Déchiffrement impossible : la phrase secrète ne correspond pas à cette sauvegarde."
fi
[ -s "$travail/contenu/donnees.sql" ] || echec "L'archive ne contient pas de données : image disque abandonnée."

nom="$(basename "$archive" .7z).dmg"
echo "Fabrication de l'image disque chiffrée…"
# -stdinpass lit la phrase sur l'entrée standard, terminée par un caractère nul : elle
# n'apparaît ni dans la liste des processus ni dans le journal.
printf '%s\0' "$PHRASE" | hdiutil create -quiet -encryption AES-256 -stdinpass \
  -srcfolder "$travail/contenu" -volname "Sauvegarde ImmoCRM" -format UDZO \
  "$sortie/$nom" >/dev/null || echec "La fabrication de l'image disque a échoué."

echo "Vérifications de l'image disque…"
mkdir -p "$point_de_montage"
printf '%s\0' "$PHRASE" | hdiutil attach -quiet -stdinpass -readonly -nobrowse \
  -mountpoint "$point_de_montage" "$sortie/$nom" >/dev/null ||
  echec "L'image disque ne s'ouvre pas avec la phrase secrète."
cmp -s "$point_de_montage/donnees.sql" "$travail/contenu/donnees.sql" ||
  echec "L'image disque ne contient pas les mêmes données que l'archive."
hdiutil detach "$point_de_montage" -quiet >/dev/null
if printf '%s\0' "phrase-volontairement-fausse" | hdiutil attach -quiet -stdinpass -readonly \
  -nobrowse -mountpoint "$point_de_montage" "$sortie/$nom" >/dev/null 2>&1; then
  echec "L'image disque s'ouvre sans la phrase secrète : elle n'est pas chiffrée. Rien n'est conservé."
fi

taille="$(du -k "$sortie/$nom" | cut -f1)"
echo "Image disque chiffrée prête : $nom ($taille Ko)."
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "fichier=$sortie/$nom" >>"$GITHUB_OUTPUT"
fi
