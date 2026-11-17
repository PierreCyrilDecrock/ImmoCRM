import { describe, expect, it } from 'vitest'
import { bornesPeriode, estPeriode, libelleJourActivite, PERIODES } from './periodes'

const MARDI = '2026-11-17'

describe('bornesPeriode', () => {
  it('donne des bornes incluses, jusqu’à aujourd’hui', () => {
    expect(bornesPeriode('tout', MARDI)).toEqual({})
    expect(bornesPeriode('aujourdhui', MARDI)).toEqual({ min: MARDI, max: MARDI })
    expect(bornesPeriode('hier', MARDI)).toEqual({ min: '2026-11-16', max: '2026-11-16' })
    expect(bornesPeriode('sept_jours', MARDI)).toEqual({ min: '2026-11-11', max: MARDI })
    expect(bornesPeriode('trente_jours', MARDI)).toEqual({ min: '2026-10-19', max: MARDI })
    expect(bornesPeriode('mois', MARDI)).toEqual({ min: '2026-11-01', max: MARDI })
    expect(bornesPeriode('annee', MARDI)).toEqual({ min: '2026-01-01', max: MARDI })
  })

  it('« le mois dernier » va du premier au dernier jour du mois précédent', () => {
    expect(bornesPeriode('mois_dernier', MARDI)).toEqual({ min: '2026-10-01', max: '2026-10-31' })
    expect(bornesPeriode('mois_dernier', '2027-03-31')).toEqual({
      min: '2027-02-01',
      max: '2027-02-28',
    })
    expect(bornesPeriode('mois_dernier', '2027-01-15')).toEqual({
      min: '2026-12-01',
      max: '2026-12-31',
    })
  })

  it('le 1er janvier, « hier » et « 7 derniers jours » remontent dans l’année précédente', () => {
    expect(bornesPeriode('hier', '2027-01-01')).toEqual({ min: '2026-12-31', max: '2026-12-31' })
    expect(bornesPeriode('sept_jours', '2027-01-01')).toEqual({
      min: '2026-12-26',
      max: '2027-01-01',
    })
  })

  it('« dates choisies » : côté vide ouvert, dates inversées remises dans l’ordre', () => {
    expect(bornesPeriode('dates', MARDI, { du: '2026-11-01', au: '2026-11-10' })).toEqual({
      min: '2026-11-01',
      max: '2026-11-10',
    })
    expect(bornesPeriode('dates', MARDI, { du: '2026-11-10', au: '2026-11-01' })).toEqual({
      min: '2026-11-01',
      max: '2026-11-10',
    })
    expect(bornesPeriode('dates', MARDI, { du: '2026-11-05', au: '' })).toEqual({
      min: '2026-11-05',
    })
    expect(bornesPeriode('dates', MARDI, { du: 'n’importe quoi', au: '2026-11-05' })).toEqual({
      max: '2026-11-05',
    })
    expect(bornesPeriode('dates', MARDI)).toEqual({})
  })
})

describe('estPeriode', () => {
  it('reconnaît les périodes de la liste', () => {
    for (const option of PERIODES) expect(estPeriode(option.valeur)).toBe(true)
    expect(estPeriode('semaine')).toBe(false)
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
