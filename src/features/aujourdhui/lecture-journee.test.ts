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
    // Sans aucun export enregistré, la seule alerte est le rappel d'exporter.
    expect(journee.alertes).toEqual({
      ok: true,
      donnees: [
        {
          cle: 'export_a_faire',
          titre: 'Sauvegarde de vos données',
          total: 1,
          alertes: [{ genre: 'export_a_faire', cle: 'export', jours: null }],
        },
      ],
    })
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

  it('ne rappelle pas d’exporter quand le dernier export est récent', async () => {
    const { client } = fauxClient({
      data: [{ dernier_export_le: '2026-11-15T09:00:00Z' }],
      error: null,
      count: 0,
    })
    const journee = await lireJournee(client, '2026-11-17')
    expect(journee.alertes.ok && journee.alertes.donnees.map((g) => g.cle)).not.toContain(
      'export_a_faire',
    )
  })

  it('rappelle d’exporter quand le dernier export a 7 jours', async () => {
    const { client } = fauxClient({
      data: [{ dernier_export_le: '2026-11-10T09:00:00Z' }],
      error: null,
      count: 0,
    })
    const journee = await lireJournee(client, '2026-11-17')
    const groupe = journee.alertes.ok
      ? journee.alertes.donnees.find((g) => g.cle === 'export_a_faire')
      : undefined
    expect(groupe?.alertes).toEqual([{ genre: 'export_a_faire', cle: 'export', jours: 7 }])
  })

  it('montre l’erreur dans chaque bloc quand la base ne répond pas', async () => {
    const { client } = fauxClient('panne')
    const journee = await lireJournee(client, '2026-11-17')
    expect(journee.agenda.ok).toBe(false)
    expect(journee.alertes.ok).toBe(false)
    expect(journee.nouveautes.ok).toBe(false)
  })
})
