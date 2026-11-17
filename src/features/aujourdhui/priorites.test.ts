import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  bilanPriorites,
  changerPriorite,
  enregistrerPriorites,
  LONGUEUR_MAX_PRIORITE,
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

  it('lit la ligne du jour demandé', async () => {
    const { client, appels } = fauxClient({ data: [LIGNE], error: null })
    const resultat = await lirePriorites(client, '2026-11-17')
    expect(appels).toContainEqual(['from', 'priorites_du_jour'])
    expect(appels).toContainEqual(['eq', 'jour', '2026-11-17'])
    expect(resultat.ok && resultat.donnees[0].texte).toBe('Rappeler Camille Fictif')
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
