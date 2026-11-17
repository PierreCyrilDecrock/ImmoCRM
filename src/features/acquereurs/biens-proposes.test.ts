import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { bienEssai } from '../biens/bien-essai'
import {
  libelleReaction,
  planifierVisite,
  preparerReaction,
  preparerVisite,
  proposerBien,
  titreVisite,
} from './biens-proposes'

const AUJOURDHUI = '2026-11-17'

describe('preparerReaction', () => {
  it('ne garde la raison que pour un refus', () => {
    expect(preparerReaction('refuse', ' Trop de travaux ')).toEqual({
      ok: true,
      valeurs: { reaction: 'refuse', raison_refus: 'Trop de travaux' },
    })
    expect(preparerReaction('interesse', 'reste de saisie')).toEqual({
      ok: true,
      valeurs: { reaction: 'interesse', raison_refus: '' },
    })
    expect(preparerReaction('refuse', 'x'.repeat(501)).ok).toBe(false)
  })

  it('nomme l’absence de réponse', () => {
    expect(libelleReaction(null)).toBe('Sans réponse')
    expect(libelleReaction('a_visiter')).toBe('À visiter')
  })
})

describe('preparerVisite', () => {
  const bien = bienEssai({
    id: 'b1',
    adresse: '3 impasse Fictive',
    code_postal: '00000',
    ville: 'Villefictive',
  })
  const brouillon = { bien, date: '2026-11-19', heure: '14:30', duree: '45', motif: ' Clés ' }

  it('prépare le rendez-vous à l’adresse du bien', () => {
    expect(preparerVisite(brouillon, { projetId: 'a1', aujourdhui: AUJOURDHUI })).toEqual({
      ok: true,
      parametres: {
        p_projet: 'a1',
        p_bien: 'b1',
        p_echeance: '2026-11-19',
        p_heure: '14:30',
        p_duree: 45,
        p_lieu: '3 impasse Fictive, 00000 Villefictive',
        p_titre: 'Visite : 3 impasse Fictive',
        p_motif: 'Clés',
      },
    })
  })

  it('demande le bien, un jour à venir et une heure', () => {
    const preparation = preparerVisite(
      { bien: null, date: '2026-11-10', heure: '', duree: '', motif: '' },
      { projetId: 'a1', aujourdhui: AUJOURDHUI },
    )
    expect(preparation.ok === false && Object.keys(preparation.erreurs).sort()).toEqual([
      'bien',
      'date',
      'heure',
    ])
  })

  it('titre le rendez-vous par l’adresse', () => {
    expect(titreVisite({ adresse: '1 rue de l’Exemple' })).toBe('Visite : 1 rue de l’Exemple')
  })
})

describe('accès à la base', () => {
  it('explique un bien déjà proposé', async () => {
    const { client } = fauxClient({ data: null, error: { code: '23505' }, status: 409 })
    const resultat = await proposerBien(client, 'a1', 'b1')
    expect(resultat.ok === false && resultat.erreur.message).toBe(
      'Ce bien est déjà dans la sélection de ce projet.',
    )
  })

  it('planifie la visite par la fonction de la base', async () => {
    const { client, appels } = fauxClient({
      data: [{ id: 't1', echeance: '2026-11-19' }],
      error: null,
    })
    const resultat = await planifierVisite(client, {
      p_projet: 'a1',
      p_bien: 'b1',
      p_echeance: '2026-11-19',
      p_heure: '14:30',
      p_lieu: '',
      p_titre: 'Visite',
      p_motif: '',
    })
    expect(resultat.ok).toBe(true)
    expect(appels[0]?.[0]).toBe('rpc')
    expect(appels[0]?.[1]).toBe('planifier_visite')
  })
})
