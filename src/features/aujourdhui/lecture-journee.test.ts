import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { lireJournee } from './lecture-journee'
import { LIMITES } from './journee'

describe('lireJournee', () => {
  it('lit chaque bloc avec une limite, et dit qu’une journée vide est vide', async () => {
    const { client, appels } = fauxClient({ data: [], error: null, count: 0 })
    const journee = await lireJournee(client, '2026-11-17')
    expect(journee.agenda).toEqual({ ok: true, donnees: { lignes: [], total: 0 } })
    expect(journee.relances).toEqual({ ok: true, donnees: { lignes: [], total: 0 } })
    expect(journee.taches).toEqual({ ok: true, donnees: { lignes: [], total: 0 } })
    expect(journee.alertes).toEqual({ ok: true, donnees: [] })
    expect(journee.nouveautes).toEqual({ ok: true, donnees: { lignes: [], total: 0 } })
    // Aucune lecture sans borne : chaque liste demande une plage de lignes.
    const plages = appels.filter(([nom]) => nom === 'range')
    expect(plages.length).toBeGreaterThanOrEqual(7)
    for (const [, debut, fin] of plages) {
      expect(debut).toBe(0)
      expect(Number(fin)).toBeLessThan(LIMITES.agenda)
    }
    expect(appels).toContainEqual([
      'rpc',
      'projets_sans_activite',
      { p_aujourdhui: '2026-11-17', p_jours: 15, p_limite: LIMITES.projetsSansActivite },
    ])
  })

  it('montre l’erreur dans chaque bloc quand la base ne répond pas', async () => {
    const { client } = fauxClient('panne')
    const journee = await lireJournee(client, '2026-11-17')
    expect(journee.agenda.ok).toBe(false)
    expect(journee.alertes.ok).toBe(false)
    expect(journee.nouveautes.ok).toBe(false)
  })
})
