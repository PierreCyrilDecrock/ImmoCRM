import { describe, expect, it } from 'vitest'
import { contactEssai } from './contact-essai'
import {
  aVerifierJamaisContacte,
  depuisQuandCourt,
  detailLigneContact,
  detailSansAction,
  ligneGriseContact,
  repereContact,
  retardEnMots,
  retardRelance,
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

describe('retard dans la ligne grise', () => {
  it('écrit le retard en mots courts', () => {
    expect(retardEnMots(1)).toEqual({ texte: '1 j', annonce: 'un jour' })
    expect(retardEnMots(3)).toEqual({ texte: '3 j', annonce: '3 jours' })
    expect(retardEnMots(59)).toEqual({ texte: '59 j', annonce: '59 jours' })
    expect(retardEnMots(75)).toEqual({ texte: '2 mois', annonce: '2 mois' })
    expect(retardEnMots(400)).toEqual({ texte: "plus d'un an", annonce: "plus d'un an" })
  })

  it('dit « relance en retard de 3 j », seulement pour une échéance passée', () => {
    expect(retardRelance('2026-11-21', AUJOURDHUI)).toEqual({
      texte: 'relance en retard de 3 j',
      annonce: 'relance en retard de 3 jours',
    })
    expect(retardRelance('2026-11-23', AUJOURDHUI)).toEqual({
      texte: 'relance en retard de 1 j',
      annonce: "relance en retard d'un jour",
    })
    expect(retardRelance(AUJOURDHUI, AUJOURDHUI)).toBeNull()
    expect(retardRelance('2026-11-30', AUJOURDHUI)).toBeNull()
    expect(retardRelance(null, AUJOURDHUI)).toBeNull()
  })

  it('remplace le dernier échange par le retard', () => {
    const fiche = contactEssai({
      roles: ['acquereur'],
      collecte_date: '2026-10-01',
      dernier_contact_le: '2026-11-17',
      prochaine_action_le: '2026-11-21',
    })
    expect(ligneGriseContact(fiche, AUJOURDHUI, undefined)).toEqual({
      debut: 'Acquéreur',
      retard: { texte: 'relance en retard de 3 j', annonce: 'relance en retard de 3 jours' },
    })
  })

  it('ne change rien sans retard', () => {
    const fiche = contactEssai({
      roles: ['vendeur'],
      collecte_date: '2026-10-01',
      dernier_contact_le: '2026-11-17',
      prochaine_action_le: AUJOURDHUI,
    })
    expect(ligneGriseContact(fiche, AUJOURDHUI, undefined)).toEqual({
      debut: 'Vendeur · dernier échange il y a 7 j',
      retard: null,
    })
    const confirmee = contactEssai({
      roles: ['vendeur'],
      prochaine_action_le: null,
      sans_prochaine_action_le: '2026-11-12',
    })
    expect(ligneGriseContact(confirmee, AUJOURDHUI, undefined, true).debut).toBe(
      'Vendeur · Confirmé le jeu. 12 nov.',
    )
  })
})

describe('repère à droite', () => {
  it('montre toujours la température, même en retard', () => {
    const fiche = contactEssai({ prochaine_action_le: '2026-11-21', temperature: 'chaud' })
    expect(repereContact(fiche)).toEqual({ temperature: 'chaud', texte: 'Chaud' })
    const sansAction = contactEssai({ prochaine_action_le: null, temperature: 'veille' })
    expect(repereContact(sansAction)).toMatchObject({ texte: 'Veille' })
  })

  it('ne montre rien sans température', () => {
    expect(repereContact(contactEssai({ temperature: null }))).toBeNull()
  })
})
