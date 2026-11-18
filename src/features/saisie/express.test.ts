import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { contactEssai } from '../contacts/contact-essai'
import { DELAIS_PAR_DEFAUT } from '../relances/delais'
import {
  brouillonCompteRendu,
  choisirContact,
  enregistrerCompteRendu,
  preparerCompteRendu,
  prochaineProposeeCompteRendu,
} from './compte-rendu-express'
import {
  AVANCEE_VIDE,
  brouillonContactExpress,
  enregistrerContactExpress,
  preparerContactExpress,
  prochaineProposeeContact,
  titreRelanceExpress,
  type BrouillonContactExpress,
} from './contact-express'
import { prochaineAffichee, prochaineVide, verifierProchaine } from './prochaine-action'

const AUJOURDHUI = '2026-11-18'
const CONTEXTE = { aujourdhui: AUJOURDHUI, delais: DELAIS_PAR_DEFAUT }

describe('prochaine action', () => {
  const proposee = { titre: 'Relancer Camille Fictif', echeance: '2026-12-18' }

  it('suit la proposition tant qu’on n’y touche pas', () => {
    expect(prochaineAffichee(prochaineVide(), proposee)).toEqual(proposee)
    expect(
      prochaineAffichee({ mode: 'planifier', titre: 'Envoyer l’avis', echeance: null }, proposee),
    ).toEqual({ titre: 'Envoyer l’avis', echeance: '2026-12-18' })
  })

  it('refuse un titre vide et une date passée', () => {
    expect(
      verifierProchaine(
        { mode: 'planifier', titre: '  ', echeance: '2026-11-17' },
        proposee,
        AUJOURDHUI,
      ),
    ).toEqual({
      ok: false,
      erreurs: {
        titre: 'Indiquez la prochaine action.',
        echeance: 'La prochaine action se prévoit à partir d’aujourd’hui.',
      },
    })
  })

  it('ne crée rien quand l’action est déjà prévue ou volontairement absente', () => {
    expect(verifierProchaine(prochaineVide('deja_prevue'), proposee, AUJOURDHUI)).toEqual({
      ok: true,
      tache: null,
    })
    expect(verifierProchaine(prochaineVide('aucune'), proposee, AUJOURDHUI)).toEqual({
      ok: true,
      tache: null,
    })
  })
})

describe('nouveau contact express', () => {
  function brouillon(valeurs: Partial<BrouillonContactExpress> = {}): BrouillonContactExpress {
    return { ...brouillonContactExpress(), nom: 'Fictif', prenom: 'Camille', ...valeurs }
  }

  it('propose de relancer la personne, au rythme de sa température', () => {
    expect(titreRelanceExpress('', '')).toBe('Relancer')
    expect(titreRelanceExpress(' Camille ', 'Fictif')).toBe('Relancer Camille Fictif')
    expect(
      prochaineProposeeContact(brouillon({ temperature: 'chaud' }), AUJOURDHUI, DELAIS_PAR_DEFAUT),
    ).toEqual({
      titre: 'Relancer Camille Fictif',
      echeance: '2026-11-25',
    })
    // Sans température : le rythme d'un contact tiède (un mois).
    expect(prochaineProposeeContact(brouillon(), AUJOURDHUI, DELAIS_PAR_DEFAUT).echeance).toBe(
      '2026-12-18',
    )
  })

  it('prépare le contact, la note et la prochaine action', () => {
    const resultat = preparerContactExpress(
      brouillon({
        telephone: '06 00 00 00 01',
        source: 'porte_a_porte',
        temperature: 'tiede',
        note: '  Vend dans six mois  ',
      }),
      CONTEXTE,
    )
    expect(resultat).toEqual({
      ok: true,
      valeurs: {
        contact: expect.objectContaining({
          prenom: 'Camille',
          nom: 'Fictif',
          telephones: ['+33600000001'],
          source: 'porte_a_porte',
          temperature: 'tiede',
          collecte_date: AUJOURDHUI,
          accord_appel: 'inconnu',
        }),
        note: 'Vend dans six mois',
        tache: { titre: 'Relancer Camille Fictif', echeance: '2026-12-18' },
      },
    })
  })

  it('demande le nom et un téléphone lisible', () => {
    const resultat = preparerContactExpress(brouillon({ nom: '', telephone: '12' }), CONTEXTE)
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.erreurs.nom).toBeDefined()
    expect(resultat.erreurs.telephone).toBeDefined()
  })

  it('permet de ne rien prévoir', () => {
    const resultat = preparerContactExpress(
      brouillon({ prochaine: prochaineVide('aucune') }),
      CONTEXTE,
    )
    expect(resultat.ok && resultat.valeurs.tache).toBeNull()
  })

  it('enregistre le contact, la note puis la tâche liée au contact', async () => {
    const contact = contactEssai()
    const { client, appels } = fauxClient({ data: contact, error: null })
    const preparation = preparerContactExpress(brouillon({ note: 'Première note' }), CONTEXTE)
    if (!preparation.ok) throw new Error('préparation refusée')
    const resultat = await enregistrerContactExpress(client, preparation.valeurs, AVANCEE_VIDE, {
      date: AUJOURDHUI,
      heure: '10:00',
    })
    expect(resultat.ok).toBe(true)
    const tables = appels.filter((appel) => appel[0] === 'from').map((appel) => appel[1])
    expect(tables).toEqual(['contacts', 'activites', 'taches'])
    const insertions = appels.filter((appel) => appel[0] === 'insert').map((appel) => appel[1])
    expect(insertions[1]).toEqual(
      expect.objectContaining({
        type: 'note',
        compte_rendu: 'Première note',
        contact_id: contact.id,
      }),
    )
    expect(insertions[2]).toEqual(
      expect.objectContaining({
        titre: 'Relancer Camille Fictif',
        categorie: 'relance',
        contact_id: contact.id,
      }),
    )
  })

  it('reprend sans recréer le contact après un échec', async () => {
    const contact = contactEssai()
    const { client, appels } = fauxClient({ data: null, error: { message: 'erreur' }, status: 500 })
    const preparation = preparerContactExpress(brouillon({ note: 'Note' }), CONTEXTE)
    if (!preparation.ok) throw new Error('préparation refusée')
    const resultat = await enregistrerContactExpress(
      client,
      preparation.valeurs,
      { contact, note: true },
      { date: AUJOURDHUI, heure: '10:00' },
    )
    expect(resultat).toEqual(
      expect.objectContaining({ ok: false, avancee: { contact, note: true } }),
    )
    expect(appels.filter((appel) => appel[0] === 'from').map((appel) => appel[1])).toEqual([
      'taches',
    ])
  })
})

describe('compte rendu express', () => {
  const contact = contactEssai({ temperature: 'froid' })
  const contexte = { ...CONTEXTE, heure: '11:30' }

  it('propose une relance au rythme du contact, ou un rappel le lendemain d’une visite', () => {
    expect(
      prochaineProposeeCompteRendu({ contact, type: 'appel' }, AUJOURDHUI, DELAIS_PAR_DEFAUT),
    ).toEqual({
      titre: 'Relancer Camille Fictif',
      echeance: '2027-02-18',
    })
    expect(
      prochaineProposeeCompteRendu({ contact, type: 'visite' }, AUJOURDHUI, DELAIS_PAR_DEFAUT),
    ).toEqual({
      titre: 'Rappeler Camille Fictif après la visite',
      echeance: '2026-11-19',
    })
  })

  it('ne propose pas une seconde action quand le contact en a déjà une', () => {
    const occupe = contactEssai({ prochaine_action_le: '2026-11-20' })
    expect(brouillonCompteRendu(occupe).prochaine.mode).toBe('deja_prevue')
    expect(choisirContact(brouillonCompteRendu(occupe), contact).prochaine.mode).toBe('planifier')
  })

  it('demande le contact', () => {
    expect(preparerCompteRendu(brouillonCompteRendu(), contexte)).toEqual({
      ok: false,
      erreurs: { contact: 'Choisissez le contact.' },
    })
  })

  it('prépare le compte rendu et la relance', () => {
    const resultat = preparerCompteRendu(
      { ...brouillonCompteRendu(contact), resultat: 'joint', compteRendu: 'Rappelle en janvier' },
      contexte,
    )
    expect(resultat).toEqual({
      ok: true,
      valeurs: {
        activite: expect.objectContaining({
          type: 'appel',
          resultat: 'joint',
          compte_rendu: 'Rappelle en janvier',
          date_activite: AUJOURDHUI,
          heure: '11:30',
          contact_id: contact.id,
        }),
        tache: expect.objectContaining({
          titre: 'Relancer Camille Fictif',
          echeance: '2027-02-18',
          categorie: 'relance',
          contact_id: contact.id,
        }),
      },
    })
  })

  it('garde le compte rendu structuré d’une visite', () => {
    const resultat = preparerCompteRendu(
      {
        ...brouillonCompteRendu(contact),
        type: 'visite',
        visite: {
          pointsPositifs: 'Lumineux',
          pointsNegatifs: 'Bruit',
          interet: 'fort',
          suite: 'offre',
        },
      },
      contexte,
    )
    expect(resultat.ok && resultat.valeurs.activite).toEqual(
      expect.objectContaining({
        type: 'visite',
        visite_points_positifs: 'Lumineux',
        visite_points_negatifs: 'Bruit',
        visite_interet: 'fort',
        visite_suite: 'offre',
      }),
    )
  })

  it('une note sans texte est refusée', () => {
    const resultat = preparerCompteRendu(
      { ...brouillonCompteRendu(contact), type: 'note' },
      contexte,
    )
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.erreurs.compteRendu).toBeDefined()
  })

  it('après un échec de la tâche, ne réécrit pas le compte rendu', async () => {
    const preparation = preparerCompteRendu(brouillonCompteRendu(contact), contexte)
    if (!preparation.ok) throw new Error('préparation refusée')
    const { client, appels } = fauxClient({ data: null, error: { message: 'erreur' }, status: 500 })
    const resultat = await enregistrerCompteRendu(client, preparation.valeurs, true)
    expect(resultat).toEqual(expect.objectContaining({ ok: false, activiteCreee: true }))
    expect(appels.filter((appel) => appel[0] === 'from').map((appel) => appel[1])).toEqual([
      'taches',
    ])
  })
})
