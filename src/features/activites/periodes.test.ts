import { describe, expect, it } from 'vitest'
import {
  bornesPeriode,
  estPeriode,
  libelleJourActivite,
  PERIODE_PAR_DEFAUT,
  PERIODES,
} from './periodes'

const MARDI = '2026-11-17'

describe('bornesPeriode', () => {
  it('compte aujourd’hui dans chaque période', () => {
    expect(bornesPeriode('tout', MARDI)).toEqual({})
    expect(bornesPeriode('sept_jours', MARDI)).toEqual({ min: '2026-11-11', max: MARDI })
    expect(bornesPeriode('trente_jours', MARDI)).toEqual({ min: '2026-10-19', max: MARDI })
    expect(bornesPeriode('trois_mois', MARDI)).toEqual({ min: '2026-08-18', max: MARDI })
  })

  it('passe les changements de mois et d’année', () => {
    expect(bornesPeriode('sept_jours', '2027-01-01')).toEqual({
      min: '2026-12-26',
      max: '2027-01-01',
    })
    expect(bornesPeriode('trois_mois', '2027-02-15')).toEqual({
      min: '2026-11-16',
      max: '2027-02-15',
    })
  })
})

describe('PERIODES', () => {
  it('propose quatre périodes courtes, chacune dite en entier', () => {
    expect(PERIODES.map((option) => option.libelle)).toEqual(['7 j', '30 j', '3 mois', 'Tout'])
    expect(PERIODES.map((option) => option.annonce)).toEqual([
      '7 derniers jours',
      '30 derniers jours',
      '3 derniers mois',
      'Tout le journal',
    ])
    expect(estPeriode(PERIODE_PAR_DEFAUT)).toBe(true)
  })
})

describe('estPeriode', () => {
  it('reconnaît les périodes proposées', () => {
    for (const option of PERIODES) expect(estPeriode(option.valeur)).toBe(true)
    expect(estPeriode('semaine')).toBe(false)
    expect(estPeriode('dates')).toBe(false)
  })
})

describe('libelleJourActivite', () => {
  it('nomme aujourd’hui et hier, puis donne la date', () => {
    expect(libelleJourActivite(MARDI, MARDI)).toBe("Aujourd'hui")
    expect(libelleJourActivite('2026-11-16', MARDI)).toBe('Hier')
    expect(libelleJourActivite('2026-11-10', MARDI)).toBe('mar. 10 nov.')
    expect(libelleJourActivite('2025-11-10', MARDI)).toBe('lun. 10 nov. 2025')
  })
})
