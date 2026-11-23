import { describe, expect, it } from 'vitest'
import { activiteEssai } from './activite-essai'
import { pastilleResultat, titreJourHistorique } from './historique'

const AUJOURDHUI = '2026-11-21'

describe('titreJourHistorique', () => {
  it('dit le jour en toutes lettres et depuis quand', () => {
    expect(titreJourHistorique('2026-11-13', AUJOURDHUI)).toBe(
      'Vendredi 13 novembre · il y a 8 jours',
    )
    expect(titreJourHistorique(AUJOURDHUI, AUJOURDHUI)).toBe("Aujourd'hui")
    expect(titreJourHistorique('2026-11-20', AUJOURDHUI)).toBe('Hier')
  })

  it('ajoute l’année quand elle diffère', () => {
    expect(titreJourHistorique('2025-11-13', AUJOURDHUI)).toBe(
      "Jeudi 13 novembre 2025 · il y a plus d'un an",
    )
  })

  it('n’écrit pas « il y a » pour une date à venir', () => {
    expect(titreJourHistorique('2026-11-25', AUJOURDHUI)).toBe('Mercredi 25 novembre')
  })
})

describe('pastilleResultat', () => {
  it('montre le résultat d’un appel', () => {
    expect(pastilleResultat(activiteEssai({ type: 'appel', resultat: 'pas_de_reponse' }))).toEqual({
      libelle: 'Pas de réponse',
      genre: 'alerte',
    })
    expect(pastilleResultat(activiteEssai({ type: 'appel', resultat: 'joint' }))?.genre).toBe(
      'succes',
    )
    expect(pastilleResultat(activiteEssai({ type: 'appel', resultat: null }))).toBeNull()
  })

  it('montre l’intérêt après une visite', () => {
    expect(
      pastilleResultat(activiteEssai({ type: 'visite', resultat: null, visite_interet: 'fort' })),
    ).toEqual({ libelle: 'Intéressé', genre: 'succes' })
    expect(
      pastilleResultat(activiteEssai({ type: 'visite', resultat: null, visite_interet: 'aucun' }))
        ?.libelle,
    ).toBe('Pas intéressé')
  })

  it('ne montre rien pour les autres activités', () => {
    expect(pastilleResultat(activiteEssai({ type: 'note', resultat: null }))).toBeNull()
  })
})
