import { describe, expect, it } from 'vitest'
import { cheminDeBase, CHEMIN_GITHUB_PAGES } from './chemin-base'

describe('cheminDeBase', () => {
  it('utilise le chemin par défaut quand la variable est absente ou vide', () => {
    expect(cheminDeBase(undefined, CHEMIN_GITHUB_PAGES)).toBe('/ImmoCRM/')
    expect(cheminDeBase('', CHEMIN_GITHUB_PAGES)).toBe('/ImmoCRM/')
    expect(cheminDeBase('   ', '/')).toBe('/')
  })

  it('garde la racine pour un site servi à la racine de son nom de domaine', () => {
    expect(cheminDeBase('/', CHEMIN_GITHUB_PAGES)).toBe('/')
  })

  it('ajoute les barres manquantes au début et à la fin', () => {
    expect(cheminDeBase('crm', '/')).toBe('/crm/')
    expect(cheminDeBase('/crm', '/')).toBe('/crm/')
    expect(cheminDeBase('crm/', '/')).toBe('/crm/')
  })

  it('retire les barres en trop et conserve les sous-dossiers', () => {
    expect(cheminDeBase('//outils/crm//', '/')).toBe('/outils/crm/')
  })
})
