import { describe, expect, it } from 'vitest'
import { contactEssai } from './contact-essai'
import {
  aVerifierJamaisContacte,
  depuisQuandCourt,
  detailLigneContact,
  detailSansAction,
  repereContact,
  rolesDuContact,
  teinteRole,
} from './ligne-contact'

const AUJOURDHUI = '2026-11-24'

describe('rôle et teinte', () => {
  it('dit les rôles, ou « Prospect » sans rôle', () => {
    expect(rolesDuContact({ roles: ['vendeur'] })).toBe('Vendeur')
    expect(rolesDuContact({ roles: ['vendeur', 'acquereur'] })).toBe('Vendeur · Acquéreur')
    expect(rolesDuContact({ roles: [] })).toBe('Prospect')
  })

  it('colore les initiales selon le rôle : vendeur, acquéreur, sinon gris', () => {
    expect(teinteRole({ roles: ['vendeur'] })).toBe('vendeur')
    expect(teinteRole({ roles: ['acquereur'] })).toBe('acquereur')
    expect(teinteRole({ roles: ['acquereur', 'vendeur'] })).toBe('vendeur')
    expect(teinteRole({ roles: [] })).toBe('prospect')
    expect(teinteRole({ roles: ['notaire'] })).toBe('prospect')
    expect(teinteRole(null)).toBe('prospect')
  })
})

describe('dernier échange', () => {
  it('dit depuis quand, en court', () => {
    expect(depuisQuandCourt(0)).toBe("aujourd'hui")
    expect(depuisQuandCourt(1)).toBe('hier')
    expect(depuisQuandCourt(7)).toBe('il y a 7 j')
    expect(depuisQuandCourt(59)).toBe('il y a 59 j')
    expect(depuisQuandCourt(95)).toBe('il y a 3 mois')
    expect(depuisQuandCourt(400)).toBe("il y a plus d'un an")
  })

  it('ne vérifie le journal que si la date ne dépasse pas celle de la collecte', () => {
    const neuve = contactEssai({ collecte_date: '2026-11-20', dernier_contact_le: '2026-11-20' })
    expect(aVerifierJamaisContacte(neuve)).toBe(true)
    const jointe = contactEssai({ collecte_date: '2026-11-01', dernier_contact_le: '2026-11-17' })
    expect(aVerifierJamaisContacte(jointe)).toBe(false)
  })

  it('écrit le rôle puis le dernier échange', () => {
    const fiche = contactEssai({
      roles: ['vendeur'],
      collecte_date: '2026-10-01',
      dernier_contact_le: '2026-11-17',
    })
    expect(detailLigneContact(fiche, AUJOURDHUI, undefined)).toBe(
      'Vendeur · dernier échange il y a 7 j',
    )
  })

  it('dit « Jamais contacté » seulement quand le journal le confirme', () => {
    const fiche = contactEssai({ collecte_date: '2026-11-20', dernier_contact_le: '2026-11-20' })
    expect(detailLigneContact(fiche, AUJOURDHUI, true)).toBe('Prospect · Jamais contacté')
    // Joint le jour même de sa création : la date de la fiche est la bonne.
    expect(detailLigneContact(fiche, AUJOURDHUI, false)).toBe(
      'Prospect · dernier échange il y a 4 j',
    )
    // Pas encore de réponse (ou lecture en échec) : on ne dit rien plutôt que de dire faux.
    expect(detailLigneContact(fiche, AUJOURDHUI, undefined)).toBe('Prospect')
  })
})

describe('vue « Sans prochaine action »', () => {
  it('rappelle la confirmation, sinon le dernier échange', () => {
    const base = {
      roles: ['acquereur'],
      collecte_date: '2026-10-01',
      dernier_contact_le: '2026-11-23',
    }
    expect(
      detailSansAction(
        contactEssai({ ...base, sans_prochaine_action_le: '2026-11-12' }),
        AUJOURDHUI,
        undefined,
      ),
    ).toBe('Acquéreur · Confirmé le jeu. 12 nov.')
    expect(detailSansAction(contactEssai(base), AUJOURDHUI, undefined)).toBe(
      'Acquéreur · dernier échange hier',
    )
  })
})

describe('repère à droite', () => {
  it('montre le retard de la prochaine action en premier', () => {
    const fiche = contactEssai({ prochaine_action_le: '2026-11-21', temperature: 'chaud' })
    expect(repereContact(fiche, AUJOURDHUI)).toEqual({
      genre: 'retard',
      texte: '3 j',
      annonce: 'En retard de 3 jours',
    })
  })

  it('sinon la température', () => {
    const aJour = contactEssai({ prochaine_action_le: AUJOURDHUI, temperature: 'tiede' })
    expect(repereContact(aJour, AUJOURDHUI)).toEqual({
      genre: 'temperature',
      temperature: 'tiede',
      texte: 'Tiède',
    })
    const sansAction = contactEssai({ prochaine_action_le: null, temperature: 'veille' })
    expect(repereContact(sansAction, AUJOURDHUI)).toMatchObject({ texte: 'Veille' })
  })

  it('sinon rien', () => {
    expect(repereContact(contactEssai(), AUJOURDHUI)).toBeNull()
    expect(repereContact(contactEssai({ temperature: 'inconnue' }), AUJOURDHUI)).toBeNull()
  })
})
