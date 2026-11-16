import { describe, expect, it } from 'vitest'
import { traduireErreurDonnees } from './erreurs-donnees'

describe('traduireErreurDonnees', () => {
  it('reconnaît une coupure de réseau, quel que soit le navigateur', () => {
    expect(traduireErreurDonnees({ message: 'TypeError: Failed to fetch' }).genre).toBe('reseau')
    expect(traduireErreurDonnees({ message: 'TypeError: Load failed' }).genre).toBe('reseau')
    expect(traduireErreurDonnees({ status: 0 }).genre).toBe('reseau')
  })

  it('reconnaît une session expirée', () => {
    expect(traduireErreurDonnees({ code: 'PGRST301', status: 401 }).genre).toBe('session')
    expect(traduireErreurDonnees({ code: '42501', status: 401 }).genre).toBe('session')
  })

  it('reconnaît un refus des règles d’accès', () => {
    expect(traduireErreurDonnees({ code: '42501', status: 403 }).genre).toBe('droits')
  })

  it('reconnaît un doublon, un lien et une valeur refusée', () => {
    expect(traduireErreurDonnees({ code: '23505' }).genre).toBe('doublon')
    expect(traduireErreurDonnees({ code: '23503' }).genre).toBe('lien')
    expect(traduireErreurDonnees({ code: '23514' }).genre).toBe('invalide')
    expect(traduireErreurDonnees({ code: '22P02' }).genre).toBe('invalide')
  })

  it('reconnaît une ligne introuvable', () => {
    expect(traduireErreurDonnees({ code: 'PGRST116' }).genre).toBe('introuvable')
  })

  it('donne toujours un message en français, sans code technique', () => {
    const erreur = traduireErreurDonnees({ code: 'XX000', message: 'internal error' })
    expect(erreur.genre).toBe('inconnue')
    expect(erreur.message).toBe("Une erreur inattendue s'est produite. Réessayez dans un instant.")
    expect(traduireErreurDonnees({}).message).not.toMatch(/XX000|internal/)
  })
})
