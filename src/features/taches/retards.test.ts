import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { compterTachesEnRetard, pastilleRetard, pastilleRetards } from './retards'

describe('pastilleRetards', () => {
  it('n’affiche rien sans retard, ou tant que le nombre est inconnu', () => {
    expect(pastilleRetards(0)).toBeNull()
    expect(pastilleRetards(null)).toBeNull()
  })

  it('affiche le nombre et l’annonce aux lecteurs d’écran', () => {
    expect(pastilleRetards(3)).toEqual({ texte: '3', annonce: '3 en retard' })
    expect(pastilleRetards(9)).toEqual({ texte: '9', annonce: '9 en retard' })
  })

  it('affiche « 9+ » au-delà de neuf, mais annonce le nombre exact', () => {
    expect(pastilleRetards(10)).toEqual({ texte: '9+', annonce: '10 en retard' })
    expect(pastilleRetards(250)).toEqual({ texte: '9+', annonce: '250 en retard' })
  })
})

describe('compterTachesEnRetard', () => {
  it('compte, sans lire de ligne, les tâches à faire d’avant aujourd’hui', async () => {
    const { client, appels } = fauxClient({ data: null, error: null, count: 4 })
    const resultat = await compterTachesEnRetard(client, '2026-11-21')
    expect(resultat).toEqual({ ok: true, donnees: 4 })
    expect(appels).toEqual([
      ['from', 'taches'],
      ['select', 'id', { count: 'exact', head: true }],
      ['is', 'archived_at', null],
      ['eq', 'etat', 'a_faire'],
      ['lte', 'echeance', '2026-11-20'],
    ])
  })

  it('renvoie une erreur en français si le réseau tombe', async () => {
    const { client } = fauxClient('panne')
    const resultat = await compterTachesEnRetard(client, '2026-11-21')
    expect(resultat.ok === false && resultat.erreur.genre).toBe('reseau')
  })
})

describe('pastilleRetard', () => {
  const AUJOURDHUI = '2026-11-17'

  it('met le retard en pastille courte, rien pour une échéance du jour ou à venir', () => {
    expect(pastilleRetard(AUJOURDHUI, AUJOURDHUI)).toBeNull()
    expect(pastilleRetard('2026-11-20', AUJOURDHUI)).toBeNull()
    expect(pastilleRetard('2026-11-16', AUJOURDHUI)).toEqual({
      jours: 1,
      texte: '1 j',
      annonce: "En retard d'un jour",
    })
    expect(pastilleRetard('2026-11-15', AUJOURDHUI)).toEqual({
      jours: 2,
      texte: '2 j',
      annonce: 'En retard de 2 jours',
    })
  })
})
