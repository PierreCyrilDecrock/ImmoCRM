import { describe, expect, it } from 'vitest'
import { ligneDatesFiche, ongletDemande, raccourciFiche, type AppuiFiche } from './fiche'

const appui = (key: string, autres: Partial<AppuiFiche> = {}): AppuiFiche => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  dansUnChamp: false,
  ...autres,
})

describe('ongletDemande', () => {
  it('suit l’adresse, et mène à défaut au premier onglet', () => {
    const onglets = ['activite', 'taches', 'details'] as const
    expect(ongletDemande('details', onglets)).toBe('details')
    expect(ongletDemande(null, onglets)).toBe('activite')
    expect(ongletDemande('infos', onglets)).toBe('activite')
  })
})

describe('raccourciFiche', () => {
  it('change d’onglet avec 1 à 5, de fiche avec J et K', () => {
    expect(raccourciFiche(appui('1'))).toEqual({ genre: 'onglet', rang: 0 })
    expect(raccourciFiche(appui('5'))).toEqual({ genre: 'onglet', rang: 4 })
    expect(raccourciFiche(appui('6'))).toBeNull()
    expect(raccourciFiche(appui('j'))).toEqual({ genre: 'suivant' })
    expect(raccourciFiche(appui('K'))).toEqual({ genre: 'precedent' })
  })

  it('laisse les touches au champ qui a le curseur et aux combinaisons', () => {
    expect(raccourciFiche(appui('2', { dansUnChamp: true }))).toBeNull()
    expect(raccourciFiche(appui('k', { ctrlKey: true }))).toBeNull()
    expect(raccourciFiche(appui('j', { metaKey: true }))).toBeNull()
  })
})

describe('ligneDatesFiche', () => {
  it('donne la date de création et l’ancienneté de la dernière modification', () => {
    expect(
      ligneDatesFiche(
        { created_at: '2026-03-03T10:00:00Z', updated_at: '2026-11-20T08:00:00Z' },
        '2026-11-22',
      ),
    ).toBe('Fiche créée le 3 mars 2026 · modifiée il y a 2 jours')
    expect(
      ligneDatesFiche(
        { created_at: '2026-11-22T10:00:00Z', updated_at: '2026-11-22T10:00:00Z' },
        '2026-11-22',
      ),
    ).toBe("Fiche créée le 22 novembre 2026 · modifiée aujourd'hui")
  })

  it('dit « Projet ouvert » pour un projet', () => {
    expect(
      ligneDatesFiche(
        { created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-21T10:00:00Z' },
        '2026-11-22',
        true,
      ),
    ).toBe('Projet ouvert le 1 novembre 2026 · modifié hier')
  })
})
