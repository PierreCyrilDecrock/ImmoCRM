import { describe, expect, it } from 'vitest'
import {
  enTeteProjetAcquereur,
  enTeteProjetVendeur,
  ongletsProjet,
  pastilleEtatProjet,
  repliProchaineAction,
} from './fiche-projet'

describe('ongletsProjet', () => {
  it('ajoute « Biens proposés » au projet d’achat', () => {
    expect(ongletsProjet('vendeur')).toEqual(['activite', 'taches', 'details'])
    expect(ongletsProjet('acquereur')).toEqual(['activite', 'biens', 'taches', 'details'])
  })
})

describe('en-tête d’une fiche projet', () => {
  it('met le bien en titre d’un projet de vente, le type et le vendeur au-dessus', () => {
    expect(enTeteProjetVendeur('12 rue de l’Exemple', 'Camille Fictif')).toEqual({
      surtitre: 'Projet de vente · Camille Fictif',
      titre: '12 rue de l’Exemple',
    })
    // Sans bien, le vendeur passe en titre, sans être répété au-dessus.
    expect(enTeteProjetVendeur(null, 'Camille Fictif')).toEqual({
      surtitre: 'Projet de vente',
      titre: 'Camille Fictif',
    })
    expect(enTeteProjetVendeur('12 rue de l’Exemple', null).surtitre).toBe('Projet de vente')
  })

  it('met l’acquéreur en titre d’un projet d’achat, le co-acquéreur au-dessus', () => {
    expect(enTeteProjetAcquereur('Dominique Essai', null)).toEqual({
      surtitre: 'Projet d’achat',
      titre: 'Dominique Essai',
    })
    expect(enTeteProjetAcquereur('Dominique Essai', 'Camille Fictif').surtitre).toBe(
      'Projet d’achat · avec Camille Fictif',
    )
    expect(enTeteProjetAcquereur(null, null).titre).toBe('Projet d’achat')
  })
})

describe('pastilleEtatProjet', () => {
  const projet = { etat: 'actif', archive: false, recontacterLe: null, gagne: 'Mandat signé' }

  it('ne montre rien pour un projet en cours : l’étape est dans la frise', () => {
    expect(pastilleEtatProjet(projet)).toBeNull()
  })

  it('garde visible l’état d’un projet hors du pipeline, gagné ou archivé', () => {
    expect(
      pastilleEtatProjet({ ...projet, etat: 'a_recontacter', recontacterLe: '2027-03-12' }),
    ).toEqual({ genre: 'alerte', texte: 'À recontacter le 12 mars 2027' })
    expect(pastilleEtatProjet({ ...projet, etat: 'perdu' })).toEqual({
      genre: 'neutre',
      texte: 'Perdu',
    })
    expect(
      pastilleEtatProjet({ ...projet, etat: 'gagne', gagne: 'Offre acceptée le 3 novembre 2026' }),
    ).toEqual({ genre: 'succes', texte: 'Offre acceptée le 3 novembre 2026' })
    expect(pastilleEtatProjet({ ...projet, archive: true })).toEqual({
      genre: 'neutre',
      texte: 'Archivé',
    })
  })
})

describe('repliProchaineAction', () => {
  it('termine la phrase par un seul point', () => {
    expect(repliProchaineAction('du vendeur', 'jeu. 26 nov.')).toBe(
      'Prochaine action du vendeur, hors de ce projet : jeu. 26 nov.',
    )
    expect(repliProchaineAction('de l’acquéreur', 'mar. 2 juin')).toBe(
      'Prochaine action de l’acquéreur, hors de ce projet : mar. 2 juin.',
    )
  })
})
