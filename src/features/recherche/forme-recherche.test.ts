import { describe, expect, it } from 'vitest'
import { formeRecherche } from './forme-recherche'

describe('place de la recherche (téléphone et tablette)', () => {
  it('garde la barre en haut de l’accueil seulement', () => {
    expect(formeRecherche('/')).toBe('bandeau')
  })

  it('laisse la liste des contacts à son propre champ', () => {
    expect(formeRecherche('/contacts')).toBe('aucune')
    expect(formeRecherche('/contacts/')).toBe('aucune')
  })

  it('met une loupe partout ailleurs, fiches comprises', () => {
    for (const chemin of [
      '/biens',
      '/taches',
      '/pipelines',
      '/plus',
      '/plus/reglages',
      '/plus/journal',
      '/contacts/abc',
      '/contacts/abc/modifier',
      '/biens/abc',
      '/pipelines/vendeurs/abc',
      '/pipelines/acquereurs/abc',
    ]) {
      expect(formeRecherche(chemin)).toBe('loupe')
    }
  })
})
