import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import {
  avertissementAppel,
  droitAppel,
  enregistrerAppelSansAccord,
  libelleMotifAppel,
  listerAppelsSansAccord,
  preparerMotif,
  resumeAccord,
} from './consentement'
import { contactEssai } from './contact-essai'

describe('droitAppel', () => {
  it('bloque l’appel tant que l’accord est inconnu', () => {
    expect(droitAppel(contactEssai())).toEqual({ autorise: false, raison: 'inconnu' })
  })

  it('autorise l’appel quand l’accord est enregistré', () => {
    expect(droitAppel(contactEssai({ accord_appel: 'oui' }))).toEqual({ autorise: true })
  })

  it('bloque l’appel après un refus', () => {
    expect(droitAppel(contactEssai({ accord_appel: 'non' }))).toEqual({
      autorise: false,
      raison: 'refus',
    })
  })

  it('fait passer l’opposition au démarchage avant un accord', () => {
    const contact = contactEssai({ accord_appel: 'oui', opposition_demarchage: true })
    expect(droitAppel(contact)).toEqual({ autorise: false, raison: 'opposition' })
  })

  it('ne lève pas le blocage pour un client existant : le motif reste à confirmer', () => {
    expect(droitAppel(contactEssai({ client_existant: true })).autorise).toBe(false)
  })
})

describe('avertissementAppel', () => {
  it('explique chaque blocage, avec sa date quand elle est connue', () => {
    const sansDate = { accord_appel_date: null, opposition_demarchage_date: null }
    expect(avertissementAppel('inconnu', sansDate).titre).toBe(
      'Appel bloqué : aucun accord enregistré',
    )
    expect(
      avertissementAppel('refus', { ...sansDate, accord_appel_date: '2026-10-01' }).explication,
    ).toContain('Refus noté le 1 octobre 2026.')
    expect(
      avertissementAppel('opposition', { ...sansDate, opposition_demarchage_date: '2026-10-20' })
        .explication,
    ).toContain('Opposition notée le 20 octobre 2026.')
    expect(avertissementAppel('opposition', sansDate).explication).toContain('Opposition notée. ')
  })
})

describe('resumeAccord', () => {
  it('résume l’accord en une ligne', () => {
    expect(resumeAccord({ accord_appel: 'oui', accord_appel_date: '2026-03-02' })).toBe(
      'Oui, depuis le 2 mars 2026',
    )
    expect(resumeAccord({ accord_appel: 'non', accord_appel_date: null })).toBe('Non')
    expect(resumeAccord({ accord_appel: 'inconnu', accord_appel_date: null })).toBe('Inconnu')
  })
})

describe('preparerMotif', () => {
  it('exige un motif', () => {
    expect(preparerMotif({ motif: '', detail: '' })).toEqual({
      ok: false,
      erreurs: { motif: 'Choisissez un motif.' },
    })
  })

  it('exige une précision pour le motif « autre »', () => {
    expect(preparerMotif({ motif: 'autre', detail: '  ' })).toEqual({
      ok: false,
      erreurs: { detail: 'Précisez le motif de cet appel.' },
    })
    expect(preparerMotif({ motif: 'autre', detail: ' Suite à un courrier ' })).toEqual({
      ok: true,
      motif: 'autre',
      detail: 'Suite à un courrier',
    })
  })

  it('accepte les autres motifs sans précision', () => {
    expect(preparerMotif({ motif: 'client_existant', detail: '' })).toEqual({
      ok: true,
      motif: 'client_existant',
      detail: '',
    })
  })
})

describe('libelleMotifAppel', () => {
  it('donne un libellé court', () => {
    expect(libelleMotifAppel('client_existant')).toBe('Client existant')
    expect(libelleMotifAppel('appel_entrant')).toBe('Appel entrant')
    expect(libelleMotifAppel('professionnel')).toBe('Contact professionnel')
    expect(libelleMotifAppel('autre')).toBe('Autre motif')
    expect(libelleMotifAppel('valeur_inconnue')).toBe('valeur_inconnue')
  })
})

describe('appels sans accord', () => {
  it('enregistre le motif dans la table des appels sans accord', async () => {
    const { client, appels } = fauxClient({ data: { id: 'a' }, error: null })
    const resultat = await enregistrerAppelSansAccord(client, {
      contactId: 'c1',
      telephone: '+33639980001',
      motif: 'appel_entrant',
      detail: 'Rappel demandé',
    })
    expect(resultat.ok).toBe(true)
    expect(appels).toContainEqual(['from', 'appels_sans_accord'])
    expect(appels).toContainEqual([
      'insert',
      {
        contact_id: 'c1',
        telephone: '+33639980001',
        motif: 'appel_entrant',
        detail: 'Rappel demandé',
      },
    ])
  })

  it('lit les appels d’un contact, les plus récents d’abord', async () => {
    const { client, appels } = fauxClient({ data: [{ id: 'a' }], error: null })
    const resultat = await listerAppelsSansAccord(client, 'c1')
    expect(resultat).toEqual({ ok: true, donnees: [{ id: 'a' }] })
    expect(appels).toContainEqual(['eq', 'contact_id', 'c1'])
    expect(appels).toContainEqual(['order', 'created_at', { ascending: false }])
  })
})
