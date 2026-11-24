import { describe, expect, it } from 'vitest'
import {
  bornesVue,
  dateReport,
  libelleJour,
  prochainLundi,
  reportsRapides,
  vueDe,
} from './echeances'

// Mardi 17 novembre 2026 : la semaine se termine le dimanche 22.
const MARDI = '2026-11-17'

describe('dateReport', () => {
  it('compte depuis aujourd’hui', () => {
    expect(dateReport('demain', MARDI)).toBe('2026-11-18')
    expect(dateReport('trois_jours', MARDI)).toBe('2026-11-20')
    expect(dateReport('semaine', MARDI)).toBe('2026-11-24')
  })

  it('passe les fins de mois et d’année', () => {
    expect(dateReport('demain', '2027-01-31')).toBe('2027-02-01')
    expect(dateReport('trois_jours', '2027-02-27')).toBe('2027-03-02')
    expect(dateReport('trois_jours', '2028-02-27')).toBe('2028-03-01')
    expect(dateReport('semaine', '2026-12-28')).toBe('2027-01-04')
  })

  it('ne se décale pas aux changements d’heure', () => {
    expect(dateReport('demain', '2026-03-28')).toBe('2026-03-29')
    expect(dateReport('semaine', '2026-03-25')).toBe('2026-04-01')
    expect(dateReport('demain', '2026-10-24')).toBe('2026-10-25')
    expect(dateReport('trois_jours', '2026-10-24')).toBe('2026-10-27')
  })
})

describe('vues', () => {
  it('range une tâche dans la bonne vue', () => {
    expect(vueDe('2026-11-16', MARDI)).toBe('en_retard')
    expect(vueDe(MARDI, MARDI)).toBe('aujourdhui')
    expect(vueDe('2026-11-18', MARDI)).toBe('semaine')
    expect(vueDe('2026-11-22', MARDI)).toBe('semaine')
    expect(vueDe('2026-11-23', MARDI)).toBe('plus_tard')
  })

  it('retrouve une tâche reportée dans la vue attendue', () => {
    expect(vueDe(dateReport('demain', MARDI), MARDI)).toBe('semaine')
    expect(vueDe(dateReport('semaine', MARDI), MARDI)).toBe('plus_tard')
    // Le samedi, « demain » est encore dans la semaine ; « dans 3 jours » n'y est plus.
    expect(vueDe(dateReport('demain', '2026-11-21'), '2026-11-21')).toBe('semaine')
    expect(vueDe(dateReport('trois_jours', '2026-11-21'), '2026-11-21')).toBe('plus_tard')
  })

  it('donne des bornes cohérentes avec vueDe', () => {
    expect(bornesVue('en_retard', MARDI)).toEqual({ max: '2026-11-16' })
    expect(bornesVue('aujourdhui', MARDI)).toEqual({ min: MARDI, max: MARDI })
    expect(bornesVue('semaine', MARDI)).toEqual({ min: '2026-11-18', max: '2026-11-22' })
    expect(bornesVue('plus_tard', MARDI)).toEqual({ min: '2026-11-23' })
  })

  it('le dimanche, « Semaine » est vide et demain est « Plus tard »', () => {
    const dimanche = '2026-11-22'
    const { min = '', max = '' } = bornesVue('semaine', dimanche)
    expect(min > max).toBe(true)
    expect(vueDe('2026-11-23', dimanche)).toBe('plus_tard')
  })
})

describe('libelleJour', () => {
  it('dit les jours proches en toutes lettres', () => {
    expect(libelleJour(MARDI, MARDI)).toBe("Aujourd'hui")
    expect(libelleJour('2026-11-18', MARDI)).toBe('Demain')
    expect(libelleJour('2026-11-16', MARDI)).toBe('Hier')
    expect(libelleJour('2026-11-20', MARDI)).toBe('ven. 20 nov.')
  })
})

describe('reports en un geste', () => {
  it('propose demain, dans 3 jours et lundi prochain, comptés depuis aujourd’hui', () => {
    // Samedi 21 novembre 2026.
    expect(reportsRapides('2026-11-21')).toEqual([
      { valeur: 'demain', libelle: 'Demain', date: '2026-11-22' },
      { valeur: 'trois_jours', libelle: 'Dans 3 jours', date: '2026-11-24' },
      { valeur: 'lundi', libelle: 'Lundi', date: '2026-11-23' },
    ])
  })

  it('le prochain lundi est toujours après aujourd’hui, jamais aujourd’hui', () => {
    expect(prochainLundi('2026-11-23')).toBe('2026-11-30') // un lundi : le suivant
    expect(prochainLundi('2026-11-24')).toBe('2026-11-30') // mardi
    expect(prochainLundi('2026-11-27')).toBe('2026-11-30') // vendredi
    expect(prochainLundi('2026-11-29')).toBe('2026-11-30') // dimanche : demain
  })

  it('passe les fins de mois et d’année', () => {
    expect(prochainLundi('2026-12-31')).toBe('2027-01-04')
    expect(reportsRapides('2026-12-30').map((report) => report.date)).toEqual([
      '2026-12-31',
      '2027-01-02',
      '2027-01-04',
    ])
  })

  it('garde ses trois choix même quand deux tombent le même jour', () => {
    const vendredi = reportsRapides('2026-11-27').map((report) => report.date)
    expect(vendredi).toEqual(['2026-11-28', '2026-11-30', '2026-11-30'])
  })
})
