import { formaterPrix } from '../../lib/nombres'
import { describe, expect, it } from 'vitest'
import { projetAcquereurEssai } from '../acquereurs/projet-acquereur-essai'
import { activiteEssai } from '../activites/activite-essai'
import { bienEssai } from '../biens/bien-essai'
import { tacheEssai } from '../taches/tache-essai'
import { contactEssai } from './contact-essai'
import {
  COLONNES_NON_EXPORTEES,
  nomFichierExport,
  RUBRIQUES_EXPORT,
  texteExportContact,
} from './export-contact'

const contact = contactEssai({
  civilite: 'mme',
  telephones: ['+33639980001'],
  courriels: ['camille.fictif@exemple.invalid'],
  adresse: "1 rue de l'Exemple",
  code_postal: '00000',
  ville: 'Villefictive',
  notes: 'Première ligne.\nSeconde ligne.',
  roles: ['vendeur'],
  etiquettes: ['fictif'],
  source: 'pige',
  source_detail: 'Annonce fictive',
  temperature: 'chaud',
  collecte_origine: 'Annonce publique fictive',
  collecte_date: '2026-05-04',
  accord_appel: 'oui',
  accord_appel_date: '2026-09-15',
  accord_appel_preuve: 'Accord fictif de vive voix',
})

describe('texteExportContact', () => {
  it('couvre toutes les colonnes de la table des contacts', () => {
    const exportees = RUBRIQUES_EXPORT.flatMap((rubrique) =>
      rubrique.lignes.map((ligne) => ligne.colonne),
    )
    const couvertes = [...exportees, ...COLONNES_NON_EXPORTEES].sort()
    // Une colonne ajoutée à la table doit être ajoutée à l'export (ou écartée en le disant).
    expect(couvertes).toEqual(Object.keys(contactEssai()).sort())
  })

  it('écrit les données en clair, rubrique par rubrique', () => {
    const texte = texteExportContact(
      {
        contact,
        fichesFusionnees: [],
        appels: [],
        biens: [],
        taches: [],
        activites: [],
        projetsVendeurs: [],
        projetsAcquereurs: [],
      },
      '2026-11-16',
    )
    expect(texte).toContain('DONNÉES PERSONNELLES — Camille Fictif')
    expect(texte).toContain('Document établi le 16 novembre 2026')
    expect(texte).toContain('Civilité : Mme')
    expect(texte).toContain('Téléphones : 06 39 98 00 01')
    expect(texte).toContain('Courriels : camille.fictif@exemple.invalid')
    expect(texte).toContain('Température : Chaud (projet dans les 3 mois)')
    expect(texte).toContain('Source : Pige')
    expect(texte).toContain('Date de collecte : 4 mai 2026')
    expect(texte).toContain('Accord pour être appelé : Oui')
    expect(texte).toContain("Date de l'accord ou du refus : 15 septembre 2026")
    expect(texte).toContain("Comment l'accord a été obtenu : Accord fictif de vive voix")
    expect(texte).toContain('Opposition au démarchage : Non')
    expect(texte).toContain('Notes :\nPremière ligne.\nSeconde ligne.')
    expect(texte).toContain('APPELS PASSÉS SANS ACCORD ENREGISTRÉ\n')
    expect(texte).toContain('Aucun.')
  })

  it('écrit « non renseigné » pour une valeur absente', () => {
    const texte = texteExportContact({
      contact: contactEssai(),
      fichesFusionnees: [],
      appels: [],
      biens: [],
      taches: [],
      activites: [],
      projetsVendeurs: [],
      projetsAcquereurs: [],
    })
    expect(texte).toContain('Adresse : non renseigné')
    expect(texte).toContain('Recommandé par : non renseigné')
  })

  it('ne donne pas le nom du contact qui a recommandé (donnée d’un tiers)', () => {
    const texte = texteExportContact({
      contact: contactEssai({ recommande_par_id: '00000000-0000-4000-8000-000000000009' }),
      fichesFusionnees: [],
      appels: [],
      biens: [],
      taches: [],
      activites: [],
      projetsVendeurs: [],
      projetsAcquereurs: [],
    })
    expect(texte).toContain('Recommandé par : un autre contact du fichier')
    expect(texte).not.toContain('00000000-0000-4000-8000-000000000009')
  })

  it('ajoute les appels sans accord et les anciennes fiches fusionnées', () => {
    const texte = texteExportContact({
      contact,
      fichesFusionnees: [contactEssai({ prenom: 'Cam', adresse: '2 avenue du Test' })],
      appels: [
        {
          id: 'a1',
          user_id: 'u',
          created_at: '2026-11-10T10:00:00Z',
          updated_at: '2026-11-10T10:00:00Z',
          archived_at: null,
          contact_id: contact.id,
          motif: 'appel_entrant',
          detail: 'Rappel demandé',
          telephone: '+33639980001',
        },
      ],
      biens: [
        {
          lien: {
            id: 'l1',
            user_id: 'u',
            created_at: '2026-11-10T10:00:00Z',
            updated_at: '2026-11-10T10:00:00Z',
            archived_at: null,
            bien_id: 'b1',
            contact_id: contact.id,
            quote_part: 50,
          },
          bien: bienEssai({ adresse: '3 impasse Fictive', ville: 'Villefictive' }),
        },
      ],
      taches: [
        {
          id: 't1',
          tache: tacheEssai({
            titre: 'Visite du bien',
            categorie: 'visite',
            echeance: '2026-11-20',
            heure: '10:00:00',
            duree: 60,
            lieu: '3 impasse Fictive',
            motif: 'Deuxième visite',
          }),
          contact,
          bien: null,
        },
      ],
      activites: [
        {
          id: 'j1',
          activite: activiteEssai({
            type: 'appel',
            resultat: 'joint',
            date_activite: '2026-11-12',
            heure: '18:05:00',
            duree: 10,
            compte_rendu: 'Projet de vente au printemps',
          }),
          contact,
          bien: bienEssai({ adresse: '3 impasse Fictive', ville: 'Villefictive' }),
        },
        {
          id: 'j2',
          activite: activiteEssai({
            type: 'note',
            date_activite: '2026-11-11',
            archived_at: '2026-11-13T08:00:00Z',
          }),
          contact,
          bien: null,
        },
      ],
      projetsVendeurs: [
        {
          id: 'p1',
          projet: {
            id: 'p1',
            user_id: 'u',
            created_at: '2026-11-01T10:00:00Z',
            updated_at: '2026-11-10T10:00:00Z',
            archived_at: null,
            contact_id: contact.id,
            bien_id: 'b1',
            etape: 'decouverte',
            etape_le: '2026-11-05',
            etat: 'perdu',
            motif_vente: 'Mutation',
            echeance_souhaitee: '2027-06-30',
            prix_espere: 300000,
            estimation_basse: null,
            estimation_haute: null,
            estimation_le: null,
            avis_remis_le: null,
            agences_consultees: '',
            mandat_ailleurs: true,
            mandat_ailleurs_fin: '2027-03-01',
            mandat_type: null,
            mandat_le: null,
            recontacter_le: null,
            motif_perte: 'mandat_ailleurs',
            motif_perte_detail: '',
            notes: '',
          },
          contact,
          bien: bienEssai({ adresse: '3 impasse Fictive', ville: 'Villefictive' }),
          prochaine: null,
        },
      ],
      projetsAcquereurs: [],
    })
    expect(texte).toContain('PROJETS DE VENTE\n')
    expect(texte).toContain(
      `- bien : 3 impasse Fictive, Villefictive — étape : Découverte — état : Perdu — ouvert le : 1 novembre 2026 — motif de vente : Mutation — échéance souhaitée : 30 juin 2027 — prix espéré : ${formaterPrix(300000)} — mandat signé ailleurs : oui — fin du mandat ailleurs : 1 mars 2027 — motif de perte : Mandat signé ailleurs`,
    )
    expect(texte).toContain("JOURNAL D'ACTIVITÉ\n")
    expect(texte).toContain(
      '- 12 novembre 2026, 18 h 05 · 10 min — Appel · Joint — bien : 3 impasse Fictive, Villefictive — compte rendu : Projet de vente au printemps',
    )
    expect(texte).toContain(
      '- 11 novembre 2026, 10 h — Note — retirée du journal le 13 novembre 2026',
    )
    expect(texte).toContain('TÂCHES ET RENDEZ-VOUS\n')
    expect(texte).toContain(
      '- 20 novembre 2026, 10 h – 11 h — Visite — Visite du bien — à faire — lieu : 3 impasse Fictive — motif : Deuxième visite',
    )
    expect(texte).toContain('- 3 impasse Fictive, Villefictive — Ancien — quote-part : 50 %')
    expect(texte).toContain(
      '- 10 novembre 2026 — 06 39 98 00 01 — motif : Appel entrant — Rappel demandé',
    )
    expect(texte).toContain('ANCIENNE FICHE EN DOUBLE 1 — Cam Fictif')
    expect(texte).toContain('Adresse : 2 avenue du Test')
  })
})

describe('nomFichierExport', () => {
  it('fabrique un nom de fichier sans accent ni espace', () => {
    expect(nomFichierExport(contactEssai({ prenom: 'Zoé', nom: "D'Exemple" }), '2026-11-16')).toBe(
      'donnees-zoe-d-exemple-2026-11-16.txt',
    )
    expect(
      nomFichierExport(
        contactEssai({ type: 'societe', raison_sociale: 'Étude Factice & associés' }),
        '2026-11-16',
      ),
    ).toBe('donnees-etude-factice-associes-2026-11-16.txt')
  })
})

describe('projets d’achat dans l’export', () => {
  const vide = {
    contact,
    fichesFusionnees: [],
    appels: [],
    biens: [],
    taches: [],
    activites: [],
    projetsVendeurs: [],
  }
  const coAcquereur = contactEssai({ id: 'c2', prenom: 'Dominique', nom: 'Exemple' })

  it('écrit la recherche, le rôle de la personne et les biens proposés', () => {
    const projet = projetAcquereurEssai({
      contact_id: contact.id,
      co_acquereur_id: 'c2',
      etape: 'selection',
      origine: 'portail',
      portail: 'Leboncoin',
      types_biens: ['ancien'],
      secteurs: ['Villefictive'],
      budget_max: 280000,
      financement: 'pret',
      accord_principe: true,
    })
    const texte = texteExportContact({
      ...vide,
      projetsAcquereurs: [
        {
          affiche: {
            id: projet.id,
            projet,
            contact,
            coAcquereur,
            bienOrigine: null,
            prochaine: null,
            nbProposes: 1,
          },
          proposes: [
            {
              id: 'bp1',
              propose: {
                id: 'bp1',
                user_id: 'u',
                created_at: '2026-11-12T10:00:00Z',
                updated_at: '2026-11-12T10:00:00Z',
                archived_at: null,
                projet_acquereur_id: projet.id,
                bien_id: 'b1',
                propose_le: '2026-11-12',
                reaction: 'refuse',
                raison_refus: 'Trop de travaux',
              },
              bien: bienEssai({ adresse: '3 impasse Fictive', ville: 'Villefictive' }),
            },
          ],
        },
      ],
    })
    expect(texte).toContain("PROJETS D'ACHAT\n")
    expect(texte).toContain(
      'rôle : acquéreur — co-acquéreur : Dominique Exemple — étape : Sélection',
    )
    expect(texte).toContain('origine : Portail Leboncoin')
    expect(texte).toContain('accord de principe : oui')
    expect(texte).toContain(
      '  · bien proposé : 3 impasse Fictive, Villefictive — proposé le 12 novembre 2026 — refusé — raison : Trop de travaux',
    )
  })

  it('indique le rôle de co-acquéreur', () => {
    const projet = projetAcquereurEssai({ contact_id: 'c2', co_acquereur_id: contact.id })
    const texte = texteExportContact({
      ...vide,
      projetsAcquereurs: [
        {
          affiche: {
            id: projet.id,
            projet,
            contact: coAcquereur,
            coAcquereur: contact,
            bienOrigine: null,
            prochaine: null,
            nbProposes: 0,
          },
          proposes: [],
        },
      ],
    })
    expect(texte).toContain('rôle : co-acquéreur — acquéreur : Dominique Exemple')
  })

  it('écrit le compte rendu structuré d’une visite', () => {
    const texte = texteExportContact({
      ...vide,
      projetsAcquereurs: [],
      activites: [
        {
          id: 'v1',
          activite: activiteEssai({
            type: 'visite',
            date_activite: '2026-11-14',
            visite_points_positifs: 'Lumineux',
            visite_interet: 'fort',
          }),
          contact,
          bien: null,
        },
      ],
    })
    expect(texte).toContain('Visite — points positifs : Lumineux — intérêt : Fort')
  })
})
