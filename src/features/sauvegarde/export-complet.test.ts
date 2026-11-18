import { describe, expect, it } from 'vitest'
import type { Resultat } from '../../lib/donnees'
import { TABLES } from '../../lib/donnees'
import { fauxClient } from '../../lib/faux-client'
import {
  assemblerExport,
  FORMAT_EXPORT,
  LIBELLES_TABLES,
  lireToutesLesDonnees,
  lireToutesLesPages,
  nombreDeLignes,
  nomFichierExport,
  tablesExportees,
  VERSION_FORMAT_EXPORT,
} from './export-complet'

/** Une table fictive de `total` lignes, lue page par page. */
function tableFictive(total: number) {
  const lignes = Array.from({ length: total }, (_, rang) => ({ id: `ligne-${rang}` }))
  const demandes: [number, number][] = []
  const lirePage = (debut: number, taille: number): Promise<Resultat<unknown[]>> => {
    demandes.push([debut, taille])
    return Promise.resolve({ ok: true, donnees: lignes.slice(debut, debut + taille) })
  }
  return { lirePage, demandes }
}

describe('lireToutesLesPages', () => {
  it('lit toutes les lignes, page après page, jusqu’à une page incomplète', async () => {
    const { lirePage, demandes } = tableFictive(2500)
    const resultat = await lireToutesLesPages(lirePage, 1000)
    expect(resultat.ok && resultat.donnees.length).toBe(2500)
    expect(demandes).toEqual([
      [0, 1000],
      [1000, 1000],
      [2000, 1000],
    ])
  })

  it('demande une page de plus quand le total tombe juste', async () => {
    const { lirePage, demandes } = tableFictive(2000)
    const resultat = await lireToutesLesPages(lirePage, 1000)
    expect(resultat.ok && resultat.donnees.length).toBe(2000)
    expect(demandes).toHaveLength(3)
  })

  it('lit une table vide en une seule demande', async () => {
    const { lirePage, demandes } = tableFictive(0)
    expect(await lireToutesLesPages(lirePage, 1000)).toEqual({ ok: true, donnees: [] })
    expect(demandes).toHaveLength(1)
  })

  it('signale l’avancement après chaque page', async () => {
    const { lirePage } = tableFictive(1500)
    const etapes: number[] = []
    await lireToutesLesPages(lirePage, 1000, (lues) => etapes.push(lues))
    expect(etapes).toEqual([1000, 1500])
  })

  it('s’arrête à la première erreur', async () => {
    let appels = 0
    const resultat = await lireToutesLesPages(() => {
      appels += 1
      return Promise.resolve({
        ok: false,
        erreur: { genre: 'reseau', message: 'Connexion perdue.' },
      } as Resultat<unknown[]>)
    }, 1000)
    expect(resultat.ok).toBe(false)
    expect(appels).toBe(1)
  })
})

describe('tablesExportees', () => {
  it('comprend toutes les tables de l’application, chacune avec un libellé', () => {
    const tables = tablesExportees()
    expect(tables).toHaveLength(Object.keys(TABLES).length)
    for (const essentielle of ['contacts', 'biens', 'projets_vendeurs', 'taches', 'activites']) {
      expect(tables).toContain(essentielle)
    }
    for (const table of tables) expect(LIBELLES_TABLES[table]).not.toBe('')
  })
})

describe('lireToutesLesDonnees', () => {
  it('lit chaque table, archives comprises, triée par identifiant et par lots bornés', async () => {
    const { client, appels } = fauxClient({ data: [{ id: 'a' }], error: null })
    const resultat = await lireToutesLesDonnees(client)
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(Object.keys(resultat.donnees).sort()).toEqual(tablesExportees())
    expect(resultat.donnees.contacts).toEqual([{ id: 'a' }])
    // Archives comprises : aucun filtre sur archived_at.
    expect(appels.some(([nom, colonne]) => nom === 'is' && colonne === 'archived_at')).toBe(false)
    expect(appels).toContainEqual(['order', 'id', { ascending: true }])
    expect(appels).toContainEqual(['range', 0, 999])
  })

  it('n’assemble rien si une lecture échoue', async () => {
    const { client } = fauxClient('panne')
    const resultat = await lireToutesLesDonnees(client)
    expect(resultat.ok).toBe(false)
  })
})

describe('assemblerExport', () => {
  it('range les tables par ordre alphabétique avec leur nombre de lignes', () => {
    const fichier = assemblerExport(
      { taches: [{ id: 't1' }], contacts: [{ id: 'c1' }, { id: 'c2' }] },
      { maintenant: new Date('2026-11-18T09:30:00Z'), version: '1.13.0', projet: 'test' },
    )
    expect(fichier.format).toBe(FORMAT_EXPORT)
    expect(fichier.version_format).toBe(VERSION_FORMAT_EXPORT)
    expect(fichier.application).toEqual({ nom: 'ImmoCRM', version: '1.13.0' })
    expect(fichier.projet).toBe('test')
    expect(fichier.exporte_le).toBe('2026-11-18T09:30:00.000Z')
    expect(Object.keys(fichier.tables)).toEqual(['contacts', 'taches'])
    expect(fichier.tables.contacts).toEqual({ nombre: 2, lignes: [{ id: 'c1' }, { id: 'c2' }] })
    expect(nombreDeLignes(fichier)).toBe(3)
    expect(fichier.remarques.some((remarque) => remarque.includes('photos'))).toBe(true)
  })

  it('produit un fichier JSON relu à l’identique', () => {
    const fichier = assemblerExport(
      { contacts: [{ id: 'c1', nom: 'Fictif', etiquettes: ['vendeur'] }] },
      { maintenant: new Date('2026-11-18T09:30:00Z'), version: '1.13.0', projet: 'reel' },
    )
    expect(JSON.parse(JSON.stringify(fichier))).toEqual(fichier)
  })
})

describe('nomFichierExport', () => {
  it('date le fichier et distingue le projet de test', () => {
    expect(nomFichierExport('2026-11-18', 'reel')).toBe('immocrm-export-2026-11-18.json')
    expect(nomFichierExport('2026-11-18', 'test')).toBe('immocrm-test-export-2026-11-18.json')
    expect(nomFichierExport('2026-11-18', null)).toBe('immocrm-export-2026-11-18.json')
  })
})
