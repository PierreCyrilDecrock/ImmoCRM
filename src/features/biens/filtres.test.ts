import { describe, expect, it } from 'vitest'
import {
  conditionsBiens,
  FILTRES_BIENS_VIDES,
  lireFiltresBiens,
  listeBiensRestreinte,
  nombreFiltresBiens,
  prixIllisible,
  termesAdresse,
} from './filtres'

describe('termesAdresse', () => {
  it('découpe un morceau d’adresse, sans accent ni majuscule', () => {
    expect(termesAdresse("12 Rue de l'Église")).toEqual(['12', 'rue', 'de', 'l', 'eglise'])
    expect(termesAdresse('  ')).toEqual([])
  })

  it('garde un code postal qui commence par zéro tel quel', () => {
    expect(termesAdresse('01000 bourg')).toEqual(['01000', 'bourg'])
  })

  it('retire les caractères jokers', () => {
    expect(termesAdresse('100%_')).toEqual(['100'])
  })
})

describe('conditionsBiens', () => {
  it('ne pose aucune condition sans recherche ni filtre', () => {
    expect(conditionsBiens(FILTRES_BIENS_VIDES)).toEqual([])
    expect(listeBiensRestreinte(FILTRES_BIENS_VIDES)).toBe(false)
  })

  it('combine recherche, type, statut et fourchette de prix', () => {
    const filtres = {
      recherche: 'Exemple',
      type: 'appartement',
      categorie: 'ancien',
      statut: 'en_mandat',
      prixMin: '200 000',
      prixMax: '300000 €',
    } as const
    expect(conditionsBiens(filtres)).toEqual([
      { colonne: 'recherche', genre: 'contient', valeur: 'exemple' },
      { colonne: 'type', genre: 'egal', valeur: 'appartement' },
      { colonne: 'categorie', genre: 'egal', valeur: 'ancien' },
      { colonne: 'statut', genre: 'egal', valeur: 'en_mandat' },
      { colonne: 'prix', genre: 'min', valeur: 200000 },
      { colonne: 'prix', genre: 'max', valeur: 300000 },
    ])
    expect(nombreFiltresBiens(filtres)).toBe(5)
    expect(listeBiensRestreinte(filtres)).toBe(true)
  })

  it('ignore une borne de prix illisible, et la signale', () => {
    const filtres = { ...FILTRES_BIENS_VIDES, prixMin: 'cher' }
    expect(conditionsBiens(filtres)).toEqual([])
    expect(prixIllisible('cher')).toBe(true)
    expect(prixIllisible('')).toBe(false)
  })
})

describe('lireFiltresBiens', () => {
  it('relit ce qui a été mis en mémoire', () => {
    const filtres = { ...FILTRES_BIENS_VIDES, type: 'terrain', prixMax: '90000' } as const
    expect(lireFiltresBiens(JSON.stringify(filtres))).toEqual(filtres)
  })

  it('ignore ce qui est illisible ou inconnu', () => {
    expect(lireFiltresBiens(null)).toEqual(FILTRES_BIENS_VIDES)
    expect(lireFiltresBiens('{')).toEqual(FILTRES_BIENS_VIDES)
    expect(lireFiltresBiens(JSON.stringify({ type: 'chateau', statut: 12 }))).toEqual(
      FILTRES_BIENS_VIDES,
    )
  })
})
