/**
 * Fait enregistrer un fichier texte par le navigateur (dossier Téléchargements, ou
 * « Enregistrer dans Fichiers » sur téléphone). Rien n'est envoyé sur Internet : le fichier
 * est fabriqué dans l'appareil.
 */
export function telechargerTexte(nomFichier: string, contenu: string): void {
  // La marque en tête fait reconnaître les accents par les anciens éditeurs de texte.
  const fichier = new Blob(['﻿', contenu], { type: 'text/plain;charset=utf-8' })
  const adresse = URL.createObjectURL(fichier)
  const lien = document.createElement('a')
  lien.href = adresse
  lien.download = nomFichier
  document.body.append(lien)
  lien.click()
  lien.remove()
  // Le navigateur a besoin d'un instant pour commencer l'enregistrement.
  window.setTimeout(() => URL.revokeObjectURL(adresse), 10_000)
}
