import { describe, expect, it } from 'vitest'
import { tacheEssai } from '../taches/tache-essai'
import type { Tache, TacheAffichee } from '../taches/taches'
import {
  aPreparer,
  bornesRendezVous,
  choisirMaintenant,
  DUREE_SANS_FIN,
  etatRendezVous,
  finDuDernierRendezVous,
  LIMITE_A_PREPARER,
  placeDuTrait,
  progression,
  resumeJournee,
  salutation,
  tempsRestant,
} from './maintenant'

const CONTACT = '00000000-0000-4000-8000-0000000000d1'
const AUTRE_CONTACT = '00000000-0000-4000-8000-0000000000d2'
const BIEN = '00000000-0000-4000-8000-0000000000b1'

/** Une tâche affichée pour les tests, sans fiches liées (seuls les identifiants comptent). */
function affichee(id: string, valeurs: Partial<Tache> = {}): TacheAffichee {
  return {
    id,
    tache: tacheEssai({ id, echeance: '2026-11-21', ...valeurs }),
    contact: null,
    bien: null,
  }
}

const h = (heures: number, minutes = 0) => heures * 60 + minutes

/** Une journée type : 9 h – 10 h, 11 h (sans durée), 14 h – 15 h 30, 18 h – 18 h 15. */
const AGENDA = [
  affichee('rdv-9', { heure: '09:00:00', duree: 60, categorie: 'estimation' }),
  affichee('rdv-11', { heure: '11:00:00', duree: null, categorie: 'rendez_vous' }),
  affichee('rdv-14', { heure: '14:00:00', duree: 90, categorie: 'visite' }),
  affichee('rdv-18', { heure: '18:00:00', duree: 15, categorie: 'rendez_vous' }),
]

describe('bornes et état d’un rendez-vous', () => {
  it('compte le début et la fin en minutes', () => {
    expect(bornesRendezVous({ heure: '14:00:00', duree: 90 })).toEqual({ debut: 840, fin: 930 })
    expect(bornesRendezVous({ heure: null, duree: 90 })).toBeNull()
  })

  it('donne une demi-heure à un rendez-vous sans durée', () => {
    expect(bornesRendezVous({ heure: '11:00:00', duree: null })).toEqual({
      debut: 660,
      fin: 660 + DUREE_SANS_FIN,
    })
  })

  it('passe de « à venir » à « en cours » au début, puis à « passé » à la fin', () => {
    const rdv = { heure: '09:00:00', duree: 60 }
    expect(etatRendezVous(rdv, h(8, 59))).toBe('a_venir')
    expect(etatRendezVous(rdv, h(9))).toBe('en_cours')
    expect(etatRendezVous(rdv, h(9, 59))).toBe('en_cours')
    expect(etatRendezVous(rdv, h(10))).toBe('passe')
  })
})

describe('choix de la carte « Maintenant »', () => {
  const relances = ['relance-1', 'relance-2']

  it('montre le prochain rendez-vous tôt le matin', () => {
    expect(choisirMaintenant(AGENDA, relances, h(7, 30))).toEqual({
      genre: 'rendez_vous',
      affichee: AGENDA[0],
      enCours: false,
    })
  })

  it('montre le rendez-vous en cours', () => {
    expect(choisirMaintenant(AGENDA, relances, h(9, 20))).toEqual({
      genre: 'rendez_vous',
      affichee: AGENDA[0],
      enCours: true,
    })
  })

  it('passe au suivant dès que le rendez-vous est fini, même s’il n’est pas coché', () => {
    const choix = choisirMaintenant(AGENDA, relances, h(10))
    expect(choix).toEqual({ genre: 'rendez_vous', affichee: AGENDA[1], enCours: false })
  })

  it('tient un rendez-vous sans durée pour fini au bout d’une demi-heure', () => {
    expect(choisirMaintenant(AGENDA, relances, h(11, 29))).toMatchObject({ enCours: true })
    expect(choisirMaintenant(AGENDA, relances, h(11, 30))).toMatchObject({
      affichee: AGENDA[2],
      enCours: false,
    })
  })

  it('préfère, entre deux rendez-vous en cours, celui qui a commencé le plus tard', () => {
    const creneau = affichee('creneau', { heure: '09:00:00', duree: 180, categorie: 'prospection' })
    const rdv = affichee('rdv', { heure: '10:00:00', duree: 30 })
    expect(choisirMaintenant([creneau, rdv], [], h(10, 10))).toMatchObject({ affichee: rdv })
    expect(choisirMaintenant([creneau, rdv], [], h(10, 40))).toMatchObject({ affichee: creneau })
  })

  it('montre la première relance après le dernier rendez-vous, puis rien', () => {
    expect(choisirMaintenant(AGENDA, relances, h(18, 15))).toEqual({
      genre: 'relance',
      relance: 'relance-1',
    })
    expect(choisirMaintenant([], relances, h(8))).toEqual({
      genre: 'relance',
      relance: 'relance-1',
    })
    expect(choisirMaintenant(AGENDA, [], h(19))).toBeNull()
  })
})

describe('temps restant', () => {
  const rdv = { heure: '14:00:00', duree: 60 }

  it('compte en minutes la dernière heure', () => {
    expect(tempsRestant(rdv, h(13, 35))).toBe('Dans 25 min')
    expect(tempsRestant(rdv, h(13, 59))).toBe('Dans 1 min')
  })

  it('compte en heures et minutes, puis à l’heure près au-delà de trois heures', () => {
    expect(tempsRestant(rdv, h(13))).toBe('Dans 1 h')
    expect(tempsRestant(rdv, h(12, 45))).toBe('Dans 1 h 15')
    expect(tempsRestant(rdv, h(12))).toBe('Dans 2 h')
    expect(tempsRestant(rdv, h(11, 55))).toBe('Dans 2 h 05')
    expect(tempsRestant(rdv, h(9, 40))).toBe('Dans 4 h')
  })

  it('dit « En cours » pendant le rendez-vous, « Terminé » après', () => {
    expect(tempsRestant(rdv, h(14))).toBe('En cours')
    expect(tempsRestant(rdv, h(15))).toBe('Terminé')
  })
})

describe('trait « maintenant » dans l’agenda', () => {
  it('se place devant le premier rendez-vous qui n’a pas commencé', () => {
    expect(placeDuTrait(AGENDA, h(7))).toBe(0)
    expect(placeDuTrait(AGENDA, h(9, 30))).toBe(1)
    expect(placeDuTrait(AGENDA, h(10, 30))).toBe(1)
    expect(placeDuTrait(AGENDA, h(12))).toBe(2)
    expect(placeDuTrait(AGENDA, h(14, 30))).toBe(3)
  })

  it('se place en bas quand tout a commencé', () => {
    expect(placeDuTrait(AGENDA, h(18, 5))).toBe(4)
    expect(placeDuTrait([], h(12))).toBe(0)
  })
})

describe('« À préparer »', () => {
  const rdv = affichee('rdv', { heure: '14:00:00', contact_id: CONTACT, bien_id: BIEN })

  it('retient les tâches liées au même contact ou au même bien', () => {
    const memeContact = affichee('a', { contact_id: CONTACT, categorie: 'administratif' })
    const memeBien = affichee('b', { bien_id: BIEN })
    const autre = affichee('c', { contact_id: AUTRE_CONTACT })
    const sansLien = affichee('d')
    expect(aPreparer(rdv, [memeContact, autre, memeBien, sansLien])).toEqual([
      memeContact,
      memeBien,
    ])
  })

  it('écarte le rendez-vous lui-même, les doublons et les tâches closes', () => {
    const tache = affichee('a', { contact_id: CONTACT })
    const close = affichee('b', { contact_id: CONTACT, etat: 'faite' })
    expect(aPreparer(rdv, [rdv, tache, tache, close])).toEqual([tache])
  })

  it('ne lie rien à un rendez-vous sans contact ni bien', () => {
    expect(aPreparer(affichee('seul'), [affichee('a'), affichee('b')])).toEqual([])
  })

  it(`s'arrête à ${LIMITE_A_PREPARER} tâches`, () => {
    const taches = Array.from({ length: 6 }, (_, rang) =>
      affichee(`t${rang}`, { contact_id: CONTACT }),
    )
    expect(aPreparer(rdv, taches)).toHaveLength(LIMITE_A_PREPARER)
  })
})

describe('salutation', () => {
  it('ajoute le nom affiché s’il existe', () => {
    expect(salutation('Camille')).toBe('Bonjour Camille')
    expect(salutation('  Camille   Fictif ')).toBe('Bonjour Camille Fictif')
    expect(salutation('   ')).toBe('Bonjour')
  })
})

describe('fin du dernier rendez-vous', () => {
  it('prend le rendez-vous qui finit le plus tard', () => {
    expect(finDuDernierRendezVous(AGENDA.map((a) => a.tache))).toEqual({
      heure: '18:15',
      minutes: h(18, 15),
      avecDuree: true,
    })
  })

  it('ne connaît que l’heure de début d’un rendez-vous sans durée', () => {
    expect(
      finDuDernierRendezVous([
        { heure: '09:00:00', duree: 60 },
        { heure: '17:00:00', duree: null },
      ]),
    ).toEqual({ heure: '17:00', minutes: h(17), avecDuree: false })
  })

  it('ne trouve rien sans rendez-vous', () => {
    expect(finDuDernierRendezVous([])).toBeNull()
  })
})

describe('résumé de la journée', () => {
  const fin = { heure: '18:15', minutes: h(18, 15), avecDuree: true }

  it('donne les deux nombres et l’heure de fin', () => {
    expect(resumeJournee({ rendezVous: 4, rappels: 4, fin, minutes: h(8) })).toBe(
      '4 rendez-vous et 4 personnes à rappeler. Votre dernier rendez-vous finit vers 18 h 15.',
    )
  })

  it('a sa tournure pour un', () => {
    expect(resumeJournee({ rendezVous: 1, rappels: 1, fin, minutes: h(8) })).toBe(
      'Un rendez-vous et une personne à rappeler. Votre rendez-vous finit vers 18 h 15.',
    )
  })

  it('a sa tournure pour zéro', () => {
    expect(resumeJournee({ rendezVous: 0, rappels: 0, fin: null, minutes: h(8) })).toBe(
      'Ni rendez-vous ni personne à rappeler aujourd’hui.',
    )
    expect(resumeJournee({ rendezVous: 0, rappels: 3, fin: null, minutes: h(8) })).toBe(
      'Aucun rendez-vous, 3 personnes à rappeler.',
    )
    expect(resumeJournee({ rendezVous: 2, rappels: 0, fin, minutes: h(8) })).toBe(
      '2 rendez-vous, personne à rappeler. Votre dernier rendez-vous finit vers 18 h 15.',
    )
  })

  it('dit « commence à » quand la durée n’est pas connue', () => {
    const debut = { heure: '17:00', minutes: h(17), avecDuree: false }
    expect(resumeJournee({ rendezVous: 2, rappels: 1, fin: debut, minutes: h(8) })).toBe(
      '2 rendez-vous et une personne à rappeler. Votre dernier rendez-vous commence à 17 h.',
    )
  })

  it('ne parle plus de l’heure de fin une fois passée', () => {
    expect(resumeJournee({ rendezVous: 4, rappels: 4, fin, minutes: h(18, 15) })).toBe(
      '4 rendez-vous et 4 personnes à rappeler.',
    )
  })
})

describe('progression', () => {
  it('compte les faites sur le total prévu', () => {
    expect(progression(4, 3)).toEqual({
      faites: 3,
      total: 7,
      part: 3 / 7,
      texte: '3 sur 7',
      suite: 'faits',
      annonce: 'Progression de la journée : 3 tâches faites sur 7 prévues.',
    })
  })

  it('accorde au singulier', () => {
    expect(progression(0, 1)).toMatchObject({
      texte: '1 sur 1',
      suite: 'fait',
      part: 1,
      annonce: 'Progression de la journée : 1 tâche faite sur 1 prévue.',
    })
    expect(progression(5, 0)).toMatchObject({
      suite: 'fait',
      annonce: 'Progression de la journée : aucune tâche faite sur 5 prévues.',
    })
  })

  it('disparaît sans rien de prévu ou sans nombre lu', () => {
    expect(progression(0, 0)).toBeNull()
    expect(progression(null, 2)).toBeNull()
    expect(progression(3, null)).toBeNull()
  })
})
