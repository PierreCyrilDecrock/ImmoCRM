import { describe, expect, it } from 'vitest'
import { choisirAVenir } from './a-venir'

describe('« À venir » de l’onglet Activité', () => {
  it('montre les premières tâches et compte les autres', () => {
    expect(choisirAVenir(['a', 'b', 'c', 'd'], { limite: 3 })).toEqual({
      montrees: ['a', 'b', 'c'],
      cachees: 1,
      seulementLaProchaine: false,
    })
  })

  it('laisse de côté la prochaine action, déjà montrée au-dessus', () => {
    expect(choisirAVenir(['a', 'b', 'c', 'd'], { limite: 2, sansLaPremiere: true })).toEqual({
      montrees: ['b', 'c'],
      cachees: 1,
      seulementLaProchaine: false,
    })
  })

  it('signale quand la prochaine action est la seule tâche', () => {
    expect(choisirAVenir(['a'], { limite: 2, sansLaPremiere: true })).toEqual({
      montrees: [],
      cachees: 0,
      seulementLaProchaine: true,
    })
  })

  it('ne dit rien de plus quand il n’y a aucune tâche', () => {
    expect(choisirAVenir([], { limite: 2, sansLaPremiere: true })).toEqual({
      montrees: [],
      cachees: 0,
      seulementLaProchaine: false,
    })
  })
})
