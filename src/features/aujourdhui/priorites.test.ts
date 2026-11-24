import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  bilanPriorites,
  changerPriorite,
  enregistrerPriorites,
  LONGUEUR_MAX_PRIORITE,
  formeTroisActions,
  lirePriorites,
  PRIORITES_VIDES,
  prioritesDepuis,
  valeursPriorites,
  type Priorites,
} from './priorites'

const LIGNE = {
  action_1: 'Rappeler Camille Fictif',
  action_2: '',
  action_3: 'Estimation rue de l’Exemple',
  faite_1: true,
  faite_2: false,
  faite_3: false,
}

describe('trois actions qui comptent', () => {
  it('lit les trois actions d’une ligne, ou trois actions vides', () => {
    expect(prioritesDepuis(LIGNE)).toEqual([
      { texte: 'Rappeler Camille Fictif', faite: true },
      { texte: '', faite: false },
      { texte: 'Estimation rue de l’Exemple', faite: false },
    ])
    expect(prioritesDepuis(null)).toEqual(PRIORITES_VIDES)
  })

  it('nettoie avant d’enregistrer : espaces, longueur, case d’une action vide', () => {
    const priorites: Priorites = [
      { texte: '  Appeler le notaire  ', faite: false },
      { texte: '   ', faite: true },
      { texte: 'x'.repeat(250), faite: true },
    ]
    expect(valeursPriorites('2026-11-17', priorites)).toEqual({
      jour: '2026-11-17',
      action_1: 'Appeler le notaire',
      action_2: '',
      action_3: 'x'.repeat(LONGUEUR_MAX_PRIORITE),
      faite_1: false,
      faite_2: false,
      faite_3: true,
    })
  })

  it('change une action sans toucher aux autres', () => {
    const suivantes = changerPriorite(prioritesDepuis(LIGNE), 1, { texte: 'Publier l’annonce' })
    expect(suivantes[1]).toEqual({ texte: 'Publier l’annonce', faite: false })
    expect(suivantes[0]).toEqual({ texte: 'Rappeler Camille Fictif', faite: true })
  })

  it('fait le bilan des seules actions choisies', () => {
    expect(bilanPriorites(prioritesDepuis(LIGNE))).toEqual({ choisies: 2, faites: 1 })
    expect(bilanPriorites(PRIORITES_VIDES)).toEqual({ choisies: 0, faites: 0 })
  })

  it('lit la ligne la plus récente jusqu’au jour demandé', async () => {
    const { client, appels } = fauxClient({ data: [{ ...LIGNE, jour: '2026-11-17' }], error: null })
    const resultat = await lirePriorites(client, '2026-11-17')
    expect(appels).toContainEqual(['from', 'priorites_du_jour'])
    expect(appels).toContainEqual(['lte', 'jour', '2026-11-17'])
    expect(resultat.ok && resultat.donnees.priorites[0].texte).toBe('Rappeler Camille Fictif')
    expect(resultat.ok && resultat.donnees.dejaUtilisees).toBe(true)
  })

  it('d’un jour précédent, ne garde que le fait que l’outil a servi', async () => {
    const { client } = fauxClient({ data: [{ ...LIGNE, jour: '2026-11-16' }], error: null })
    const resultat = await lirePriorites(client, '2026-11-17')
    expect(resultat.ok && resultat.donnees).toEqual({
      priorites: PRIORITES_VIDES,
      dejaUtilisees: true,
    })
  })

  it('sans aucune ligne, l’outil n’a jamais servi', async () => {
    const { client } = fauxClient({ data: [], error: null })
    const resultat = await lirePriorites(client, '2026-11-17')
    expect(resultat.ok && resultat.donnees.dejaUtilisees).toBe(false)
  })

  it('tient en une ligne tant qu’aucune action n’a jamais été écrite (étape F.2)', () => {
    const base = { erreur: false, choisies: 0, dejaUtilisees: false, deplie: false }
    expect(formeTroisActions(base)).toBe('ligne')
    expect(formeTroisActions({ ...base, deplie: true })).toBe('complete')
    expect(formeTroisActions({ ...base, choisies: 1 })).toBe('complete')
    // Les jours suivants aussi.
    expect(formeTroisActions({ ...base, dejaUtilisees: true })).toBe('complete')
    expect(formeTroisActions({ ...base, erreur: true })).toBe('complete')
  })

  it('enregistre une ligne par jour', async () => {
    const { client, appels } = fauxClient({ data: LIGNE, error: null })
    await enregistrerPriorites(client, '2026-11-17', prioritesDepuis(LIGNE))
    expect(appels).toContainEqual([
      'upsert',
      { jour: '2026-11-17', ...LIGNE },
      { onConflict: 'user_id,jour' },
    ])
  })
})
