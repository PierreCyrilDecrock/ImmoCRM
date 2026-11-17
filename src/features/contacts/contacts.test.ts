import { describe, expect, it } from 'vitest'
import { contactEssai } from './contact-essai'
import { fauxClient } from '../../lib/faux-client'
import {
  adresseComplete,
  ajouterEtiquette,
  archiverContact,
  brouillonDepuis,
  brouillonVide,
  creerContact,
  interlocuteur,
  chercherContacts,
  listerEtiquettes,
  MAX_ETIQUETTES,
  nomAvecCivilite,
  nomComplet,
  nomDeListe,
  preparerContact,
  resumeContact,
  supprimerContactDefinitivement,
  validerCourriel,
  type BrouillonContact,
} from './contacts'

/** Fiche fictive complète, pour les tests. */
const contact = contactEssai

function brouillon(valeurs: Partial<BrouillonContact> = {}): BrouillonContact {
  return { ...brouillonVide(), ...valeurs }
}

describe('noms', () => {
  it('compose le nom d’une personne', () => {
    const fiche = contact({ civilite: 'mme' })
    expect(nomComplet(fiche)).toBe('Camille Fictif')
    expect(nomAvecCivilite(fiche)).toBe('Mme Camille Fictif')
    expect(nomDeListe(fiche)).toBe('Fictif Camille')
    expect(interlocuteur(fiche)).toBe('')
  })

  it('se contente du nom quand le prénom manque', () => {
    expect(nomComplet(contact({ prenom: '' }))).toBe('Fictif')
    expect(nomDeListe(contact({ prenom: '' }))).toBe('Fictif')
  })

  it('utilise la raison sociale pour une société, et garde la personne à joindre à part', () => {
    const societe = contact({ type: 'societe', raison_sociale: 'Étude Spécimen', civilite: 'm' })
    expect(nomComplet(societe)).toBe('Étude Spécimen')
    expect(nomAvecCivilite(societe)).toBe('Étude Spécimen')
    expect(nomDeListe(societe)).toBe('Étude Spécimen')
    expect(interlocuteur(societe)).toBe('M. Camille Fictif')
  })
})

describe('résumés', () => {
  it('montre le premier téléphone puis les rôles', () => {
    const fiche = contact({
      telephones: ['+33639980123', '+33199001234'],
      roles: ['vendeur', 'acquereur'],
    })
    expect(resumeContact(fiche)).toBe('06 39 98 01 23 · Vendeur, Acquéreur')
    expect(resumeContact(contact({ roles: ['notaire'] }))).toBe('Notaire')
    expect(resumeContact(contact())).toBeUndefined()
  })

  it('compose l’adresse avec ce qui est renseigné', () => {
    const complete = { adresse: "3 rue de l'Exemple", code_postal: '00000', ville: 'Villefictive' }
    expect(adresseComplete(complete)).toBe("3 rue de l'Exemple, 00000 Villefictive")
    expect(adresseComplete({ adresse: '', code_postal: '', ville: 'Villefictive' })).toBe(
      'Villefictive',
    )
    expect(adresseComplete({ adresse: '', code_postal: '', ville: '' })).toBe('')
  })
})

describe('validerCourriel', () => {
  it('accepte une adresse bien formée', () => {
    expect(validerCourriel('camille.fictif@exemple.invalid')).toBeNull()
    expect(validerCourriel('  c+immo@sous.exemple.invalid ')).toBeNull()
  })

  it('refuse une adresse mal formée', () => {
    for (const saisie of ['camille', 'camille@', '@exemple.fr', 'a b@exemple.fr', 'a@exemple']) {
      expect(validerCourriel(saisie), saisie).not.toBeNull()
    }
  })
})

describe('ajouterEtiquette', () => {
  it('ajoute une étiquette nettoyée', () => {
    expect(ajouterEtiquette(['Investisseur'], '  résidence   secondaire ')).toEqual([
      'Investisseur',
      'résidence secondaire',
    ])
  })

  it('ignore une étiquette vide ou déjà présente, à la casse et aux accents près', () => {
    expect(ajouterEtiquette(['Investisseur'], '   ')).toEqual(['Investisseur'])
    expect(ajouterEtiquette(['Investisseur'], 'investisseur')).toEqual(['Investisseur'])
    expect(ajouterEtiquette(['Retraité'], 'retraite')).toEqual(['Retraité'])
  })

  it('limite la longueur et le nombre', () => {
    expect(ajouterEtiquette([], 'x'.repeat(50))[0]).toHaveLength(30)
    const pleine = Array.from({ length: MAX_ETIQUETTES }, (_, rang) => `étiquette ${rang}`)
    expect(ajouterEtiquette(pleine, 'de trop')).toHaveLength(MAX_ETIQUETTES)
  })
})

describe('preparerContact', () => {
  it('accepte un nom et un téléphone seuls', () => {
    const preparation = preparerContact(brouillon({ nom: ' Fictif ', telephones: ['0639980123'] }))
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        type: 'personne',
        nom: 'Fictif',
        prenom: '',
        telephones: ['+33639980123'],
        courriels: [],
        civilite: null,
        source: null,
        temperature: null,
        recommande_par_id: null,
      },
    })
  })

  it('accepte un nom seul, sans téléphone', () => {
    expect(preparerContact(brouillon({ nom: 'Fictif' })).ok).toBe(true)
  })

  it('exige le nom d’une personne', () => {
    expect(preparerContact(brouillon({ prenom: 'Camille' }))).toEqual({
      ok: false,
      erreurs: { nom: 'Indiquez au moins le nom.' },
    })
  })

  it('exige la raison sociale d’une société, pas le nom', () => {
    expect(preparerContact(brouillon({ type: 'societe', nom: 'Fictif' }))).toEqual({
      ok: false,
      erreurs: { raison_sociale: 'Indiquez le nom de la société.' },
    })
    const preparation = preparerContact(
      brouillon({ type: 'societe', raison_sociale: ' Étude Spécimen ' }),
    )
    expect(preparation).toMatchObject({ ok: true, valeurs: { raison_sociale: 'Étude Spécimen' } })
  })

  it('efface la raison sociale restée dans le formulaire d’une personne', () => {
    const preparation = preparerContact(brouillon({ nom: 'Fictif', raison_sociale: 'Reste' }))
    expect(preparation).toMatchObject({ ok: true, valeurs: { raison_sociale: '' } })
  })

  it('signale chaque téléphone ou courriel invalide à sa place', () => {
    const preparation = preparerContact(
      brouillon({
        nom: 'Fictif',
        telephones: ['06 39 98 01 23', '06 39'],
        courriels: ['pas une adresse', ''],
      }),
    )
    expect(preparation.ok).toBe(false)
    if (preparation.ok) return
    expect(preparation.erreurs.telephones?.[0]).toBeUndefined()
    expect(preparation.erreurs.telephones?.[1]).toMatch(/incomplet/)
    expect(preparation.erreurs.courriels?.[0]).toMatch(/pas reconnue/)
    expect(preparation.erreurs.courriels?.[1]).toBeUndefined()
  })

  it('retire les lignes vides et les répétitions', () => {
    const preparation = preparerContact(
      brouillon({
        nom: 'Fictif',
        telephones: ['', '06 39 98 01 23', '+33 6 39 98 01 23', '01 99 00 12 34'],
        courriels: ['Camille@Exemple.invalid', 'camille@exemple.invalid', ' '],
        etiquettes: ['Investisseur', 'investisseur', '  '],
      }),
    )
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        telephones: ['+33639980123', '+33199001234'],
        courriels: ['camille@exemple.invalid'],
        etiquettes: ['Investisseur'],
      },
    })
  })

  it('ne garde « recommandé par » que pour une recommandation', () => {
    const id = '00000000-0000-4000-8000-000000000002'
    const recommande = preparerContact(
      brouillon({ nom: 'Fictif', source: 'recommandation', recommande_par_id: id }),
    )
    expect(recommande).toMatchObject({ ok: true, valeurs: { recommande_par_id: id } })
    const pige = preparerContact(
      brouillon({
        nom: 'Fictif',
        source: 'pige',
        source_detail: ' Annonce ',
        recommande_par_id: id,
      }),
    )
    expect(pige).toMatchObject({
      ok: true,
      valeurs: { source: 'pige', source_detail: 'Annonce', recommande_par_id: null },
    })
  })

  it('efface le détail quand il n’y a plus de source', () => {
    const preparation = preparerContact(brouillon({ nom: 'Fictif', source_detail: 'Reste' }))
    expect(preparation).toMatchObject({ ok: true, valeurs: { source: null, source_detail: '' } })
  })

  it('ne prépare aucune colonne gérée par la base, ni aucune étape de pipeline', () => {
    const preparation = preparerContact(brouillon({ nom: 'Fictif' }))
    if (!preparation.ok) throw new Error('préparation refusée')
    const colonnes = Object.keys(preparation.valeurs)
    for (const interdite of ['id', 'user_id', 'created_at', 'updated_at', 'archived_at', 'etape']) {
      expect(colonnes).not.toContain(interdite)
    }
  })
})

describe('preparerContact — consentement', () => {
  const AUJOURDHUI = '2026-11-16'
  // Le brouillon part de la même date fixe : le test donne le même résultat quel que soit le jour.
  const preparer = (valeurs: Partial<BrouillonContact>) =>
    preparerContact({ ...brouillonVide(AUJOURDHUI), nom: 'Fictif', ...valeurs }, AUJOURDHUI)

  it('part d’un accord inconnu et de données collectées aujourd’hui', () => {
    const preparation = preparerContact({ ...brouillonVide(AUJOURDHUI), nom: 'Fictif' }, AUJOURDHUI)
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        collecte_date: AUJOURDHUI,
        accord_appel: 'inconnu',
        accord_appel_date: null,
        accord_appel_preuve: '',
        client_existant: false,
        opposition_demarchage: false,
        opposition_demarchage_date: null,
      },
    })
  })

  it('refuse un accord sans date ou sans preuve', () => {
    expect(preparer({ accord_appel: 'oui' })).toEqual({
      ok: false,
      erreurs: {
        accord_appel_date: "Indiquez la date à laquelle l'accord a été donné.",
        accord_appel_preuve:
          "Indiquez comment l'accord a été obtenu : c'est ce qui permettra de le prouver.",
      },
    })
  })

  it('enregistre un accord avec sa date et sa preuve', () => {
    const preparation = preparer({
      accord_appel: 'oui',
      accord_appel_date: '2026-11-02',
      accord_appel_preuve: '  Accord fictif de vive voix ',
    })
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        accord_appel: 'oui',
        accord_appel_date: '2026-11-02',
        accord_appel_preuve: 'Accord fictif de vive voix',
      },
    })
  })

  it('accepte un refus sans date, et efface date et preuve d’un accord redevenu inconnu', () => {
    expect(preparer({ accord_appel: 'non' })).toMatchObject({
      ok: true,
      valeurs: { accord_appel: 'non', accord_appel_date: null },
    })
    const inconnu = preparer({
      accord_appel: 'inconnu',
      accord_appel_date: '2026-11-02',
      accord_appel_preuve: 'Reste de saisie',
    })
    expect(inconnu).toMatchObject({
      ok: true,
      valeurs: { accord_appel_date: null, accord_appel_preuve: '' },
    })
  })

  it('refuse une date dans le futur ou illisible', () => {
    expect(preparer({ collecte_date: '2026-11-17' })).toEqual({
      ok: false,
      erreurs: { collecte_date: 'Cette date est dans le futur.' },
    })
    expect(preparer({ accord_appel: 'non', accord_appel_date: '2026-02-30' })).toEqual({
      ok: false,
      erreurs: { accord_appel_date: "Cette date n'est pas reconnue." },
    })
  })

  it('date du jour une collecte ou une opposition laissée sans date', () => {
    const preparation = preparer({ collecte_date: '', opposition_demarchage: true })
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        collecte_date: AUJOURDHUI,
        opposition_demarchage: true,
        opposition_demarchage_date: AUJOURDHUI,
      },
    })
  })

  it('ne garde pas de date d’opposition sans opposition', () => {
    const preparation = preparer({ opposition_demarchage_date: '2026-10-20' })
    expect(preparation).toMatchObject({ ok: true, valeurs: { opposition_demarchage_date: null } })
  })

  it('n’envoie jamais la date du dernier contact : la base la calcule', () => {
    const preparation = preparer({})
    expect(preparation.ok && 'dernier_contact_le' in preparation.valeurs).toBe(false)
  })
})

describe('brouillonDepuis', () => {
  it('remplit le formulaire avec la fiche, téléphones mis en forme', () => {
    const fiche = contact({
      civilite: 'mme',
      telephones: ['+33639980123'],
      roles: ['acquereur', 'vendeur'],
      source: 'pige',
      temperature: 'chaud',
    })
    expect(brouillonDepuis(fiche)).toMatchObject({
      civilite: 'mme',
      telephones: ['06 39 98 01 23'],
      courriels: [''],
      roles: ['vendeur', 'acquereur'],
      source: 'pige',
      temperature: 'chaud',
      recommande_par_id: '',
    })
  })

  it('redonne les mêmes valeurs après un aller-retour', () => {
    const fiche = contact({
      telephones: ['+33639980123'],
      courriels: ['camille@exemple.invalid'],
      etiquettes: ['Investisseur'],
      roles: ['vendeur'],
      source: 'recommandation',
      recommande_par_id: '00000000-0000-4000-8000-000000000002',
      temperature: 'tiede',
    })
    const preparation = preparerContact(brouillonDepuis(fiche))
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        telephones: fiche.telephones,
        courriels: fiche.courriels,
        etiquettes: fiche.etiquettes,
        roles: fiche.roles,
        source: fiche.source,
        recommande_par_id: fiche.recommande_par_id,
        temperature: fiche.temperature,
      },
    })
  })

  it('ignore une valeur inconnue venue de la base', () => {
    const fiche = contact({ type: 'autre', source: 'inconnue', temperature: 'bouillant' })
    expect(brouillonDepuis(fiche)).toMatchObject({ type: 'personne', source: '', temperature: '' })
  })
})

describe('accès aux données', () => {
  it('lit la première page des contacts actifs, par ordre alphabétique', async () => {
    const { client, appels } = fauxClient({ data: [contact()], error: null, count: 1 })
    const resultat = await chercherContacts(client, { compter: true })
    expect(resultat).toEqual({ ok: true, donnees: { lignes: [contact()], total: 1 } })
    expect(appels).toEqual([
      ['from', 'contacts'],
      ['select', '*', { count: 'exact' }],
      ['is', 'archived_at', null],
      ['order', 'nom_tri', { ascending: true }],
      ['order', 'id', { ascending: true }],
      ['range', 0, 49],
    ])
  })

  it('applique la recherche et les filtres, et lit la suite à partir du rang demandé', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await chercherContacts(client, {
      archives: true,
      debut: 50,
      conditions: [
        { colonne: 'recherche', genre: 'contient', valeur: '0612' },
        { colonne: 'roles', genre: 'comprend', valeur: ['vendeur'] },
        { colonne: 'source', genre: 'egal', valeur: 'pige' },
      ],
    })
    expect(appels).toContainEqual(['not', 'archived_at', 'is', null])
    expect(appels).toContainEqual(['like', 'recherche', '%0612%'])
    expect(appels).toContainEqual(['contains', 'roles', ['"vendeur"']])
    expect(appels).toContainEqual(['eq', 'source', 'pige'])
    expect(appels).toContainEqual(['range', 50, 99])
  })

  it('liste les étiquettes utilisées', async () => {
    const { client, appels } = fauxClient({
      data: [
        { etiquette: 'fictif', nombre: 12 },
        { etiquette: 'investisseur', nombre: 3 },
      ],
      error: null,
    })
    const resultat = await listerEtiquettes(client)
    expect(resultat).toEqual({ ok: true, donnees: ['fictif', 'investisseur'] })
    expect(appels).toEqual([['rpc', 'etiquettes_contacts', {}]])
  })

  it('crée un contact avec les valeurs préparées', async () => {
    const { client, appels } = fauxClient({ data: contact(), error: null })
    const resultat = await creerContact(client, { nom: 'Fictif' })
    expect(resultat.ok).toBe(true)
    expect(appels).toContainEqual(['insert', { nom: 'Fictif' }])
  })

  it('archive en datant la fiche, et transmet une erreur en français', async () => {
    const { client, appels } = fauxClient({ data: contact(), error: null })
    await archiverContact(client, 'abc')
    const maj = appels.find((appel) => appel[0] === 'update')
    expect(maj?.[1]).toEqual({ archived_at: expect.any(String) as string })

    const panne = fauxClient('panne')
    const resultat = await archiverContact(panne.client, 'abc')
    expect(resultat).toMatchObject({ ok: false, erreur: { genre: 'reseau' } })
  })

  it('supprime définitivement par la fonction de la base', async () => {
    const { client, appels } = fauxClient({ data: 2, error: null })
    const resultat = await supprimerContactDefinitivement(client, 'abc')
    expect(resultat).toEqual({ ok: true, donnees: 2 })
    expect(appels).toContainEqual(['rpc', 'supprimer_contact_definitivement', { p_id: 'abc' }])
  })

  it('signale une fiche introuvable quand rien n’a été supprimé', async () => {
    const { client } = fauxClient({ data: 0, error: null })
    const resultat = await supprimerContactDefinitivement(client, 'abc')
    expect(resultat).toMatchObject({ ok: false, erreur: { genre: 'introuvable' } })
  })
})
