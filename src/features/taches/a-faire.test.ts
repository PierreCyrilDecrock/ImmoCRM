import { describe, expect, it } from 'vitest'
import { compteurAFaire, ordreAFaire, rubriquesAFaire } from './a-faire'
import { tacheEssai } from './tache-essai'

// Mardi 24 novembre 2026.
const AUJOURDHUI = '2026-11-24'

/** Une ligne de liste réduite à sa tâche, repérée par son titre. */
function ligne(titre: string, echeance: string, heure: string | null = null, priorite = 2) {
  return { id: titre, tache: tacheEssai({ titre, echeance, heure, priorite }) }
}

const titres = (lignes: readonly { tache: { titre: string } }[]) =>
  lignes.map(({ tache }) => tache.titre)

describe('ordreAFaire', () => {
  it('range la plus ancienne échéance d’abord', () => {
    const a = tacheEssai({ echeance: '2026-11-18' })
    const b = tacheEssai({ echeance: '2026-11-23' })
    expect(ordreAFaire(a, b)).toBeLessThan(0)
    expect(ordreAFaire(b, a)).toBeGreaterThan(0)
  })

  it('le même jour, les heures dans l’ordre, puis les tâches sans heure', () => {
    const neuf = tacheEssai({ echeance: AUJOURDHUI, heure: '09:00:00' })
    const quatorze = tacheEssai({ echeance: AUJOURDHUI, heure: '14:30:00' })
    const sansHeure = tacheEssai({ echeance: AUJOURDHUI, heure: null, priorite: 1 })
    expect(ordreAFaire(neuf, quatorze)).toBeLessThan(0)
    expect(ordreAFaire(sansHeure, quatorze)).toBeGreaterThan(0)
    expect(ordreAFaire(quatorze, sansHeure)).toBeLessThan(0)
  })

  it('enfin, la priorité haute d’abord', () => {
    const haute = tacheEssai({ echeance: AUJOURDHUI, priorite: 1 })
    const basse = tacheEssai({ echeance: AUJOURDHUI, priorite: 3 })
    expect(ordreAFaire(haute, basse)).toBeLessThan(0)
    expect(ordreAFaire(haute, haute)).toBe(0)
  })
})

describe('rubriquesAFaire', () => {
  const taches = [
    ligne('Commander les panneaux', AUJOURDHUI),
    ligne('Visite à 14 h 30', AUJOURDHUI, '14:30:00'),
    ligne('Rappeler le notaire', '2026-11-23'),
    ligne('Estimation à 9 h', AUJOURDHUI, '09:00:00'),
    ligne('Envoyer l’avis de valeur', '2026-11-18'),
    ligne('Relancer Camille', '2026-11-20'),
  ]

  it('met les retards en tête, la plus ancienne d’abord, puis la journée', () => {
    const rubriques = rubriquesAFaire(taches, AUJOURDHUI)
    expect(rubriques.map(({ cle, titre, nombre }) => ({ cle, titre, nombre }))).toEqual([
      { cle: 'en_retard', titre: 'En retard', nombre: 3 },
      { cle: 'aujourdhui', titre: "Aujourd'hui", nombre: 3 },
    ])
    expect(titres(rubriques[0]?.taches ?? [])).toEqual([
      'Envoyer l’avis de valeur',
      'Relancer Camille',
      'Rappeler le notaire',
    ])
  })

  it('aujourd’hui : les rendez-vous dans l’ordre des heures, puis les tâches sans heure', () => {
    const [, aujourdhui] = rubriquesAFaire(taches, AUJOURDHUI)
    expect(titres(aujourdhui?.taches ?? [])).toEqual([
      'Estimation à 9 h',
      'Visite à 14 h 30',
      'Commander les panneaux',
    ])
  })

  it('n’affiche pas une rubrique vide', () => {
    const sansRetard = rubriquesAFaire([ligne('Visite', AUJOURDHUI, '10:00:00')], AUJOURDHUI)
    expect(sansRetard.map(({ cle }) => cle)).toEqual(['aujourdhui'])
    const sansJournee = rubriquesAFaire([ligne('Rappeler', '2026-11-23')], AUJOURDHUI)
    expect(sansJournee.map(({ cle }) => cle)).toEqual(['en_retard'])
  })

  it('ne rend aucune rubrique quand tout est vide : la page montre son état vide', () => {
    expect(rubriquesAFaire([], AUJOURDHUI)).toEqual([])
  })

  it('ignore une tâche à venir (reportée à demain, elle quitte « À faire »)', () => {
    const rubriques = rubriquesAFaire(
      [ligne('Rappeler', '2026-11-23'), ligne('Reportée', '2026-11-25')],
      AUJOURDHUI,
    )
    expect(rubriques.flatMap(({ taches: lignes }) => titres(lignes))).toEqual(['Rappeler'])
  })

  it('prend le nombre de la base quand la liste n’est pas lue en entier', () => {
    const rubriques = rubriquesAFaire(taches, AUJOURDHUI, { en_retard: 62, aujourdhui: null })
    expect(rubriques.map(({ nombre }) => nombre)).toEqual([62, 3])
  })

  it('ne descend jamais sous le nombre de lignes affichées', () => {
    const rubriques = rubriquesAFaire(taches, AUJOURDHUI, { en_retard: 1, aujourdhui: 0 })
    expect(rubriques.map(({ nombre }) => nombre)).toEqual([3, 3])
  })
})

describe('compteurAFaire', () => {
  it('additionne les retards et les tâches du jour', () => {
    expect(compteurAFaire({ en_retard: 3, aujourdhui: 5, semaine: 4 })).toBe(8)
    expect(compteurAFaire({ en_retard: 0, aujourdhui: 0 })).toBe(0)
  })

  it('reste inconnu tant qu’un des deux nombres manque', () => {
    expect(compteurAFaire({})).toBeNull()
    expect(compteurAFaire({ en_retard: 3, aujourdhui: null })).toBeNull()
    expect(compteurAFaire({ aujourdhui: 5 })).toBeNull()
  })
})
