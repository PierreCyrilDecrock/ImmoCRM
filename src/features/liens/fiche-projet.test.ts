import { describe, expect, it } from 'vitest'
import {
  enTeteProjetAcquereur,
  enTeteProjetVendeur,
  ongletsProjet,
  pastilleEtatProjet,
  phraseRienDePrevu,
  PLANIFIER_PROJET,
  suiteProjet,
  TACHES_A_VENIR_PROJET,
  videTachesProjet,
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

describe('rien de prévu pour ce projet', () => {
  const aujourdhui = '2026-11-24'
  const ailleurs = { qui: 'Camille', echeance: '2026-11-26', titre: 'Envoyer l’avis de valeur' }

  it('dit en gris l’action prévue ailleurs, avec son jour', () => {
    expect(phraseRienDePrevu(ailleurs, aujourdhui)).toBe(
      'Rien de prévu pour ce projet. Camille a une action jeudi 26 nov. : Envoyer l’avis de valeur.',
    )
    expect(phraseRienDePrevu({ ...ailleurs, echeance: '2026-11-24' }, aujourdhui)).toBe(
      'Rien de prévu pour ce projet. Camille a une action aujourd’hui : Envoyer l’avis de valeur.',
    )
    expect(phraseRienDePrevu({ ...ailleurs, echeance: '2026-11-25' }, aujourdhui)).toContain(
      'a une action demain :',
    )
    expect(phraseRienDePrevu({ ...ailleurs, echeance: '2026-11-20' }, aujourdhui)).toContain(
      'a une action en retard, prévue vendredi 20 nov. :',
    )
    // Un seul point final, même si le titre en a déjà un.
    expect(phraseRienDePrevu({ ...ailleurs, titre: 'Rappeler ?' }, aujourdhui)).toMatch(
      /: Rappeler \?$/,
    )
    expect(phraseRienDePrevu(null, aujourdhui)).toBe('Rien de prévu pour ce projet.')
  })

  it('garde l’orange pour un projet en cours dont le contact n’a rien de prévu', () => {
    expect(suiteProjet({ tache: false, actif: true, ailleurs: null, aujourdhui })).toEqual({
      forme: 'alerte',
    })
    expect(suiteProjet({ tache: false, actif: true, ailleurs, aujourdhui })).toEqual({
      forme: 'phrase',
      phrase: phraseRienDePrevu(ailleurs, aujourdhui),
    })
  })

  it('ne crie pas pour un projet hors du pipeline, ni quand une tâche est prévue', () => {
    expect(suiteProjet({ tache: false, actif: false, ailleurs: null, aujourdhui })).toEqual({
      forme: 'phrase',
      phrase: 'Rien de prévu pour ce projet.',
    })
    expect(suiteProjet({ tache: true, actif: true, ailleurs: null, aujourdhui })).toEqual({
      forme: 'tache',
    })
  })

  it('ne dit l’absence qu’une fois, avec un seul bouton pour planifier', () => {
    const phrase = { forme: 'phrase' as const, phrase: 'Rien de prévu pour ce projet.' }
    expect(videTachesProjet(phrase, 'a_venir', false)).toEqual({
      phrase: 'Rien de prévu pour ce projet.',
      ajout: true,
    })
    expect(videTachesProjet(phrase, 'a_venir', true)).toEqual({
      phrase: 'Rien de prévu pour ce projet.',
      ajout: false,
    })
    // La carte orange dit l'absence et porte le bouton : « À venir » se tait.
    expect(videTachesProjet({ forme: 'alerte' }, 'a_venir', false)).toBe('masquer')
    expect(videTachesProjet({ forme: 'alerte' }, 'taches', false)).toEqual({
      phrase: TACHES_A_VENIR_PROJET,
      ajout: false,
    })
    expect(videTachesProjet({ forme: 'chargement' }, 'a_venir', false)).toBe('masquer')
    expect(PLANIFIER_PROJET).toBe('Planifier pour ce projet')
  })
})
