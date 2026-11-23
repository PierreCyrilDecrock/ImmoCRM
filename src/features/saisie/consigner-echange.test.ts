import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { DELAIS_PAR_DEFAUT } from '../relances/delais'
import { tacheEssai } from '../taches/tache-essai'
import {
  aGarder,
  AUTRES_TYPES_ECHANGE,
  brouillonAGarder,
  brouillonDepuisGarde,
  brouillonEchange,
  cleBrouillonEchange,
  enregistrerEchange,
  ficheEchange,
  lireBrouillonGarde,
  messageEchange,
  preparerEchange,
  prochaineEffective,
  resteePrevue,
  tacheAClore,
  tachesDeLaFiche,
  texteDejaPrevu,
  texteTacheClose,
  TYPES_ECHANGE,
} from './consigner-echange'

const AUJOURDHUI = '2026-11-23'
const CONTACT_ID = '00000000-0000-4000-8000-000000000001'
const contact = contactEssai({ prenom: 'Camille', nom: 'Fictif', temperature: 'chaud' })
const CONTEXTE = { aujourdhui: AUJOURDHUI, heure: '10:15', delais: DELAIS_PAR_DEFAUT }

const relanceEnRetard = tacheEssai({
  id: 'relance-hier',
  titre: 'Relancer Camille Fictif',
  echeance: '2026-11-22',
  contact_id: CONTACT_ID,
})
const visiteDuJour = tacheEssai({
  id: 'visite',
  titre: 'Visite 3 rue des Essais',
  categorie: 'visite',
  echeance: AUJOURDHUI,
  heure: '09:00:00',
  contact_id: CONTACT_ID,
})
const envoiDuMandat = tacheEssai({
  id: 'mandat',
  titre: 'Envoyer le mandat',
  categorie: 'administratif',
  echeance: '2026-11-20',
  contact_id: CONTACT_ID,
})
const rendezVousLointain = tacheEssai({
  id: 'rdv',
  titre: 'Rendez-vous d’estimation',
  categorie: 'rendez_vous',
  echeance: '2026-12-02',
  contact_id: CONTACT_ID,
})

describe('types proposés', () => {
  it('propose Appel, Rendez-vous, Visite, Message et Note, puis les autres', () => {
    expect(TYPES_ECHANGE.map((type) => type.libelle)).toEqual([
      'Appel',
      'Rendez-vous',
      'Visite',
      'Message',
      'Note',
    ])
    expect(TYPES_ECHANGE.find((type) => type.libelle === 'Message')?.valeur).toBe('sms')
    expect(AUTRES_TYPES_ECHANGE.map((type) => type.valeur)).toEqual([
      'courriel',
      'estimation',
      'porte_a_porte',
      'document',
      'autre',
    ])
  })

  it('part d’un appel, sans texte', () => {
    const depart = brouillonEchange(contact)
    expect(depart.type).toBe('appel')
    expect(depart.compteRendu).toBe('')
    expect(depart.prochaine.mode).toBe('deja_prevue')
  })
})

describe('tâche close par l’échange', () => {
  const taches = [envoiDuMandat, relanceEnRetard, visiteDuJour, rendezVousLointain]

  it('un appel clôt la relance en retard, pas l’envoi du mandat', () => {
    expect(tacheAClore(taches, 'appel', AUJOURDHUI)?.id).toBe('relance-hier')
    expect(tacheAClore(taches, 'sms', AUJOURDHUI)?.id).toBe('relance-hier')
  })

  it('une visite clôt la visite du jour ; une note ne clôt rien', () => {
    expect(tacheAClore(taches, 'visite', AUJOURDHUI)?.id).toBe('visite')
    expect(tacheAClore(taches, 'note', AUJOURDHUI)).toBeNull()
    expect(tacheAClore(taches, 'document', AUJOURDHUI)).toBeNull()
  })

  it('ne clôt pas une tâche à venir', () => {
    expect(tacheAClore([rendezVousLointain], 'rendez_vous', AUJOURDHUI)).toBeNull()
  })

  it('dit ce qui reste prévu ensuite', () => {
    expect(
      resteePrevue([relanceEnRetard, rendezVousLointain], relanceEnRetard, AUJOURDHUI),
    ).toEqual({ titre: 'Rendez-vous d’estimation', echeance: '2026-12-02', serie: false })
    expect(resteePrevue([relanceEnRetard], relanceEnRetard, AUJOURDHUI)).toBeNull()
    expect(resteePrevue([rendezVousLointain, relanceEnRetard], null, AUJOURDHUI)?.echeance).toBe(
      '2026-11-22',
    )
    expect(resteePrevue([], null, AUJOURDHUI)).toBeNull()
  })

  it('« déjà prévu » devient « planifier » quand rien ne reste prévu', () => {
    const depart = brouillonEchange(contact).prochaine
    expect(prochaineEffective(depart, null).mode).toBe('planifier')
    expect(
      prochaineEffective(depart, { titre: 'X', echeance: '2026-12-02', serie: false }).mode,
    ).toBe('deja_prevue')
    expect(prochaineEffective({ ...depart, mode: 'aucune' }, null).mode).toBe('aucune')
  })

  it('écrit la tâche et ce qui est prévu en clair', () => {
    expect(texteTacheClose(relanceEnRetard, AUJOURDHUI)).toBe(
      '« Relancer Camille Fictif » (hier, en retard)',
    )
    expect(texteTacheClose(visiteDuJour, AUJOURDHUI)).toBe(
      "« Visite 3 rue des Essais » (aujourd'hui)",
    )
    expect(
      texteDejaPrevu({ titre: 'Relancer', echeance: '2026-12-02', serie: true }, AUJOURDHUI),
    ).toBe('« Relancer » (mer. 2 déc., suite de la série)')
  })
})

describe('preparerEchange', () => {
  it('sans tâche à clore : le compte rendu express (activité, puis relance)', () => {
    const brouillon = {
      ...brouillonEchange(contact),
      resultat: 'joint' as const,
      compteRendu: '  Prêt à signer.  ',
    }
    const preparation = preparerEchange(brouillon, { ...CONTEXTE, taches: [], close: null })
    expect(preparation.ok).toBe(true)
    if (!preparation.ok || preparation.envoi.genre !== 'simple') return
    const { activite, tache } = preparation.envoi.valeurs
    expect(activite).toMatchObject({
      type: 'appel',
      resultat: 'joint',
      compte_rendu: 'Prêt à signer.',
      contact_id: CONTACT_ID,
      date_activite: AUJOURDHUI,
    })
    // Contact chaud : relance dans une semaine.
    expect(tache).toMatchObject({ titre: 'Relancer Camille Fictif', echeance: '2026-11-30' })
    expect(preparation.envoi.echeance).toBe('2026-11-30')
  })

  it('une action déjà prévue : rien de plus n’est créé par défaut', () => {
    const preparation = preparerEchange(
      { ...brouillonEchange(contact), compteRendu: 'Point rapide.' },
      { ...CONTEXTE, taches: [rendezVousLointain], close: null },
    )
    expect(
      preparation.ok && preparation.envoi.genre === 'simple' && preparation.envoi.valeurs.tache,
    ).toBe(null)
  })

  it('un appel « Pas de réponse » qui clôt la relance : la boucle, rappel dans 2 jours', () => {
    const brouillon = {
      ...brouillonEchange(contact),
      resultat: 'pas_de_reponse' as const,
      prochaine: { mode: 'planifier' as const, titre: null, echeance: '2026-11-25' },
    }
    const preparation = preparerEchange(brouillon, {
      ...CONTEXTE,
      taches: [relanceEnRetard],
      close: relanceEnRetard,
    })
    expect(preparation).toEqual({
      ok: true,
      envoi: {
        genre: 'boucle',
        echeance: '2026-11-25',
        parametres: {
          p_id: 'relance-hier',
          p_type: 'appel',
          p_resultat: 'pas_de_reponse',
          p_compte_rendu: '',
          p_prochaine_titre: 'Relancer Camille Fictif',
          p_prochaine_categorie: 'relance',
          p_prochaine_echeance: '2026-11-25',
          p_prochaine_motif: '',
          p_sans_prochaine_action: false,
        },
      },
    })
  })

  it('une visite qui clôt la visite du jour : compte rendu structuré, rappel le lendemain', () => {
    const brouillon = {
      ...brouillonEchange(contact),
      type: 'visite' as const,
      visite: {
        pointsPositifs: 'Lumineux',
        pointsNegatifs: '',
        interet: 'fort' as const,
        suite: '' as const,
      },
    }
    const preparation = preparerEchange(brouillon, {
      ...CONTEXTE,
      taches: [visiteDuJour],
      close: visiteDuJour,
    })
    expect(preparation.ok).toBe(true)
    if (!preparation.ok || preparation.envoi.genre !== 'boucle') return
    expect(preparation.envoi.parametres).toMatchObject({
      p_id: 'visite',
      p_type: 'visite',
      p_prochaine_titre: 'Rappeler Camille Fictif après la visite',
      p_prochaine_echeance: '2026-11-24',
      p_visite_points_positifs: 'Lumineux',
      p_visite_interet: 'fort',
    })
    expect(preparation.envoi.parametres).not.toHaveProperty('p_resultat')
  })

  it('refuse une note vide et une date passée', () => {
    const preparation = preparerEchange(
      {
        ...brouillonEchange(contact),
        type: 'note',
        prochaine: { mode: 'planifier', titre: null, echeance: '2026-11-20' },
      },
      { ...CONTEXTE, taches: [], close: null },
    )
    expect(preparation).toEqual({
      ok: false,
      erreurs: {
        compteRendu: 'Écrivez ou dictez la note.',
        echeance: 'La prochaine action se prévoit à partir d’aujourd’hui.',
      },
    })
  })
})

describe('enregistrerEchange', () => {
  it('passe par la fonction boucler_tache quand une tâche est close', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    const resultat = await enregistrerEchange(
      client,
      {
        genre: 'boucle',
        echeance: null,
        parametres: { p_id: 'relance-hier', p_type: 'appel', p_sans_prochaine_action: false },
      },
      false,
    )
    expect(resultat).toEqual({ ok: true })
    expect(appels[0]?.[0]).toBe('rpc')
    expect(appels[0]?.[1]).toBe('boucler_tache')
  })

  it('dit ce qui a échoué', async () => {
    const { client } = fauxClient('panne')
    const resultat = await enregistrerEchange(
      client,
      {
        genre: 'boucle',
        echeance: null,
        parametres: { p_id: 'x', p_type: 'appel' },
      },
      false,
    )
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.message).toMatch(/^L'enregistrement a échoué\./)
  })

  it('confirme avec la date de la prochaine action', () => {
    expect(messageEchange(contact, '2026-11-25', AUJOURDHUI)).toBe(
      'Ajouté au journal de Camille Fictif. Prochaine action : mer. 25 nov.',
    )
    expect(messageEchange(contact, null, AUJOURDHUI)).toBe('Ajouté au journal de Camille Fictif.')
  })
})

describe('brouillon gardé sur l’appareil', () => {
  const maintenant = new Date('2026-11-23T10:00:00Z')

  it('ne garde que ce qui a été écrit', () => {
    expect(aGarder(brouillonEchange(contact))).toBe(false)
    expect(aGarder({ ...brouillonEchange(contact), compteRendu: '   ' })).toBe(false)
    expect(aGarder({ ...brouillonEchange(contact), compteRendu: 'A rappelé' })).toBe(true)
    expect(
      aGarder({
        ...brouillonEchange(contact),
        visite: { pointsPositifs: '', pointsNegatifs: '', interet: 'moyen', suite: '' },
      }),
    ).toBe(true)
  })

  it('relit ce qu’il a gardé, contact par contact', () => {
    const brouillon = {
      ...brouillonEchange(contact),
      type: 'appel' as const,
      resultat: 'joint' as const,
      compteRendu: 'Veut vendre au printemps',
    }
    const garde = brouillonAGarder(brouillon, maintenant)
    const relu = lireBrouillonGarde(JSON.stringify(garde), maintenant)
    expect(relu).toEqual(garde)
    expect(cleBrouillonEchange(CONTACT_ID)).toBe(`immocrm.echange.${CONTACT_ID}`)
    if (relu === null) return
    const repris = brouillonDepuisGarde(relu, contact)
    expect(repris).toMatchObject({
      contact,
      type: 'appel',
      resultat: 'joint',
      compteRendu: 'Veut vendre au printemps',
    })
    expect(repris.prochaine.mode).toBe('deja_prevue')
  })

  it('écarte un brouillon illisible, vide ou trop vieux', () => {
    expect(lireBrouillonGarde(null, maintenant)).toBeNull()
    expect(lireBrouillonGarde('{pas du json', maintenant)).toBeNull()
    expect(lireBrouillonGarde('"texte"', maintenant)).toBeNull()
    expect(
      lireBrouillonGarde(
        JSON.stringify({ type: 'inconnu', compteRendu: 'x', le: maintenant }),
        maintenant,
      ),
    ).toBeNull()
    expect(
      lireBrouillonGarde(
        JSON.stringify({ type: 'appel', compteRendu: '', le: maintenant }),
        maintenant,
      ),
    ).toBeNull()
    expect(
      lireBrouillonGarde(
        JSON.stringify({ type: 'appel', compteRendu: 'x', le: '2026-11-01T10:00:00Z' }),
        maintenant,
      ),
    ).toBeNull()
  })

  it('remplace une valeur inconnue par une valeur vide', () => {
    const relu = lireBrouillonGarde(
      JSON.stringify({
        type: 'visite',
        resultat: 'bizarre',
        compteRendu: 'x',
        visite: { interet: 'enorme', suite: 'offre', pointsPositifs: 3 },
        le: '2026-11-22T10:00:00Z',
      }),
      maintenant,
    )
    expect(relu).toEqual({
      type: 'visite',
      resultat: '',
      compteRendu: 'x',
      visite: { pointsPositifs: '', pointsNegatifs: '', interet: '', suite: 'offre' },
      le: '2026-11-22T10:00:00.000Z',
    })
  })
})

describe('échange consigné depuis une fiche Bien ou Projet (étape D.7)', () => {
  const BIEN_ID = '00000000-0000-4000-8000-0000000000b1'
  const PROJET_ID = '00000000-0000-4000-8000-0000000000p1'
  const bien = bienEssai({ id: BIEN_ID })
  const relanceDuBien = tacheEssai({
    id: 'relance-bien',
    echeance: '2026-11-22',
    contact_id: CONTACT_ID,
    bien_id: BIEN_ID,
  })
  const relanceDuProjet = tacheEssai({
    id: 'relance-projet',
    echeance: '2026-11-22',
    contact_id: CONTACT_ID,
    projet_vendeur_id: PROJET_ID,
  })

  it('ne clôt que les tâches liées à la fiche ouverte', () => {
    const taches = [relanceEnRetard, relanceDuBien, relanceDuProjet]
    expect(tachesDeLaFiche(taches, { contactId: CONTACT_ID })).toHaveLength(3)
    expect(tachesDeLaFiche(taches, { bienId: BIEN_ID }).map((t) => t.id)).toEqual(['relance-bien'])
    expect(tachesDeLaFiche(taches, { projetVendeurId: PROJET_ID }).map((t) => t.id)).toEqual([
      'relance-projet',
    ])
    expect(tachesDeLaFiche(taches, { projetAcquereurId: PROJET_ID })).toEqual([])
  })

  it('garde un brouillon par fiche', () => {
    expect(ficheEchange({ contactId: CONTACT_ID })).toBe(CONTACT_ID)
    expect(ficheEchange({ bienId: BIEN_ID })).toBe(`bien.${BIEN_ID}`)
    expect(ficheEchange({ projetVendeurId: PROJET_ID })).toBe(`vendeur.${PROJET_ID}`)
    expect(ficheEchange({ projetAcquereurId: PROJET_ID })).toBe(`acquereur.${PROJET_ID}`)
  })

  it('lie l’activité et la relance au bien et au projet de la fiche', () => {
    const preparation = preparerEchange(
      { ...brouillonEchange(contact), compteRendu: 'Point sur le prix.' },
      {
        ...CONTEXTE,
        taches: [],
        close: null,
        liens: { bien, projet: { genre: 'vendeur', id: PROJET_ID } },
      },
    )
    expect(preparation.ok).toBe(true)
    if (!preparation.ok || preparation.envoi.genre !== 'simple') return
    const { activite, tache } = preparation.envoi.valeurs
    expect(activite).toMatchObject({
      contact_id: CONTACT_ID,
      bien_id: BIEN_ID,
      projet_vendeur_id: PROJET_ID,
      projet_acquereur_id: null,
    })
    expect(tache).toMatchObject({
      contact_id: CONTACT_ID,
      bien_id: BIEN_ID,
      projet_vendeur_id: PROJET_ID,
    })
  })

  it('sans contact sur un bien : une note au journal du bien, rien de prévu ensuite', () => {
    const brouillon = {
      ...brouillonEchange(null),
      type: 'note' as const,
      compteRendu: 'Toiture refaite.',
    }
    const refuse = preparerEchange(brouillon, { ...CONTEXTE, taches: [], close: null })
    expect(refuse).toMatchObject({ ok: false, erreurs: { contact: 'Choisissez le contact.' } })
    const preparation = preparerEchange(brouillon, {
      ...CONTEXTE,
      taches: [],
      close: null,
      liens: { bien },
      contactFacultatif: true,
    })
    expect(preparation.ok).toBe(true)
    if (!preparation.ok || preparation.envoi.genre !== 'simple') return
    expect(preparation.envoi.valeurs.activite).toMatchObject({
      type: 'note',
      contact_id: null,
      bien_id: BIEN_ID,
    })
    expect(preparation.envoi.valeurs.tache).toBeNull()
    expect(messageEchange(null, null, AUJOURDHUI)).toBe('Ajouté au journal.')
  })
})
