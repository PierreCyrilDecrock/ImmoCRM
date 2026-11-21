/**
 * Demande d'ouverture du menu de création, venue d'ailleurs que du bouton « + » (le bouton
 * « Créer » de la colonne de navigation, sur ordinateur). `SaisieRapide`, qui tient le menu,
 * écoute ces demandes.
 */

const ecouteurs = new Set<() => void>()

/** Ouvre le menu de création. */
export function ouvrirMenuCreation() {
  ecouteurs.forEach((ouvrir) => ouvrir())
}

/** Écoute les demandes d'ouverture ; renvoie la fonction qui arrête l'écoute. */
export function ecouterOuvertureMenu(ouvrir: () => void): () => void {
  ecouteurs.add(ouvrir)
  return () => {
    ecouteurs.delete(ouvrir)
  }
}
