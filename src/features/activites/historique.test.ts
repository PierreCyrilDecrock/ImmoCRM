import { describe, expect, it } from 'vitest'
import { activiteEssai } from './activite-essai'
import {
  compterTypes,
  filtreTypes,
  filtreTypesVisible,
  pastilleResultat,
  pastillesTypes,
  titreJourHistorique,
} from './historique'

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

describe('filtre par type en pastilles', () => {
  const cinq = compterTypes(['appel', 'note', 'appel', 'visite', 'appel'], true)

  it('compte chaque type, et ignore un type inconnu', () => {
    expect(cinq).toEqual({ parType: { appel: 3, note: 1, visite: 1 }, total: 5, complet: true })
    expect(compterTypes(['appel', 'fax'], true).total).toBe(1)
  })

  it('propose « Tout », puis seulement les types présents, avec leur nombre', () => {
    expect(pastillesTypes(cinq, '').map((p) => `${p.libelle} ${p.nombre ?? ''}`)).toEqual([
      'Tout 5',
      'Appels 3',
      'Note 1',
      'Visite 1',
    ])
    expect(pastillesTypes(cinq, '')[1]).toEqual({
      valeur: 'appel',
      libelle: 'Appels',
      nombre: '3',
      annonce: 'Appels, 3',
    })
    expect(pastillesTypes(cinq, '')[0]?.annonce).toBe('Tous les types, 5')
  })

  it('garde le type choisi, même quand il n’en reste plus', () => {
    const sansVisite = compterTypes(['appel', 'appel', 'note', 'sms'], true)
    expect(pastillesTypes(sansVisite, 'visite').map((p) => p.valeur)).toEqual([
      '',
      'appel',
      'sms',
      'note',
      'visite',
    ])
    expect(pastillesTypes(sansVisite, 'visite').at(-1)?.nombre).toBe('0')
  })

  it('montre tous les types sans nombre quand la lecture a atteint sa borne', () => {
    const borne = compterTypes(['appel', 'appel'], false)
    const pastilles = pastillesTypes(borne, '')
    expect(pastilles).toHaveLength(11)
    expect(pastilles.every((p) => p.nombre === null)).toBe(true)
    expect(pastilles[0]?.annonce).toBe('Tous les types')
  })

  it('écrit les grands nombres à la française', () => {
    const beaucoup = compterTypes(Array<string>(1200).fill('appel'), true)
    expect(pastillesTypes(beaucoup, '')[0]?.nombre).toBe('1\u202f200')
  })

  it('masque la rangée sous quatre échanges, la garde quand un type est choisi', () => {
    expect(filtreTypesVisible(compterTypes(['appel', 'note', 'sms'], true), '')).toBe(false)
    expect(filtreTypesVisible(compterTypes(['appel', 'note', 'sms', 'sms'], true), '')).toBe(true)
    expect(filtreTypesVisible(null, '')).toBe(false)
    expect(filtreTypesVisible(null, 'appel')).toBe(true)
    expect(filtreTypesVisible(compterTypes([], true), 'appel')).toBe(true)
    expect(filtreTypesVisible(compterTypes(['appel'], false), '')).toBe(true)
  })

  it('donne les pastilles à montrer, ou rien', () => {
    expect(filtreTypes(compterTypes(['appel'], true), '')).toBeNull()
    expect(filtreTypes(cinq, 'appel')?.[1]?.libelle).toBe('Appels')
    // Comptes illisibles, un type choisi : tous les types, sans nombre, pour revenir à « Tout ».
    expect(filtreTypes(null, 'sms')).toHaveLength(11)
  })
})
