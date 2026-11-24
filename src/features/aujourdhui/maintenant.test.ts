import { describe, expect, it } from 'vitest'
import { tacheEssai } from '../taches/tache-essai'
import type { Tache, TacheAffichee } from '../taches/taches'
import {
  adresseCourte,
  aPreparer,
  bornesRendezVous,
  choisirMaintenant,
  compteursJournee,
  detailRendezVous,
  finDeJournee,
  nomDuRendezVous,
  rueSeule,
  sansAPreparer,
  DUREE_SANS_FIN,
  etatRendezVous,
  ficheDuRendezVous,
  finDuDernierRendezVous,
  LIMITE_A_PREPARER,
  placeDuTrait,
  rendezVousRestants,
  progression,
  rendezVousCiDessus,
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

describe('rendezVousRestants', () => {
  it('compte les rendez-vous en cours et à venir, pas ceux déjà passés', () => {
    expect(rendezVousRestants(AGENDA, h(8))).toBe(4)
    // 11 h 10 : celui de 9 h est fini, celui de 11 h est en cours.
    expect(rendezVousRestants(AGENDA, h(11, 10))).toBe(3)
    expect(rendezVousRestants(AGENDA, h(20))).toBe(0)
    expect(rendezVousRestants([], h(8))).toBe(0)
  })
})

describe('progression', () => {
  it('termine le résumé par « 11 à faire aujourd’hui » tant que rien n’est fait, sans anneau', () => {
    expect(progression(11, 0)).toEqual({
      faites: 0,
      total: 11,
      part: 0,
      anneau: false,
      phrase: '11 à faire aujourd’hui.',
      annonce: '11 tâches à faire aujourd’hui.',
    })
    expect(progression(1, 0)).toMatchObject({
      phrase: '1 à faire aujourd’hui.',
      annonce: '1 tâche à faire aujourd’hui.',
    })
  })

  it('montre l’anneau dès le premier geste et compte les faites sur le total prévu', () => {
    expect(progression(8, 3)).toEqual({
      faites: 3,
      total: 11,
      part: 3 / 11,
      anneau: true,
      phrase: '3 sur 11 faits.',
      annonce: 'Progression de la journée : 3 tâches faites sur 11 prévues.',
    })
  })

  it('accorde au singulier', () => {
    expect(progression(4, 1)).toMatchObject({
      phrase: '1 sur 5 fait.',
      annonce: 'Progression de la journée : 1 tâche faite sur 5 prévues.',
    })
  })

  it('dit quand tout est fait', () => {
    expect(progression(0, 7)).toMatchObject({ part: 1, phrase: 'Tout est fait : 7 sur 7.' })
    expect(progression(0, 1)).toMatchObject({
      phrase: 'Tout est fait : 1 sur 1.',
      annonce: 'Progression de la journée : 1 tâche faite sur 1 prévue.',
    })
  })

  it('disparaît sans rien de prévu ou sans nombre lu', () => {
    expect(progression(0, 0)).toBeNull()
    expect(progression(null, 2)).toBeNull()
    expect(progression(3, null)).toBeNull()
  })
})

describe('agenda en frise', () => {
  it('marque « Ci-dessus » le rendez-vous de la carte « Maintenant », et lui seul', () => {
    const choix = choisirMaintenant(AGENDA, [], h(10, 20))
    expect(rendezVousCiDessus(choix)).toBe('rdv-11')
    // Après le dernier rendez-vous, la carte montre une relance : aucune marque.
    expect(rendezVousCiDessus(choisirMaintenant(AGENDA, ['relance'], h(20)))).toBeNull()
    expect(rendezVousCiDessus(null)).toBeNull()
  })

  it('ouvre la fiche du bien, sinon celle du contact, sinon rien', () => {
    expect(ficheDuRendezVous({ contact: { id: 'c1' }, bien: { id: 'b1' } })).toBe('/biens/b1')
    expect(ficheDuRendezVous({ contact: { id: 'c1' }, bien: null })).toBe('/contacts/c1')
    expect(ficheDuRendezVous({ contact: null, bien: null })).toBeNull()
  })

  it('dit la durée puis le lieu, ou à défaut le contact', () => {
    expect(detailRendezVous(90, '12 rue des Essais, Lyon', 'Camille Fictif')).toBe(
      '1 h 30 · 12 rue des Essais, Lyon',
    )
    expect(detailRendezVous(45, null, 'Camille Fictif')).toBe('45 min · Camille Fictif')
    expect(detailRendezVous(null, '12 rue des Essais, Lyon', null)).toBe('12 rue des Essais, Lyon')
    expect(detailRendezVous(null, null, null)).toBe('')
  })
})

describe('adresse courte de l’agenda (étape F.2)', () => {
  it('garde la rue seule, sans code postal ni commune', () => {
    expect(rueSeule('12 rue des Essais, 69003 Lyon')).toBe('12 rue des Essais')
    expect(rueSeule('12 rue des Essais 69003 Lyon')).toBe('12 rue des Essais')
    expect(rueSeule('  3  place de l’Exemple ')).toBe('3 place de l’Exemple')
    expect(rueSeule('Étude de Maître Exemple, Villefictive')).toBe('Étude de Maître Exemple')
  })

  it('rend telle quelle une adresse sans rue reconnaissable', () => {
    expect(rueSeule('69003 Lyon')).toBe('69003 Lyon')
    expect(rueSeule('')).toBe('')
  })

  it('prend le lieu, sinon le bien, sinon le contact', () => {
    const bien = { adresse: '5 allée des Tests' }
    const contact = { adresse: '8 rue du Faux' }
    expect(adresseCourte({ lieu: 'Café de la Gare, 00000 Villefictive' }, bien, contact)).toBe(
      'Café de la Gare',
    )
    expect(adresseCourte({ lieu: ' ' }, bien, contact)).toBe('5 allée des Tests')
    expect(adresseCourte({ lieu: '' }, { adresse: '' }, contact)).toBe('8 rue du Faux')
    expect(adresseCourte({ lieu: '' }, null, null)).toBeNull()
  })
})

describe('« Autres tâches » sans ce qui est « À préparer » (règle 12)', () => {
  it('écarte les tâches montrées dans la carte, dans l’ordre reçu', () => {
    const a = affichee('a')
    const b = affichee('b')
    const c = affichee('c')
    expect(sansAPreparer([a, b, c], [b])).toEqual([a, c])
    expect(sansAPreparer([a, b], [])).toEqual([a, b])
  })

  it('désigne le rendez-vous préparé en quelques mots', () => {
    expect(nomDuRendezVous({ categorie: 'estimation', heure: '11:00:00' })).toBe(
      'l’estimation de 11 h',
    )
    expect(nomDuRendezVous({ categorie: 'visite', heure: '14:30:00' })).toBe('la visite de 14 h 30')
    expect(nomDuRendezVous({ categorie: 'rendez_vous', heure: '09:00:00' })).toBe(
      'le rendez-vous de 9 h',
    )
    expect(nomDuRendezVous({ categorie: 'autre', heure: null })).toBe('le rendez-vous')
  })
})

describe('compteurs de l’en-tête (étape F.2)', () => {
  it('donne un compteur par bloc, avec le singulier et le pluriel', () => {
    const compteurs = compteursJournee({
      rendezVous: 3,
      rappels: 4,
      rappelsEnRetard: true,
      taches: 1,
      tachesEnRetard: false,
    })
    expect(compteurs.map((c) => `${c.nombre} ${c.libelle}`)).toEqual([
      '3 rendez-vous',
      '4 à rappeler',
      '1 tâche',
    ])
    expect(compteurs.map((c) => c.bloc)).toEqual(['agenda', 'relances', 'taches'])
    expect(compteurs.map((c) => c.alerte)).toEqual([false, true, false])
  })

  it('n’affiche pas un compteur à zéro', () => {
    const compteurs = compteursJournee({
      rendezVous: 0,
      rappels: 1,
      rappelsEnRetard: false,
      taches: 2,
      tachesEnRetard: true,
    })
    expect(compteurs.map((c) => `${c.nombre} ${c.libelle}`)).toEqual(['1 à rappeler', '2 tâches'])
    expect(compteurs[1]?.alerte).toBe(true)
    expect(
      compteursJournee({
        rendezVous: 0,
        rappels: 0,
        rappelsEnRetard: false,
        taches: 0,
        tachesEnRetard: false,
      }),
    ).toEqual([])
  })

  it('dit la fin de journée en une ligne courte, tant qu’elle est à venir', () => {
    const fin = { heure: '17:30', minutes: h(17, 30), avecDuree: true }
    expect(finDeJournee(fin, 3, h(10, 20))).toBe('Fin du dernier rendez-vous vers 17 h 30.')
    expect(finDeJournee(fin, 1, h(10, 20))).toBe('Fin du rendez-vous vers 17 h 30.')
    expect(finDeJournee({ ...fin, avecDuree: false }, 2, h(10))).toBe(
      'Dernier rendez-vous à 17 h 30.',
    )
    expect(finDeJournee(fin, 3, h(17, 30))).toBeNull()
    expect(finDeJournee(null, 0, h(10))).toBeNull()
  })
})
