import { describe, expect, it } from 'vitest'
import { dateDeSerie, libelleRecurrence, occurrenceSuivante, type Occurrence } from './recurrence'

/** Une occurrence d'essai ; par défaut la première d'une série mensuelle du 31 janvier. */
function occurrence(valeurs: Partial<Occurrence> = {}): Occurrence {
  return { recurrence: 'mois', ancre: '2027-01-31', rang: 0, echeance: '2027-01-31', ...valeurs }
}

describe('dateDeSerie', () => {
  it('calcule chaque fréquence à partir de la première date', () => {
    expect(dateDeSerie('jour', '2026-11-17', 3)).toBe('2026-11-20')
    expect(dateDeSerie('semaine', '2026-11-17', 2)).toBe('2026-12-01')
    expect(dateDeSerie('deux_semaines', '2026-11-17', 1)).toBe('2026-12-01')
    expect(dateDeSerie('mois', '2026-11-17', 3)).toBe('2027-02-17')
    expect(dateDeSerie('an', '2026-11-17', 1)).toBe('2027-11-17')
  })

  it('garde le 31 du mois d’un mois à l’autre, ou prend le dernier jour', () => {
    const serie = [0, 1, 2, 3, 4].map((rang) => dateDeSerie('mois', '2027-01-31', rang))
    expect(serie).toEqual(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'])
  })

  it('tombe le 29 février les années bissextiles seulement', () => {
    const serie = [0, 1, 4].map((rang) => dateDeSerie('an', '2028-02-29', rang))
    expect(serie).toEqual(['2028-02-29', '2029-02-28', '2032-02-29'])
  })

  it('ne se décale pas aux changements d’heure', () => {
    // Le passage à l'heure d'été a lieu le 29 mars 2026, celui à l'heure d'hiver le 25 octobre.
    expect(dateDeSerie('semaine', '2026-03-23', 1)).toBe('2026-03-30')
    expect(dateDeSerie('jour', '2026-03-28', 2)).toBe('2026-03-30')
    expect(dateDeSerie('deux_semaines', '2026-10-19', 1)).toBe('2026-11-02')
  })
})

describe('occurrenceSuivante', () => {
  it('une tâche mensuelle close le 31 janvier revient fin février', () => {
    expect(occurrenceSuivante(occurrence(), '2027-01-31')).toEqual({
      echeance: '2027-02-28',
      rang: 1,
    })
  })

  it('puis revient le 31 mars, pas le 28', () => {
    const fevrier = occurrence({ rang: 1, echeance: '2027-02-28' })
    expect(occurrenceSuivante(fevrier, '2027-02-28')).toEqual({ echeance: '2027-03-31', rang: 2 })
  })

  it('close en avance, la suivante reste à sa date prévue', () => {
    expect(occurrenceSuivante(occurrence(), '2027-01-20')?.echeance).toBe('2027-02-28')
  })

  it('un report ne décale pas la série', () => {
    const reportee = occurrence({ echeance: '2027-02-03' })
    expect(occurrenceSuivante(reportee, '2027-02-03')).toEqual({ echeance: '2027-02-28', rang: 1 })
  })

  it('une occurrence avancée avant sa date ne recrée pas la même échéance', () => {
    // Troisième occurrence (31 mars) avancée au 25 mars : la suivante est fin avril.
    const avancee = occurrence({ rang: 2, echeance: '2027-03-25' })
    expect(occurrenceSuivante(avancee, '2027-03-25')).toEqual({ echeance: '2027-04-30', rang: 3 })
  })

  it('close en retard, les dates déjà passées sont sautées', () => {
    expect(occurrenceSuivante(occurrence(), '2027-03-10')).toEqual({
      echeance: '2027-03-31',
      rang: 2,
    })
    const quotidienne = occurrence({
      recurrence: 'jour',
      ancre: '2026-11-01',
      echeance: '2026-11-01',
    })
    expect(occurrenceSuivante(quotidienne, '2026-11-17')).toEqual({
      echeance: '2026-11-17',
      rang: 16,
    })
  })

  it('traverse les changements d’heure sans perdre de jour', () => {
    const hebdo = occurrence({ recurrence: 'semaine', ancre: '2026-10-21', echeance: '2026-10-21' })
    expect(occurrenceSuivante(hebdo, '2026-10-21')?.echeance).toBe('2026-10-28')
    const quinzaine = occurrence({
      recurrence: 'deux_semaines',
      ancre: '2026-03-20',
      echeance: '2026-03-20',
    })
    expect(occurrenceSuivante(quinzaine, '2026-03-20')?.echeance).toBe('2026-04-03')
  })

  it('passe à l’année suivante pour une tâche annuelle', () => {
    const annuelle = occurrence({ recurrence: 'an', ancre: '2026-12-31', echeance: '2026-12-31' })
    expect(occurrenceSuivante(annuelle, '2026-12-31')).toEqual({ echeance: '2027-12-31', rang: 1 })
  })
})

describe('libelleRecurrence', () => {
  it('donne le libellé en clair', () => {
    expect(libelleRecurrence('deux_semaines')).toBe('Toutes les deux semaines')
    expect(libelleRecurrence(null)).toBeNull()
    expect(libelleRecurrence('inconnue')).toBeNull()
  })
})
