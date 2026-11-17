import { describe, expect, it } from 'vitest'
import {
  conditionsContacts,
  FILTRES_VIDES,
  lireFiltres,
  listeRestreinte,
  nombreFiltres,
  type FiltresContacts,
} from './filtres'

const FILTRES: FiltresContacts = {
  recherche: 'Camille 06 39',
  role: 'vendeur',
  etiquette: 'investisseur',
  source: 'pige',
  temperature: 'chaud',
  sansAction: true,
}

describe('nombreFiltres et listeRestreinte', () => {
  it('comptent les filtres choisis, sans la recherche ni la vue', () => {
    expect(nombreFiltres(FILTRES_VIDES)).toBe(0)
    expect(nombreFiltres(FILTRES)).toBe(4)
    expect(nombreFiltres({ ...FILTRES_VIDES, recherche: 'camille' })).toBe(0)
    expect(nombreFiltres({ ...FILTRES_VIDES, sansAction: true })).toBe(0)
  })

  it('disent si la liste est restreinte', () => {
    expect(listeRestreinte(FILTRES_VIDES)).toBe(false)
    expect(listeRestreinte({ ...FILTRES_VIDES, recherche: '   ' })).toBe(false)
    expect(listeRestreinte({ ...FILTRES_VIDES, recherche: 'camille' })).toBe(true)
    expect(listeRestreinte({ ...FILTRES_VIDES, temperature: 'froid' })).toBe(true)
  })
})

describe('conditionsContacts', () => {
  it('ne pose aucune condition sans recherche ni filtre', () => {
    expect(conditionsContacts(FILTRES_VIDES)).toEqual([])
  })

  it('combine chaque mot cherché et chaque filtre', () => {
    expect(conditionsContacts(FILTRES)).toEqual([
      { colonne: 'recherche', genre: 'contient', valeur: 'camille' },
      { colonne: 'recherche', genre: 'contient', valeur: '0639' },
      { colonne: 'roles', genre: 'comprend', valeur: ['vendeur'] },
      { colonne: 'etiquettes', genre: 'comprend', valeur: ['investisseur'] },
      { colonne: 'source', genre: 'egal', valeur: 'pige' },
      { colonne: 'temperature', genre: 'egal', valeur: 'chaud' },
      { colonne: 'prochaine_action_le', genre: 'vide' },
    ])
  })

  it('ne garde que les fiches sans prochaine action dans cette vue', () => {
    expect(conditionsContacts({ ...FILTRES_VIDES, sansAction: true })).toEqual([
      { colonne: 'prochaine_action_le', genre: 'vide' },
    ])
  })
})

describe('lireFiltres', () => {
  it('relit ce qui a été mis en mémoire', () => {
    expect(lireFiltres(JSON.stringify(FILTRES))).toEqual(FILTRES)
  })

  it('repart de zéro si la mémoire est vide ou illisible', () => {
    expect(lireFiltres(null)).toEqual(FILTRES_VIDES)
    expect(lireFiltres('pas du JSON')).toEqual(FILTRES_VIDES)
    expect(lireFiltres('42')).toEqual(FILTRES_VIDES)
  })

  it('ignore une valeur inconnue sans perdre les autres', () => {
    const memoire = JSON.stringify({ ...FILTRES, role: 'pirate', source: 12, sansAction: 'oui' })
    expect(lireFiltres(memoire)).toEqual({ ...FILTRES, role: '', source: '', sansAction: false })
  })
})
