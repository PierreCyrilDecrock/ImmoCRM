import { describe, expect, it } from 'vitest'
import {
  cleDeLEtat,
  fusionnerParcours,
  libellePosition,
  lireParcours,
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
