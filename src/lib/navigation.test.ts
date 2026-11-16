import { describe, expect, it } from 'vitest'
import { ENTREES_NAVIGATION, entreeActive } from './navigation'

describe('ENTREES_NAVIGATION', () => {
  it('propose les six entrées prévues, dans l’ordre', () => {
    expect(ENTREES_NAVIGATION.map((entree) => entree.libelle)).toEqual([
      "Aujourd'hui",
      'Contacts',
      'Biens',
      'Pipelines',
      'Tâches',
      'Plus',
    ])
  })

  it('n’a pas deux fois la même adresse', () => {
    const chemins = ENTREES_NAVIGATION.map((entree) => entree.chemin)
    expect(new Set(chemins).size).toBe(chemins.length)
  })
})

describe('entreeActive', () => {
  it('reconnaît l’accueil', () => {
    expect(entreeActive('/')?.libelle).toBe("Aujourd'hui")
  })

  it('reconnaît une page principale, avec ou sans barre finale', () => {
    expect(entreeActive('/contacts')?.libelle).toBe('Contacts')
    expect(entreeActive('/contacts/')?.libelle).toBe('Contacts')
  })

  it('garde l’entrée allumée sur une sous-page', () => {
    expect(entreeActive('/plus/reglages')?.libelle).toBe('Plus')
  })

  it('ne confond pas deux adresses qui commencent pareil', () => {
    expect(entreeActive('/biens-vendus')).toBeNull()
  })

  it('n’allume pas l’accueil pour une adresse inconnue', () => {
    expect(entreeActive('/inconnu')).toBeNull()
  })
})
