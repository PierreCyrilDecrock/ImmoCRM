import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { contactEssai } from './contact-essai'
import {
  conflitsFusion,
  fusionnerContacts,
  preparerFusion,
  reunirConsentement,
  valeurBloc,
} from './fusion'

const ID_GARDE = '00000000-0000-4000-8000-000000000001'
const ID_ABSORBE = '00000000-0000-4000-8000-000000000002'
const DATE = new Date('2026-11-16T10:00:00Z')

const GARDE = contactEssai({
  id: ID_GARDE,
  civilite: 'mme',
  telephones: ['+33639980001'],
  courriels: ['camille.fictif@exemple.invalid'],
  adresse: "12 rue de l'Exemple",
  code_postal: '00000',
  ville: 'Villefictive',
  notes: 'Rencontrée au marché.',
  roles: ['vendeur'],
  etiquettes: ['Investisseur'],
  source: 'pige',
  source_detail: 'Annonce fictive',
  temperature: 'chaud',
})

const ABSORBE = contactEssai({
  id: ID_ABSORBE,
  prenom: 'Camile',
  telephones: ['+33639980001', '+33199000002'],
  courriels: ['c.fictif@exemple.invalid'],
  adresse: '3 avenue du Test',
  code_postal: '00000',
  ville: 'Villefictive',
  notes: 'Cherche aussi un studio.',
  roles: ['acquereur', 'vendeur'],
  etiquettes: ['investisseur', 'retraité'],
  source: 'boitage',
  temperature: 'tiede',
})

function fusion(...parametres: Parameters<typeof preparerFusion>) {
  const preparation = preparerFusion(...parametres)
  if (!preparation.ok) throw new Error(preparation.message)
  return preparation.valeurs
}

describe('conflitsFusion', () => {
  it('signale les rubriques renseignées différemment', () => {
    expect(conflitsFusion(GARDE, ABSORBE)).toEqual(['identite', 'adresse', 'source', 'temperature'])
  })

  it('ne signale rien quand une seule fiche est renseignée, ou quand elles sont d’accord', () => {
    const vide = contactEssai({ id: ID_ABSORBE, civilite: 'mme' })
    expect(conflitsFusion(GARDE, vide)).toEqual([])
    expect(conflitsFusion(GARDE, { ...GARDE, id: ID_ABSORBE })).toEqual([])
  })
})

describe('valeurBloc', () => {
  it('écrit chaque rubrique en clair', () => {
    expect(valeurBloc(GARDE, 'identite')).toBe('Mme Camille Fictif')
    expect(valeurBloc(GARDE, 'adresse')).toBe("12 rue de l'Exemple, 00000 Villefictive")
    expect(valeurBloc(GARDE, 'source')).toBe('Pige (Annonce fictive)')
    expect(valeurBloc(GARDE, 'temperature')).toBe('Chaud')
    expect(valeurBloc(contactEssai(), 'source')).toBe('')
  })
})

describe('preparerFusion', () => {
  it('réunit téléphones, courriels, rôles et étiquettes sans répétition', () => {
    const valeurs = fusion(GARDE, ABSORBE, {}, DATE)
    expect(valeurs.telephones).toEqual(['+33639980001', '+33199000002'])
    expect(valeurs.courriels).toEqual([
      'camille.fictif@exemple.invalid',
      'c.fictif@exemple.invalid',
    ])
    expect(valeurs.roles).toEqual(['vendeur', 'acquereur'])
    expect(valeurs.etiquettes).toEqual(['Investisseur', 'retraité'])
  })

  it('garde par défaut les valeurs de la fiche gardée et recopie les autres dans les notes', () => {
    const valeurs = fusion(GARDE, ABSORBE, {}, DATE)
    expect(valeurs).toMatchObject({
      civilite: 'mme',
      prenom: 'Camille',
      adresse: "12 rue de l'Exemple",
      source: 'pige',
      source_detail: 'Annonce fictive',
      temperature: 'chaud',
    })
    expect(valeurs.notes).toBe(
      [
        'Rencontrée au marché.',
        'Cherche aussi un studio.',
        [
          'Fusion du 16 novembre 2026 avec la fiche « Camile Fictif » :',
          'Autre nom : Camile Fictif',
          'Autre adresse : 3 avenue du Test, 00000 Villefictive',
          'Autre source : Boitage',
          'Autre température : Tiède',
        ].join('\n'),
      ].join('\n\n'),
    )
  })

  it('suit les choix de l’utilisateur, rubrique par rubrique', () => {
    const valeurs = fusion(GARDE, ABSORBE, { identite: 'absorbe', source: 'absorbe' }, DATE)
    expect(valeurs).toMatchObject({
      prenom: 'Camile',
      // La fiche retenue ne précise pas la civilité : celle de l'autre la complète.
      civilite: 'mme',
      adresse: "12 rue de l'Exemple",
      source: 'boitage',
      source_detail: '',
      temperature: 'chaud',
    })
    expect(valeurs.notes).toContain('Autre nom : Mme Camille Fictif')
    expect(valeurs.notes).toContain('Autre source : Pige (Annonce fictive)')
  })

  it('complète ce que la fiche gardée ne renseigne pas, sans rien noter', () => {
    const garde = contactEssai({ id: ID_GARDE })
    const absorbe = contactEssai({
      id: ID_ABSORBE,
      adresse: '3 avenue du Test',
      ville: 'Villefictive',
      source: 'boitage',
      temperature: 'froid',
      notes: 'Une note.',
    })
    const valeurs = fusion(garde, absorbe, {}, DATE)
    expect(valeurs).toMatchObject({
      adresse: '3 avenue du Test',
      ville: 'Villefictive',
      source: 'boitage',
      temperature: 'froid',
      notes: 'Une note.',
    })
  })

  it('note les téléphones qui dépassent la limite au lieu de les perdre', () => {
    const garde = contactEssai({
      id: ID_GARDE,
      telephones: ['+33639980001', '+33639980002', '+33639980003', '+33639980004'],
    })
    const absorbe = contactEssai({
      id: ID_ABSORBE,
      telephones: ['+33639980005', '+33639980006'],
    })
    const valeurs = fusion(garde, absorbe, {}, DATE)
    expect(valeurs.telephones).toHaveLength(5)
    expect(valeurs.notes).toContain('Autres téléphones : 06 39 98 00 06')
  })

  it('ne laisse pas une fiche être recommandée par elle-même ou par la fiche absorbée', () => {
    const garde = contactEssai({
      id: ID_GARDE,
      source: 'recommandation',
      recommande_par_id: ID_ABSORBE,
    })
    const absorbe = contactEssai({ id: ID_ABSORBE })
    expect(fusion(garde, absorbe, {}, DATE).recommande_par_id).toBeNull()

    const tiers = '00000000-0000-4000-8000-000000000003'
    const recommande = contactEssai({
      id: ID_GARDE,
      source: 'recommandation',
      recommande_par_id: tiers,
    })
    expect(fusion(recommande, absorbe, {}, DATE).recommande_par_id).toBe(tiers)
  })

  it('refuse la fusion si les notes réunies sont trop longues', () => {
    const garde = contactEssai({ id: ID_GARDE, notes: 'a'.repeat(3000) })
    const absorbe = contactEssai({ id: ID_ABSORBE, notes: 'b'.repeat(3000) })
    const preparation = preparerFusion(garde, absorbe, {}, DATE)
    expect(preparation.ok).toBe(false)
    expect(!preparation.ok && preparation.message).toContain('5000 caractères')
  })
})

describe('reunirConsentement', () => {
  const OUI = {
    accord_appel: 'oui',
    accord_appel_date: '2026-09-15',
    accord_appel_preuve: 'Accord fictif de vive voix',
  }

  it('garde l’accord connu quand l’autre fiche ne sait rien', () => {
    const { valeurs, ecartes } = reunirConsentement(contactEssai(), contactEssai(OUI))
    expect(valeurs).toMatchObject(OUI)
    expect(ecartes).toEqual([])
  })

  it('retient la réponse la plus récente et note l’autre', () => {
    const refus = { accord_appel: 'non', accord_appel_date: '2026-10-01', accord_appel_preuve: '' }
    const { valeurs, ecartes } = reunirConsentement(contactEssai(OUI), contactEssai(refus))
    expect(valeurs).toMatchObject(refus)
    expect(ecartes).toEqual([
      "Autre réponse sur l'accord pour être appelé : Oui, depuis le 15 septembre 2026 (Accord fictif de vive voix)",
    ])
  })

  it('retient le refus quand les dates ne départagent pas', () => {
    const { valeurs } = reunirConsentement(contactEssai(OUI), contactEssai({ accord_appel: 'non' }))
    expect(valeurs.accord_appel).toBe('non')
    expect(valeurs.accord_appel_date).toBeNull()
  })

  it('étend à la fiche réunie l’opposition et le « client existant » de l’une des deux', () => {
    const { valeurs } = reunirConsentement(
      contactEssai({ client_existant: true }),
      contactEssai({ opposition_demarchage: true, opposition_demarchage_date: '2026-10-20' }),
    )
    expect(valeurs).toMatchObject({
      client_existant: true,
      opposition_demarchage: true,
      opposition_demarchage_date: '2026-10-20',
    })
  })

  it('garde la date de collecte la plus ancienne et note une autre origine', () => {
    const { valeurs, ecartes } = reunirConsentement(
      contactEssai({ collecte_date: '2026-11-16', collecte_origine: 'Annonce fictive' }),
      contactEssai({ collecte_date: '2026-05-04', collecte_origine: 'Porte-à-porte fictif' }),
    )
    expect(valeurs.collecte_date).toBe('2026-05-04')
    expect(valeurs.collecte_origine).toBe('Annonce fictive')
    expect(ecartes).toEqual(['Autre origine des données : Porte-à-porte fictif'])
  })
})

describe('fusionnerContacts', () => {
  it('confie la fusion à la base, en une seule opération', async () => {
    const { client, appels } = fauxClient({ data: GARDE, error: null })
    const valeurs = fusion(GARDE, ABSORBE, {}, DATE)
    const resultat = await fusionnerContacts(client, ID_GARDE, ID_ABSORBE, valeurs)
    expect(resultat).toEqual({ ok: true, donnees: GARDE })
    expect(appels).toEqual([
      [
        'rpc',
        'fusionner_contacts',
        { p_garde: ID_GARDE, p_absorbe: ID_ABSORBE, p_valeurs: valeurs },
      ],
    ])
  })
})
