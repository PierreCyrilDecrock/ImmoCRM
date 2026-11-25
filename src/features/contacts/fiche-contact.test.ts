import { describe, expect, it } from 'vitest'
import { activiteEssai } from '../activites/activite-essai'
import {
  dernierEchangeCourt,
  ligneAccord,
  ongletAffiche,
  ongletsContact,
  puceTemperatureFiche,
} from './fiche-contact'

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

describe('dernier échange de l’en-tête', () => {
  const AUJOURDHUI = '2026-11-24'
  /** Le texte, espaces insécables rendues visibles (« _ »). */
  const court = (valeurs: Parameters<typeof activiteEssai>[0]) =>
    dernierEchangeCourt(activiteEssai(valeurs), AUJOURDHUI).texte.replaceAll('\u00a0', '_')

  it('dit le type, le résultat d’un appel et l’ancienneté, en une ligne courte', () => {
    expect(court({ type: 'appel', resultat: 'joint', date_activite: '2026-11-17' })).toBe(
      'Appel joint_· il_y_a_7_j',
    )
    expect(court({ type: 'appel', resultat: 'pas_de_reponse', date_activite: '2026-11-23' })).toBe(
      'Appel sans réponse_· hier',
    )
    expect(court({ type: 'appel', resultat: 'messagerie', date_activite: '2026-10-27' })).toBe(
      'Appel en messagerie_· il_y_a_4_sem.',
    )
    expect(court({ type: 'appel', resultat: null, date_activite: AUJOURDHUI })).toBe(
      'Appel_· aujourd’hui',
    )
    expect(court({ type: 'rendez_vous', date_activite: '2026-08-01' })).toBe(
      'Rendez-vous_· il_y_a_3_mois',
    )
    expect(court({ type: 'sms', date_activite: '2025-01-01' })).toBe('SMS_· il_y_a_plus_d’un_an')
    expect(court({ type: 'autre', date_activite: AUJOURDHUI })).toBe('Échange_· aujourd’hui')
  })

  it('ne laisse jamais une ligne commencer par un point', () => {
    const { texte } = dernierEchangeCourt(
      activiteEssai({ type: 'appel', resultat: 'messagerie', date_activite: '2026-11-17' }),
      AUJOURDHUI,
    )
    // Seule coupure possible après le point : l'espace qui le suit.
    expect(texte).not.toMatch(/ ·/)
    expect(texte.split('·')[1]?.trim()).not.toContain(' ')
  })

  it('dit la phrase entière aux lecteurs d’écran', () => {
    expect(
      dernierEchangeCourt(
        activiteEssai({ type: 'appel', resultat: 'joint', date_activite: '2026-11-17' }),
        AUJOURDHUI,
      ).annonce,
    ).toBe('Dernier échange : appel joint, il y a 7 jours')
  })

  it('dit « Jamais contacté » sans aucun échange', () => {
    expect(dernierEchangeCourt(null, AUJOURDHUI)).toEqual({
      texte: 'Jamais contacté',
      annonce: 'Jamais contacté',
    })
  })
})
