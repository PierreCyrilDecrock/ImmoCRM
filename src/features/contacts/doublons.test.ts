import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { contactEssai } from './contact-essai'
import { chercherDoublons, libelleMotifs, motifsDoublon } from './doublons'

const EXISTANT = contactEssai({
  telephones: ['+33639980001', '+33199000001'],
  courriels: ['camille.fictif@exemple.invalid'],
})

describe('motifsDoublon', () => {
  it('reconnaît un téléphone déjà connu, même en second numéro', () => {
    expect(motifsDoublon({ telephones: ['+33199000001'], courriels: [] }, EXISTANT)).toEqual([
      'telephone',
    ])
  })

  it('reconnaît un courriel déjà connu', () => {
    const saisie = { telephones: [], courriels: ['camille.fictif@exemple.invalid'] }
    expect(motifsDoublon(saisie, EXISTANT)).toEqual(['courriel'])
  })

  it('cumule téléphone et courriel', () => {
    const saisie = {
      telephones: ['+33639980001'],
      courriels: ['camille.fictif@exemple.invalid'],
    }
    expect(motifsDoublon(saisie, EXISTANT)).toEqual(['telephone', 'courriel'])
  })

  it('retient le nom quand aucune coordonnée n’est commune', () => {
    expect(motifsDoublon({ telephones: ['+33639989999'], courriels: [] }, EXISTANT)).toEqual([
      'nom',
    ])
    expect(motifsDoublon({}, EXISTANT)).toEqual(['nom'])
  })
})

describe('libelleMotifs', () => {
  it('écrit les motifs en clair', () => {
    expect(libelleMotifs(['telephone', 'courriel'])).toBe('même téléphone, même courriel')
    expect(libelleMotifs(['nom'])).toBe('nom très proche')
  })
})

describe('chercherDoublons', () => {
  it('envoie à la base les coordonnées et le nom de classement', async () => {
    const { client, appels } = fauxClient({ data: [EXISTANT], error: null })
    const resultat = await chercherDoublons(client, {
      type: 'personne',
      prenom: 'Camille',
      nom: 'Fictif',
      telephones: ['+33639980001'],
      courriels: [],
    })
    expect(resultat).toEqual({ ok: true, donnees: [EXISTANT] })
    expect(appels).toEqual([
      [
        'rpc',
        'doublons_contact',
        { p_telephones: ['+33639980001'], p_courriels: [], p_nom: 'Fictif Camille' },
      ],
    ])
  })

  it('compare une société par sa raison sociale, et écarte la fiche en cours', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await chercherDoublons(
      client,
      { type: 'societe', raison_sociale: 'Étude Spécimen', nom: 'Fictif' },
      'id-en-cours',
    )
    expect(appels[0]?.[2]).toEqual({
      p_telephones: [],
      p_courriels: [],
      p_nom: 'Étude Spécimen',
      p_sauf: 'id-en-cours',
    })
  })
})
