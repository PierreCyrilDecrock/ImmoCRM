import { describe, expect, it } from 'vitest'
import {
  etatsEtapes,
  listeCriteres,
  listeEnFrancais,
  phraseManque,
  phrasePassage,
  titrePassage,
} from './etapes'

const ETAPES = [
  { valeur: 'a', libelle: 'Un' },
  { valeur: 'b', libelle: 'Deux' },
  { valeur: 'c', libelle: 'Trois' },
] as const

describe('etatsEtapes', () => {
  it('distingue les étapes passées, en cours et à venir', () => {
    expect(etatsEtapes(ETAPES, 'b').map((etape) => etape.etat)).toEqual([
      'passee',
      'en_cours',
      'a_venir',
    ])
    expect(etatsEtapes(ETAPES, 'a').map((etape) => etape.etat)).toEqual([
      'en_cours',
      'a_venir',
      'a_venir',
    ])
  })

  it('passe toutes les étapes d’un projet terminé', () => {
    expect(etatsEtapes(ETAPES, 'c', true).every((etape) => etape.etat === 'passee')).toBe(true)
  })
})

describe('listeEnFrancais', () => {
  it('relie les éléments à la française, sans doublon', () => {
    expect(listeEnFrancais([])).toBe('')
    expect(listeEnFrancais(['le budget'])).toBe('le budget')
    expect(listeEnFrancais(['a', 'b', 'c'])).toBe('a, b et c')
    expect(listeEnFrancais(['l’estimation', 'l’estimation', 'la date'])).toBe(
      'l’estimation et la date',
    )
  })
})

describe('phrases de passage', () => {
  it('dit ce qu’il faut pour avancer, et ce qui manque', () => {
    expect(phrasePassage('Estimation', 'Projet, délai, motif')).toBe(
      'Pour passer à l’étape suivante (Estimation) : projet, délai, motif.',
    )
    expect(phraseManque(['le motif de la vente', 'le délai souhaité'])).toBe(
      'Il manque le motif de la vente et le délai souhaité.',
    )
    expect(phraseManque([])).toBe('')
  })
})

describe('listeCriteres', () => {
  it('garde les critères propres à l’étape et ceux d’avant qui manquent', () => {
    expect(
      listeCriteres([
        { libelle: 'Source', acquis: true, propre: false },
        { libelle: 'Budget', acquis: false, propre: false },
        { libelle: 'Motif', acquis: true, propre: true },
        { libelle: 'Délai', acquis: false, propre: true },
      ]),
    ).toEqual([
      { libelle: 'Budget', acquis: false },
      { libelle: 'Motif', acquis: true },
      { libelle: 'Délai', acquis: false },
    ])
  })

  it('réunit deux informations de même libellé, acquises seulement ensemble', () => {
    const fourchette = (basse: boolean, haute: boolean) =>
      listeCriteres([
        { libelle: 'Estimation', acquis: basse, propre: true },
        { libelle: 'Estimation', acquis: haute, propre: true },
      ])
    expect(fourchette(true, true)).toEqual([{ libelle: 'Estimation', acquis: true }])
    expect(fourchette(true, false)).toEqual([{ libelle: 'Estimation', acquis: false }])
    expect(fourchette(false, true)).toEqual([{ libelle: 'Estimation', acquis: false }])
  })

  it('titre la liste par l’étape d’arrivée', () => {
    expect(titrePassage('Estimation')).toBe('Pour passer à Estimation')
  })
})
