import { describe, expect, it } from 'vitest'
import { ligneAccord, ongletAffiche, ongletsContact, puceTemperatureFiche } from './fiche-contact'

describe('onglets de la fiche', () => {
  it('garde les mêmes onglets partout, plus « Infos » après Activité sans colonne de profil', () => {
    expect(ongletsContact('ordinateur')).toEqual(['activite', 'projets', 'taches', 'biens'])
    expect(ongletsContact('telephone')).toEqual(['activite', 'infos', 'projets', 'taches', 'biens'])
    expect(ongletsContact('tablette')).toEqual(ongletsContact('telephone'))
  })

  it('suit l’adresse, et mène « Infos » à « Activité » sur grand écran', () => {
    expect(ongletAffiche('projets', 'ordinateur')).toBe('projets')
    expect(ongletAffiche(null, 'telephone')).toBe('activite')
    expect(ongletAffiche('n’importe quoi', 'ordinateur')).toBe('activite')
    expect(ongletAffiche('biens', 'telephone')).toBe('biens')
    expect(ongletAffiche('infos', 'ordinateur')).toBe('activite')
    expect(ongletAffiche('infos', 'tablette')).toBe('infos')
  })
})

describe('phrases du profil', () => {
  it('dit depuis quand le contact accepte d’être appelé', () => {
    expect(ligneAccord({ accord_appel_date: '2026-03-02' })).toBe(
      'Accepte d’être appelé depuis le 2 mars 2026',
    )
    expect(ligneAccord({ accord_appel_date: null })).toBe('Accepte d’être appelé')
  })
})

describe('puce de température de l’en-tête', () => {
  it('écrit la température et lui donne sa couleur', () => {
    expect(puceTemperatureFiche('chaud')).toEqual({
      texte: 'Chaud',
      couleur: 'bg-danger',
      annonce: 'Température : chaud, changer',
    })
    expect(puceTemperatureFiche('tiede').couleur).toBe('bg-alerte')
    expect(puceTemperatureFiche('froid').couleur).toBe('bg-accent')
  })

  it('dit « En veille » en gris', () => {
    expect(puceTemperatureFiche('veille')).toMatchObject({
      texte: 'En veille',
      couleur: 'bg-bord-fort',
    })
  })

  it('invite à choisir quand rien n’est renseigné', () => {
    expect(puceTemperatureFiche(null)).toEqual({
      texte: 'Température',
      couleur: null,
      annonce: 'Température non renseignée, choisir',
    })
  })
})
