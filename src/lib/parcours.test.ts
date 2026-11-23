import { describe, expect, it } from 'vitest'
import {
  cleDeLEtat,
  fusionnerParcours,
  libellePosition,
  lireListeParcours,
  lireParcours,
  PARCOURS_GARDES,
  rangerParcours,
  noterIds,
  rangDans,
  rangVoisin,
  type Parcours,
} from './parcours'

const parcours: Parcours = { cle: '[[],false]', total: 5, ids: ['a', 'b', 'c'] }

describe('parcours de la liste', () => {
  it('trouve le rang de la fiche et l’écrit « 2 sur 5 »', () => {
    expect(rangDans(parcours, 'b')).toBe(1)
    expect(rangDans(parcours, 'z')).toBeNull()
    expect(libellePosition(1, 5)).toBe('2 sur 5')
  })

  it('s’arrête aux deux bouts de la liste', () => {
    expect(rangVoisin(parcours, 0, -1)).toBeNull()
    expect(rangVoisin(parcours, 0, 1)).toBe(1)
    expect(rangVoisin(parcours, 4, 1)).toBeNull()
    expect(rangVoisin(parcours, 2, 1)).toBe(3)
  })

  it('note les fiches lues plus loin, sans perdre les rangs sautés', () => {
    expect(noterIds(parcours, 3, ['d', 'e']).ids).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(noterIds({ ...parcours, total: 60 }, 5, ['f']).ids).toEqual([
      'a',
      'b',
      'c',
      null,
      null,
      'f',
    ])
  })

  it('garde les rangs lus depuis la fiche quand la même liste est relue', () => {
    const plusLoin = noterIds(parcours, 3, ['d'])
    expect(fusionnerParcours(plusLoin, parcours).ids).toEqual(['a', 'b', 'c', 'd'])
    // Autre recherche, ou une fiche de plus : on repart de la liste relue.
    expect(fusionnerParcours(plusLoin, { ...parcours, cle: 'autre' }).ids).toEqual(parcours.ids)
    expect(fusionnerParcours(plusLoin, { ...parcours, total: 6 }).ids).toEqual(parcours.ids)
    expect(fusionnerParcours(null, parcours)).toEqual(parcours)
  })
})

describe('mémoire et historique', () => {
  it('relit un parcours gardé et refuse ce qui est illisible', () => {
    expect(lireParcours(JSON.stringify(parcours))).toEqual(parcours)
    expect(lireParcours(null)).toBeNull()
    expect(lireParcours('pas du json')).toBeNull()
    expect(lireParcours(JSON.stringify({ cle: 'x', total: -1, ids: [] }))).toBeNull()
    expect(lireParcours(JSON.stringify({ cle: 'x', total: 2, ids: [3] }))).toBeNull()
  })

  it('ne trouve un parcours que pour une fiche ouverte depuis la liste', () => {
    expect(cleDeLEtat({ parcours: '[[],false]' })).toBe('[[],false]')
    expect(cleDeLEtat(null)).toBeNull()
    expect(cleDeLEtat({ autre: 1 })).toBeNull()
    expect(cleDeLEtat({ parcours: '' })).toBeNull()
  })
})

describe('plusieurs parcours gardés', () => {
  it('range le dernier en tête et remplace celui de la même recherche', () => {
    const colonneA: Parcours = { cle: 'estimation', total: 2, ids: ['a', 'b'] }
    const colonneB: Parcours = { cle: 'decouverte', total: 1, ids: ['c'] }
    const liste = rangerParcours(rangerParcours([], colonneA, true), colonneB, true)
    expect(liste.map((p) => p.cle)).toEqual(['decouverte', 'estimation'])
    const relue = rangerParcours(liste, { ...colonneA, ids: ['b', 'a'] }, false)
    expect(relue.map((p) => p.cle)).toEqual(['estimation', 'decouverte'])
    expect(relue[0]?.ids).toEqual(['b', 'a'])
  })

  it('fusionne avec les rangs lus depuis la fiche, et oublie les plus anciens', () => {
    const plusLoin = noterIds(parcours, 3, ['d'])
    expect(rangerParcours([plusLoin], parcours, true)[0]?.ids).toEqual(['a', 'b', 'c', 'd'])
    const beaucoup = Array.from({ length: PARCOURS_GARDES + 3 }, (_, rang) => ({
      cle: String(rang),
      total: 0,
      ids: [],
    }))
    const liste = beaucoup.reduce<Parcours[]>((gardes, p) => rangerParcours(gardes, p, true), [])
    expect(liste).toHaveLength(PARCOURS_GARDES)
    expect(liste[0]?.cle).toBe(String(PARCOURS_GARDES + 2))
  })

  it('relit la mémoire et écarte ce qui est illisible', () => {
    expect(lireListeParcours(JSON.stringify([parcours, { cle: 1 }]))).toEqual([parcours])
    expect(lireListeParcours('{')).toEqual([])
    expect(lireListeParcours(JSON.stringify(parcours))).toEqual([])
    expect(lireListeParcours(null)).toEqual([])
  })
})
