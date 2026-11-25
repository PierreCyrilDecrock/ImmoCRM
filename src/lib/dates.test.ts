import { describe, expect, it } from 'vitest'
import {
  ajouterJours,
  depuisLeMoment,
  depuisQuand,
  ajouterMois,
  dateDuJour,
  estHeureValide,
  heureDuMoment,
  ecartJours,
  estDateValide,
  finDeSemaine,
  formaterDate,
  formaterDuree,
  formaterHeure,
  formaterJourCourt,
  formaterJourSemaine,
  formaterJourLong,
  heureDeFin,
  instantDeParis,
  formaterJourEtSemaine,
  jourDeSemaine,
  jourEnMots,
  minutesDuJour,
  numeroSemaine,
} from './dates'

describe('formaterDate', () => {
  it('écrit la date en toutes lettres, à la française', () => {
    expect(formaterDate('2026-11-16T09:00:00Z')).toBe('16 novembre 2026')
    expect(formaterDate('2026-03-01T12:00:00+00:00')).toBe('1 mars 2026')
  })

  it('se cale sur l’heure de Paris, pas sur celle de l’appareil', () => {
    // 23 h 30 en temps universel : déjà le lendemain à Paris.
    expect(formaterDate('2026-12-31T23:30:00Z')).toBe('1 janvier 2027')
  })

  it('renvoie une chaîne vide pour une date absente ou illisible', () => {
    expect(formaterDate(null)).toBe('')
    expect(formaterDate(undefined)).toBe('')
    expect(formaterDate('')).toBe('')
    expect(formaterDate('pas une date')).toBe('')
  })
})

describe('dateDuJour', () => {
  it('donne la date de Paris au format de la base', () => {
    expect(dateDuJour(new Date('2026-11-16T09:00:00Z'))).toBe('2026-11-16')
    // 23 h 30 en temps universel : déjà le lendemain à Paris.
    expect(dateDuJour(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
})

describe('estDateValide', () => {
  it('accepte une date qui existe', () => {
    expect(estDateValide('2026-11-16')).toBe(true)
    expect(estDateValide('2028-02-29')).toBe(true)
  })

  it('refuse une date mal écrite ou qui n’existe pas', () => {
    expect(estDateValide('')).toBe(false)
    expect(estDateValide('16/11/2026')).toBe(false)
    expect(estDateValide('2026-02-30')).toBe(false)
  })
})

describe('dateDuJour et les changements d’heure', () => {
  it('reste sur le bon jour la nuit du passage à l’heure d’été (29 mars 2026)', () => {
    // 0 h 30 à Paris, encore en heure d'hiver (UTC+1).
    expect(dateDuJour(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29')
    // 23 h 30 à Paris, déjà en heure d'été (UTC+2).
    expect(dateDuJour(new Date('2026-03-29T21:30:00Z'))).toBe('2026-03-29')
    expect(dateDuJour(new Date('2026-03-29T22:30:00Z'))).toBe('2026-03-30')
  })

  it('reste sur le bon jour la nuit du passage à l’heure d’hiver (25 octobre 2026)', () => {
    expect(dateDuJour(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25')
    expect(dateDuJour(new Date('2026-10-25T22:30:00Z'))).toBe('2026-10-25')
    expect(dateDuJour(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26')
  })
})

describe('ajouterJours', () => {
  it('passe les fins de mois et d’année', () => {
    expect(ajouterJours('2027-01-31', 1)).toBe('2027-02-01')
    expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01')
    expect(ajouterJours('2028-02-28', 1)).toBe('2028-02-29')
    expect(ajouterJours('2027-02-28', 1)).toBe('2027-03-01')
    expect(ajouterJours('2027-03-01', -1)).toBe('2027-02-28')
  })

  it('ne saute ni ne double aucun jour aux changements d’heure', () => {
    expect(ajouterJours('2026-03-28', 1)).toBe('2026-03-29')
    expect(ajouterJours('2026-03-29', 1)).toBe('2026-03-30')
    expect(ajouterJours('2026-10-25', 1)).toBe('2026-10-26')
    expect(ajouterJours('2026-10-24', 7)).toBe('2026-10-31')
    expect(ecartJours('2026-03-28', '2026-03-30')).toBe(2)
    expect(ecartJours('2026-10-30', '2026-10-24')).toBe(-6)
  })
})

describe('ajouterMois', () => {
  it('garde le jour quand il existe', () => {
    expect(ajouterMois('2026-11-15', 1)).toBe('2026-12-15')
    expect(ajouterMois('2026-11-15', 2)).toBe('2027-01-15')
    expect(ajouterMois('2026-11-15', -11)).toBe('2025-12-15')
  })

  it('prend le dernier jour du mois quand le jour n’existe pas', () => {
    expect(ajouterMois('2027-01-31', 1)).toBe('2027-02-28')
    expect(ajouterMois('2028-01-31', 1)).toBe('2028-02-29')
    expect(ajouterMois('2027-03-31', 1)).toBe('2027-04-30')
    expect(ajouterMois('2028-02-29', 12)).toBe('2029-02-28')
  })
})

describe('semaine', () => {
  it('compte du lundi (1) au dimanche (7)', () => {
    expect(jourDeSemaine('2026-11-16')).toBe(1)
    expect(jourDeSemaine('2026-11-22')).toBe(7)
    expect(finDeSemaine('2026-11-17')).toBe('2026-11-22')
    expect(finDeSemaine('2026-11-22')).toBe('2026-11-22')
    expect(finDeSemaine('2026-12-30')).toBe('2027-01-03')
  })
})

describe('formats courts', () => {
  it('écrit un jour en abrégé, avec l’année seulement si elle change', () => {
    expect(formaterJourCourt('2026-11-18', '2026-11-17')).toBe('mer. 18 nov.')
    expect(formaterJourCourt('2027-01-04', '2026-11-17')).toBe('lun. 4 janv. 2027')
    expect(formaterJourCourt('pas une date', '2026-11-17')).toBe('')
  })

  it('écrit le jour de la semaine en entier dans une phrase', () => {
    expect(formaterJourSemaine('2026-11-26', '2026-11-24')).toBe('jeudi 26 nov.')
    expect(formaterJourSemaine('2027-01-04', '2026-11-24')).toBe('lundi 4 janv. 2027')
    expect(formaterJourSemaine('pas une date', '2026-11-24')).toBe('')
  })

  it('écrit une heure et une durée à la française', () => {
    expect(formaterHeure('09:30:00')).toBe('9 h 30')
    expect(formaterHeure('14:00:00')).toBe('14 h')
    expect(formaterHeure(null)).toBe('')
    expect(formaterDuree(30)).toBe('30 min')
    expect(formaterDuree(60)).toBe('1 h')
    expect(formaterDuree(90)).toBe('1 h 30')
    expect(formaterDuree(125)).toBe('2 h 05')
  })

  it('calcule l’heure de fin, sans dépasser minuit', () => {
    expect(heureDeFin('09:30:00', 90)).toBe('11:00')
    expect(heureDeFin('23:00', 30)).toBe('23:30')
    expect(heureDeFin('23:30', 60)).toBeNull()
  })
})

describe('heureDuMoment', () => {
  it("donne l'heure de Paris, en hiver comme en été", () => {
    expect(heureDuMoment(new Date('2026-11-17T08:05:00Z'))).toBe('09:05')
    expect(heureDuMoment(new Date('2026-07-01T12:30:00Z'))).toBe('14:30')
  })

  it('écrit minuit 00:00, pas 24:00', () => {
    expect(heureDuMoment(new Date('2026-11-16T23:00:00Z'))).toBe('00:00')
  })
})

describe('estHeureValide', () => {
  it('accepte une heure HH:MM et refuse le reste', () => {
    expect(estHeureValide('09:05')).toBe(true)
    expect(estHeureValide('23:59')).toBe(true)
    expect(estHeureValide('24:00')).toBe(false)
    expect(estHeureValide('9:05')).toBe(false)
    expect(estHeureValide('')).toBe(false)
  })
})

describe('instantDeParis', () => {
  it('retire une heure en hiver et deux en été', () => {
    expect(instantDeParis('2026-11-17', '14:30')).toBe('2026-11-17T13:30:00.000Z')
    expect(instantDeParis('2026-07-01', '09:05')).toBe('2026-07-01T07:05:00.000Z')
  })

  it('se relit à l’identique', () => {
    const instant = new Date(instantDeParis('2026-03-29', '10:00'))
    expect(dateDuJour(instant)).toBe('2026-03-29')
    expect(heureDuMoment(instant)).toBe('10:00')
  })
})

describe('formaterJourLong', () => {
  it('écrit le jour en toutes lettres, avec une majuscule', () => {
    expect(formaterJourLong('2026-11-17')).toBe('Mardi 17 novembre')
    expect(formaterJourLong('2027-01-01')).toBe('Vendredi 1 janvier')
  })

  it('reste vide pour une date illisible', () => {
    expect(formaterJourLong('2026-02-30')).toBe('')
  })
})

describe('numeroSemaine', () => {
  it('suit la norme ISO des agendas français', () => {
    expect(numeroSemaine('2026-11-21')).toBe(47)
    expect(numeroSemaine('2026-01-01')).toBe(1)
    expect(numeroSemaine('2026-01-04')).toBe(1)
    expect(numeroSemaine('2026-01-05')).toBe(2)
  })

  it('rattache les jours de fin et de début d’année à la bonne semaine', () => {
    expect(numeroSemaine('2025-12-29')).toBe(1)
    expect(numeroSemaine('2026-12-31')).toBe(53)
    expect(numeroSemaine('2027-01-01')).toBe(53)
    expect(numeroSemaine('2027-01-04')).toBe(1)
  })
})

describe('formaterJourEtSemaine', () => {
  it('donne le jour en toutes lettres et la semaine', () => {
    expect(formaterJourEtSemaine('2026-11-21')).toBe('Samedi 21 novembre · semaine 47')
    expect(formaterJourEtSemaine('n’importe quoi')).toBe('')
  })
})

describe('minutesDuJour', () => {
  it('compte les minutes depuis minuit', () => {
    expect(minutesDuJour('00:00')).toBe(0)
    expect(minutesDuJour('09:30:00')).toBe(570)
    expect(minutesDuJour('23:59')).toBe(1439)
  })

  it('refuse une heure illisible', () => {
    expect(minutesDuJour('24:00')).toBeNull()
    expect(minutesDuJour('midi')).toBeNull()
  })
})

describe('depuisQuand', () => {
  it('dit depuis combien de temps, en mots simples', () => {
    expect(depuisQuand(0)).toBe("aujourd'hui")
    expect(depuisQuand(1)).toBe('hier')
    expect(depuisQuand(8)).toBe('il y a 8 jours')
    expect(depuisQuand(75)).toBe('il y a 2 mois')
    expect(depuisQuand(400)).toBe("il y a plus d'un an")
  })
})

describe('depuisLeMoment', () => {
  it('compte les jours du calendrier de Paris', () => {
    expect(depuisLeMoment('2026-11-19T10:00:00Z', '2026-11-22')).toBe('il y a 3 jours')
    // 23 h 30 en temps universel le 21 : déjà le 22 à Paris.
    expect(depuisLeMoment('2026-11-21T23:30:00Z', '2026-11-22')).toBe("aujourd'hui")
  })

  it('ne dit rien d’un moment illisible', () => {
    expect(depuisLeMoment('jamais', '2026-11-22')).toBe('')
  })
})

describe('jourEnMots', () => {
  // Mardi 24 novembre 2026.
  const MARDI = '2026-11-24'

  it('dit aujourd’hui et demain en mots', () => {
    expect(jourEnMots(MARDI, MARDI)).toBe('aujourd’hui')
    expect(jourEnMots('2026-11-25', MARDI)).toBe('demain')
  })

  it('donne le nom du jour jusqu’à six jours, la date au-delà', () => {
    expect(jourEnMots('2026-11-26', MARDI)).toBe('jeudi')
    expect(jourEnMots('2026-11-30', MARDI)).toBe('lundi')
    expect(jourEnMots('2026-12-01', MARDI)).toBe('mar. 1 déc.')
    expect(jourEnMots('2027-01-04', MARDI)).toBe('lun. 4 janv. 2027')
  })

  it('écrit la date d’un jour passé, et rien pour une date illisible', () => {
    expect(jourEnMots('2026-11-23', MARDI)).toBe('lun. 23 nov.')
    expect(jourEnMots('pas une date', MARDI)).toBe('')
  })
})
