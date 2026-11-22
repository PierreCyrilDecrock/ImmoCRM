import { describe, expect, it } from 'vitest'
import {
  ligneAccord,
  ligneDatesFiche,
  ongletAffiche,
  ongletsContact,
  raccourciFiche,
  type AppuiFiche,
} from './fiche-contact'

const appui = (key: string, autres: Partial<AppuiFiche> = {}): AppuiFiche => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  dansUnChamp: false,
  ...autres,
})

describe('onglets de la fiche', () => {
  it('range les biens à part sur ordinateur, les infos à part ailleurs', () => {
    expect(ongletsContact('ordinateur')).toEqual(['activite', 'projets', 'taches', 'biens'])
    expect(ongletsContact('telephone')).toEqual(['activite', 'projets', 'taches', 'infos'])
    expect(ongletsContact('tablette')).toEqual(ongletsContact('telephone'))
  })

  it('suit l’adresse, et mène un onglet absent vers celui qui porte son contenu', () => {
    expect(ongletAffiche('projets', 'ordinateur')).toBe('projets')
    expect(ongletAffiche(null, 'telephone')).toBe('activite')
    expect(ongletAffiche('n’importe quoi', 'ordinateur')).toBe('activite')
    expect(ongletAffiche('biens', 'telephone')).toBe('projets')
    expect(ongletAffiche('infos', 'ordinateur')).toBe('activite')
    expect(ongletAffiche('infos', 'tablette')).toBe('infos')
  })
})

describe('raccourciFiche', () => {
  it('change d’onglet avec 1 à 4, de contact avec J et K', () => {
    expect(raccourciFiche(appui('1'))).toEqual({ genre: 'onglet', rang: 0 })
    expect(raccourciFiche(appui('4'))).toEqual({ genre: 'onglet', rang: 3 })
    expect(raccourciFiche(appui('5'))).toBeNull()
    expect(raccourciFiche(appui('j'))).toEqual({ genre: 'suivant' })
    expect(raccourciFiche(appui('K'))).toEqual({ genre: 'precedent' })
  })

  it('laisse les touches au champ qui a le curseur et aux combinaisons', () => {
    expect(raccourciFiche(appui('2', { dansUnChamp: true }))).toBeNull()
    expect(raccourciFiche(appui('k', { ctrlKey: true }))).toBeNull()
    expect(raccourciFiche(appui('j', { metaKey: true }))).toBeNull()
  })
})

describe('phrases du profil', () => {
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

  it('dit depuis quand le contact accepte d’être appelé', () => {
    expect(ligneAccord({ accord_appel_date: '2026-03-02' })).toBe(
      'Accepte d’être appelé depuis le 2 mars 2026',
    )
    expect(ligneAccord({ accord_appel_date: null })).toBe('Accepte d’être appelé')
  })
})
