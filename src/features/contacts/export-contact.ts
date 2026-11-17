import type { SupabaseClient } from '@supabase/supabase-js'
import { listerPage, type Resultat } from '../../lib/donnees'
import { dateDuJour, formaterDate } from '../../lib/dates'
import { adresseBien, libelleType } from '../biens/biens'
import { formaterQuotePart, listerBiensDuContact, type BienDuContact } from '../biens/proprietaires'
import {
  libelleMotifAppel,
  listerAppelsSansAccord,
  resumeAccord,
  type AppelSansAccord,
} from './consentement'
import {
  libelleCivilite,
  libelleRole,
  libelleSource,
  lireContact,
  nomComplet,
  TEMPERATURES,
  type Contact,
} from './contacts'
import {
  horaireTache,
  libelleCategorie,
  libelleEtatTache,
  listerTachesLiees,
  type TacheAffichee,
} from '../taches/taches'
import { formaterTelephone } from './telephone'
import {
  libelleEtape,
  libelleEtatProjet,
  libelleMotifPerte,
  libelleTypeMandat,
} from '../projets/pipeline-vendeur'
import { listerProjetsVendeursLies, type ProjetVendeurAffiche } from '../projets/projets-vendeurs'
import { formaterPrix } from '../../lib/nombres'
import {
  horaireActivite,
  lignesCompteRenduVisite,
  listerToutJournalContact,
  titreActivite,
  type ActiviteAffichee,
} from '../activites/activites'
import {
  libelleReaction,
  listerBiensProposes,
  type BienProposeAffiche,
} from '../acquereurs/biens-proposes'
import {
  libelleBudget,
  libelleEtapeAcquereur,
  libelleEtatAcquereur,
  libelleFinancement,
  libelleMotifPerteAcquereur,
  libelleUrgence,
  resumeOrigine,
} from '../acquereurs/pipeline-acquereur'
import {
  listerProjetsAcquereursDuContact,
  type ProjetAcquereurAffiche,
} from '../acquereurs/projets-acquereurs'

/**
 * Export d'un contact (droit d'accès) : un fichier texte lisible par tous, qui contient
 * tout ce que la base sait de la personne. Chaque colonne de la table y figure : un test
 * échoue si une colonne ajoutée plus tard est oubliée ici.
 */

/** Tout ce que la base contient sur une personne. */
export type DonneesContact = {
  contact: Contact
  /** Les fiches en double fusionnées dans celle-ci : elles décrivent la même personne. */
  fichesFusionnees: Contact[]
  /** Les appels passés sans accord, toutes fiches confondues, les plus récents d'abord. */
  appels: AppelSansAccord[]
  /** Les biens dont la personne est ou a été notée propriétaire, toutes fiches confondues. */
  biens: BienDuContact[]
  /** Les tâches et rendez-vous liés à la personne (à faire, faits, annulés). */
  taches: TacheAffichee[]
  /** Le journal d'activité de la personne, retraits compris, le plus récent d'abord. */
  activites: ActiviteAffichee[]
  /** Ses projets de vente, archivés compris. */
  projetsVendeurs: ProjetVendeurAffiche[]
  /**
   * Ses projets d'achat (comme acquéreur ou co-acquéreur), archivés compris, chacun avec les
   * biens qui lui ont été proposés.
   */
  projetsAcquereurs: { affiche: ProjetAcquereurAffiche; proposes: BienProposeAffiche[] }[]
}

const ouiNon = (valeur: boolean) => (valeur ? 'Oui' : 'Non')

type LigneExport = { colonne: keyof Contact; libelle: string; valeur: (c: Contact) => string }

/** Les rubriques du fichier. Une valeur vide est écrite « non renseigné ». */
export const RUBRIQUES_EXPORT: readonly { titre: string; lignes: readonly LigneExport[] }[] = [
  {
    titre: 'Identité',
    lignes: [
      {
        colonne: 'type',
        libelle: 'Type',
        valeur: (c) => (c.type === 'societe' ? 'Société' : 'Personne'),
      },
      {
        colonne: 'civilite',
        libelle: 'Civilité',
        valeur: (c) => libelleCivilite(c.civilite) ?? '',
      },
      { colonne: 'prenom', libelle: 'Prénom', valeur: (c) => c.prenom },
      { colonne: 'nom', libelle: 'Nom', valeur: (c) => c.nom },
      { colonne: 'raison_sociale', libelle: 'Société', valeur: (c) => c.raison_sociale },
    ],
  },
  {
    titre: 'Coordonnées',
    lignes: [
      {
        colonne: 'telephones',
        libelle: 'Téléphones',
        valeur: (c) => c.telephones.map(formaterTelephone).join(', '),
      },
      { colonne: 'courriels', libelle: 'Courriels', valeur: (c) => c.courriels.join(', ') },
      { colonne: 'adresse', libelle: 'Adresse', valeur: (c) => c.adresse },
      { colonne: 'code_postal', libelle: 'Code postal', valeur: (c) => c.code_postal },
      { colonne: 'ville', libelle: 'Ville', valeur: (c) => c.ville },
    ],
  },
  {
    titre: 'Qualification',
    lignes: [
      { colonne: 'roles', libelle: 'Rôles', valeur: (c) => c.roles.map(libelleRole).join(', ') },
      { colonne: 'etiquettes', libelle: 'Étiquettes', valeur: (c) => c.etiquettes.join(', ') },
      {
        colonne: 'temperature',
        libelle: 'Température',
        valeur: (c) => {
          const temperature = TEMPERATURES.find((option) => option.valeur === c.temperature)
          return temperature === undefined ? '' : `${temperature.libelle} (${temperature.detail})`
        },
      },
    ],
  },
  {
    titre: 'Origine des données',
    lignes: [
      { colonne: 'source', libelle: 'Source', valeur: (c) => libelleSource(c.source) ?? '' },
      { colonne: 'source_detail', libelle: 'Détail de la source', valeur: (c) => c.source_detail },
      {
        colonne: 'recommande_par_id',
        libelle: 'Recommandé par',
        // Le nom de la personne qui a recommandé est une donnée d'un tiers : il n'est pas écrit.
        valeur: (c) => (c.recommande_par_id === null ? '' : 'un autre contact du fichier'),
      },
      {
        colonne: 'collecte_origine',
        libelle: 'Comment les données ont été obtenues',
        valeur: (c) => c.collecte_origine,
      },
      {
        colonne: 'collecte_date',
        libelle: 'Date de collecte',
        valeur: (c) => formaterDate(c.collecte_date),
      },
    ],
  },
  {
    titre: 'Consentement',
    lignes: [
      {
        colonne: 'accord_appel',
        libelle: 'Accord pour être appelé',
        valeur: (c) => resumeAccord({ accord_appel: c.accord_appel, accord_appel_date: null }),
      },
      {
        colonne: 'accord_appel_date',
        libelle: "Date de l'accord ou du refus",
        valeur: (c) => formaterDate(c.accord_appel_date),
      },
      {
        colonne: 'accord_appel_preuve',
        libelle: "Comment l'accord a été obtenu",
        valeur: (c) => c.accord_appel_preuve,
      },
      {
        colonne: 'client_existant',
        libelle: 'Client existant',
        valeur: (c) => ouiNon(c.client_existant),
      },
      {
        colonne: 'opposition_demarchage',
        libelle: 'Opposition au démarchage',
        valeur: (c) => ouiNon(c.opposition_demarchage),
      },
      {
        colonne: 'opposition_demarchage_date',
        libelle: "Date de l'opposition",
        valeur: (c) => formaterDate(c.opposition_demarchage_date),
      },
    ],
  },
  {
    titre: 'Suivi de la fiche',
    lignes: [
      {
        colonne: 'dernier_contact_le',
        libelle: 'Dernier contact',
        valeur: (c) => formaterDate(c.dernier_contact_le),
      },
      {
        colonne: 'prochaine_action_le',
        libelle: 'Prochaine action prévue le',
        valeur: (c) => formaterDate(c.prochaine_action_le),
      },
      {
        colonne: 'sans_prochaine_action_le',
        libelle: 'Absence de prochaine action confirmée le',
        valeur: (c) => formaterDate(c.sans_prochaine_action_le),
      },
      {
        colonne: 'created_at',
        libelle: 'Fiche créée le',
        valeur: (c) => formaterDate(c.created_at),
      },
      {
        colonne: 'updated_at',
        libelle: 'Fiche modifiée le',
        valeur: (c) => formaterDate(c.updated_at),
      },
      {
        colonne: 'archived_at',
        libelle: 'Fiche archivée le',
        valeur: (c) => formaterDate(c.archived_at),
      },
      {
        colonne: 'fusionne_dans_id',
        libelle: 'Fiche fusionnée dans une autre',
        valeur: (c) => ouiNon(c.fusionne_dans_id !== null),
      },
    ],
  },
  { titre: 'Notes', lignes: [{ colonne: 'notes', libelle: 'Notes', valeur: (c) => c.notes }] },
]

/**
 * Colonnes volontairement absentes du fichier : identifiants internes, et textes que la
 * base recalcule à partir des autres colonnes (ils ne contiennent rien de plus).
 */
export const COLONNES_NON_EXPORTEES: readonly (keyof Contact)[] = [
  'id',
  'user_id',
  'nom_tri',
  'recherche',
]

function titre(texte: string): string[] {
  return ['', texte.toUpperCase(), '-'.repeat(texte.length)]
}

function lignesFiche(contact: Contact): string[] {
  return RUBRIQUES_EXPORT.flatMap((rubrique) => [
    ...titre(rubrique.titre),
    ...rubrique.lignes.map((ligne) => {
      const valeur = ligne.valeur(contact)
      // Un texte sur plusieurs lignes (les notes) commence sous son libellé.
      const separateur = valeur.includes('\n') ? '\n' : ' '
      return `${ligne.libelle} :${separateur}${valeur === '' ? 'non renseigné' : valeur}`
    }),
  ])
}

/** Un projet de vente sur une ligne, avec tout ce qui est enregistré. */
function resumeProjetExport(
  projet: ProjetVendeurAffiche['projet'],
  bien: ProjetVendeurAffiche['bien'],
) {
  const montant = (valeur: number | null) => (valeur === null ? null : formaterPrix(valeur))
  const date = (valeur: string | null) => (valeur === null ? null : formaterDate(valeur))
  const morceaux: [string, string | null][] = [
    ['bien', bien === null ? null : adresseBien(bien)],
    ['étape', libelleEtape(projet.etape)],
    ['état', libelleEtatProjet(projet.etat)],
    ['ouvert le', formaterDate(projet.created_at)],
    ['motif de vente', projet.motif_vente === '' ? null : projet.motif_vente],
    ['échéance souhaitée', date(projet.echeance_souhaitee)],
    ['prix espéré', montant(projet.prix_espere)],
    ['estimation basse', montant(projet.estimation_basse)],
    ['estimation haute', montant(projet.estimation_haute)],
    ['estimé le', date(projet.estimation_le)],
    ['avis de valeur remis le', date(projet.avis_remis_le)],
    [
      'autres agences consultées',
      projet.agences_consultees === '' ? null : projet.agences_consultees,
    ],
    ['mandat signé ailleurs', projet.mandat_ailleurs ? 'oui' : null],
    ['fin du mandat ailleurs', date(projet.mandat_ailleurs_fin)],
    ['mandat', projet.mandat_type === null ? null : libelleTypeMandat(projet.mandat_type)],
    ['mandat signé le', date(projet.mandat_le)],
    ['à recontacter le', date(projet.recontacter_le)],
    ['motif de perte', projet.motif_perte === null ? null : libelleMotifPerte(projet.motif_perte)],
    ['précision', projet.motif_perte_detail === '' ? null : projet.motif_perte_detail],
    ['notes', projet.notes === '' ? null : projet.notes],
    ['archivé le', date(projet.archived_at)],
  ]
  return morceaux
    .filter((morceau): morceau is [string, string] => morceau[1] !== null)
    .map(([nom, valeur]) => `${nom} : ${valeur}`)
    .join(' — ')
}

/** Un projet d'achat sur une ligne, avec tout ce qui est enregistré. */
function resumeProjetAcquereurExport(
  { projet, contact, coAcquereur, bienOrigine }: ProjetAcquereurAffiche,
  idFiche: string,
) {
  const montant = (valeur: number | null) => (valeur === null ? null : formaterPrix(valeur))
  const date = (valeur: string | null) => (valeur === null ? null : formaterDate(valeur))
  const autre = projet.contact_id === idFiche ? coAcquereur : contact
  const morceaux: [string, string | null][] = [
    ['rôle', projet.contact_id === idFiche ? 'acquéreur' : 'co-acquéreur'],
    [
      projet.contact_id === idFiche ? 'co-acquéreur' : 'acquéreur',
      autre === null ? null : nomComplet(autre),
    ],
    ['étape', libelleEtapeAcquereur(projet.etape)],
    ['état', libelleEtatAcquereur(projet.etat)],
    ['ouvert le', formaterDate(projet.created_at)],
    ['origine', resumeOrigine(projet) || null],
    ['reçue le', date(projet.recue_le)],
    ['bien concerné', bienOrigine === null ? null : adresseBien(bienOrigine)],
    [
      'types',
      projet.types_biens.length === 0 ? null : projet.types_biens.map(libelleType).join(', '),
    ],
    ['secteurs', projet.secteurs.length === 0 ? null : projet.secteurs.join(', ')],
    ['budget', libelleBudget(projet.budget_min, projet.budget_max) || null],
    ['surface minimum', projet.surface_min === null ? null : `${projet.surface_min} m²`],
    ['pièces minimum', projet.pieces_min === null ? null : String(projet.pieces_min)],
    ['indispensable', projet.criteres_indispensables || null],
    ['souhaité', projet.criteres_souhaites || null],
    ['urgence', projet.urgence === null ? null : libelleUrgence(projet.urgence)],
    ['financement', projet.financement === null ? null : libelleFinancement(projet.financement)],
    [
      'accord de principe',
      projet.financement === 'pret' ? (projet.accord_principe ? 'oui' : 'non') : null,
    ],
    ['apport', montant(projet.apport)],
    ['bien à vendre avant', projet.bien_a_vendre ? 'oui' : null],
    ['à recontacter le', date(projet.recontacter_le)],
    [
      'motif de perte',
      projet.motif_perte === null ? null : libelleMotifPerteAcquereur(projet.motif_perte),
    ],
    ['précision', projet.motif_perte_detail || null],
    ['offre acceptée le', date(projet.offre_le)],
    ['notes', projet.notes || null],
    ['archivé le', date(projet.archived_at)],
  ]
  return morceaux
    .filter((morceau): morceau is [string, string] => morceau[1] !== null)
    .map(([nom, valeur]) => `${nom} : ${valeur}`)
    .join(' — ')
}

/** Le contenu du fichier d'export, en clair. `date` : le jour de l'export (`2026-11-16`). */
export function texteExportContact(donnees: DonneesContact, date: string = dateDuJour()): string {
  const { contact, fichesFusionnees, appels, biens, taches, activites, projetsVendeurs } = donnees
  const { projetsAcquereurs } = donnees
  const idsFiches = new Set([contact.id, ...fichesFusionnees.map((fiche) => fiche.id)])
  const lignes = [
    `DONNÉES PERSONNELLES — ${nomComplet(contact)}`,
    `Document établi le ${formaterDate(date)} à partir du fichier de contacts ImmoCRM.`,
    'Il réunit toutes les informations enregistrées sur cette personne.',
    ...lignesFiche(contact),
    ...titre('Appels passés sans accord enregistré'),
  ]
  if (appels.length === 0) lignes.push('Aucun.')
  for (const appel of appels) {
    const morceaux = [
      formaterDate(appel.created_at),
      appel.telephone === '' ? null : formaterTelephone(appel.telephone),
      `motif : ${libelleMotifAppel(appel.motif)}`,
      appel.detail === '' ? null : appel.detail,
    ]
    lignes.push(`- ${morceaux.filter((morceau) => morceau !== null).join(' — ')}`)
  }
  lignes.push(...titre('Biens dont la personne est notée propriétaire'))
  if (biens.length === 0) lignes.push('Aucun.')
  for (const { lien, bien } of biens) {
    const morceaux = [
      adresseBien(bien),
      libelleType(bien.type),
      lien.quote_part === null ? null : `quote-part : ${formaterQuotePart(lien.quote_part)}`,
      lien.archived_at === null ? null : `lien retiré le ${formaterDate(lien.archived_at)}`,
    ]
    lignes.push(`- ${morceaux.filter((morceau) => morceau !== null).join(' — ')}`)
  }
  lignes.push(...titre('Projets de vente'))
  if (projetsVendeurs.length === 0) lignes.push('Aucun.')
  for (const { projet, bien } of projetsVendeurs)
    lignes.push(`- ${resumeProjetExport(projet, bien)}`)
  lignes.push(...titre("Projets d'achat"))
  if (projetsAcquereurs.length === 0) lignes.push('Aucun.')
  for (const { affiche, proposes } of projetsAcquereurs) {
    // La fiche (principale ou fusionnée) qui figure dans ce projet.
    const idFiche =
      [affiche.projet.contact_id, affiche.projet.co_acquereur_id].find(
        (idLie) => idLie !== null && idsFiches.has(idLie),
      ) ?? contact.id
    lignes.push(`- ${resumeProjetAcquereurExport(affiche, idFiche)}`)
    for (const { propose, bien } of proposes) {
      const morceaux = [
        bien === null ? 'bien introuvable' : adresseBien(bien),
        `proposé le ${formaterDate(propose.propose_le)}`,
        libelleReaction(propose.reaction).toLowerCase(),
        propose.raison_refus === '' ? null : `raison : ${propose.raison_refus}`,
      ]
      lignes.push(`  · bien proposé : ${morceaux.filter((m) => m !== null).join(' — ')}`)
    }
  }
  lignes.push(...titre('Tâches et rendez-vous'))
  if (taches.length === 0) lignes.push('Aucun.')
  for (const { tache, bien } of taches) {
    const horaire = horaireTache(tache)
    const morceaux = [
      horaire === '' ? formaterDate(tache.echeance) : `${formaterDate(tache.echeance)}, ${horaire}`,
      libelleCategorie(tache.categorie),
      tache.titre,
      libelleEtatTache(tache.etat).toLowerCase(),
      tache.lieu === '' ? null : `lieu : ${tache.lieu}`,
      bien === null ? null : `bien : ${adresseBien(bien)}`,
      tache.motif === '' ? null : `motif : ${tache.motif}`,
    ]
    lignes.push(`- ${morceaux.filter((morceau) => morceau !== null).join(' — ')}`)
  }
  lignes.push(...titre("Journal d'activité"))
  if (activites.length === 0) lignes.push('Aucune.')
  for (const { activite, bien } of activites) {
    const morceaux = [
      `${formaterDate(`${activite.date_activite}T12:00:00Z`)}, ${horaireActivite(activite)}`,
      titreActivite(activite),
      bien === null ? null : `bien : ${adresseBien(bien)}`,
      activite.archived_at === null
        ? null
        : `retirée du journal le ${formaterDate(activite.archived_at)}`,
      ...lignesCompteRenduVisite(activite).map(
        ([nom, valeur]) => `${nom.toLowerCase()} : ${valeur}`,
      ),
      activite.compte_rendu === '' ? null : `compte rendu : ${activite.compte_rendu}`,
    ]
    lignes.push(`- ${morceaux.filter((morceau) => morceau !== null).join(' — ')}`)
  }
  fichesFusionnees.forEach((fiche, rang) => {
    lignes.push(
      '',
      '='.repeat(60),
      `ANCIENNE FICHE EN DOUBLE ${rang + 1} — ${nomComplet(fiche)}`,
      'Fiche fusionnée dans la fiche principale, conservée telle qu’elle était.',
      ...lignesFiche(fiche),
    )
  })
  return `${lignes.join('\n')}\n`
}

/** Nom du fichier : `donnees-camille-fictif-2026-11-16.txt`, sans accent ni espace. */
export function nomFichierExport(contact: Contact, date: string = dateDuJour()): string {
  const nom = nomComplet(contact)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `donnees-${nom === '' ? 'contact' : nom}-${date}.txt`
}

/**
 * Lit tout ce que la base contient sur une personne : sa fiche, les fiches fusionnées dans
 * celle-ci (y compris les fusions successives), les appels sans accord de chacune et les
 * biens dont elle est notée propriétaire (liens retirés compris), ses tâches et son journal.
 * Chaque table liée aux contacts, créée à une étape suivante, viendra s'ajouter ici.
 */
export async function rassemblerDonneesContact(
  client: SupabaseClient,
  id: string,
): Promise<Resultat<DonneesContact>> {
  const fiche = await lireContact(client, id)
  if (!fiche.ok) return fiche

  const fichesFusionnees: Contact[] = []
  let aExplorer = [id]
  while (aExplorer.length > 0) {
    const suivantes: string[] = []
    for (const idFiche of aExplorer) {
      const page = await listerPage(client, 'contacts', {
        archives: 'avec',
        filtres: [{ colonne: 'fusionne_dans_id', genre: 'egal', valeur: idFiche }],
        tri: [{ colonne: 'created_at' }, { colonne: 'id' }],
        debut: 0,
        taille: 100,
      })
      if (!page.ok) return page
      for (const fusionnee of page.donnees.lignes) {
        // Garde-fou : une fiche n'est lue qu'une fois, même si les liens formaient une boucle.
        if (fusionnee.id === id || fichesFusionnees.some((f) => f.id === fusionnee.id)) continue
        fichesFusionnees.push(fusionnee)
        suivantes.push(fusionnee.id)
      }
    }
    aExplorer = suivantes
  }

  const appels: AppelSansAccord[] = []
  const biens: BienDuContact[] = []
  const taches: TacheAffichee[] = []
  const activites: ActiviteAffichee[] = []
  const projetsVendeurs: ProjetVendeurAffiche[] = []
  const projetsAcquereurs: DonneesContact['projetsAcquereurs'] = []
  for (const idFiche of [id, ...fichesFusionnees.map((f) => f.id)]) {
    const resultat = await listerAppelsSansAccord(client, idFiche)
    if (!resultat.ok) return resultat
    appels.push(...resultat.donnees)
    const possedes = await listerBiensDuContact(client, idFiche, 'avec')
    if (!possedes.ok) return possedes
    biens.push(...possedes.donnees)
    const liees = await listerTachesLiees(client, { contactId: idFiche }, 'toutes')
    if (!liees.ok) return liees
    taches.push(...liees.donnees)
    const journal = await listerToutJournalContact(client, idFiche)
    if (!journal.ok) return journal
    activites.push(...journal.donnees)
    const projets = await listerProjetsVendeursLies(client, { contactId: idFiche }, 'avec')
    if (!projets.ok) return projets
    projetsVendeurs.push(...projets.donnees)
    const achats = await listerProjetsAcquereursDuContact(client, idFiche, 'avec')
    if (!achats.ok) return achats
    for (const affiche of achats.donnees) {
      // Deux fiches fusionnées peuvent figurer dans le même projet : il n'est écrit qu'une fois.
      if (projetsAcquereurs.some((deja) => deja.affiche.id === affiche.id)) continue
      const proposes = await listerBiensProposes(client, affiche.id)
      if (!proposes.ok) return proposes
      projetsAcquereurs.push({ affiche, proposes: proposes.donnees })
    }
  }
  appels.sort((a, b) => b.created_at.localeCompare(a.created_at))
  // Le plus récent d'abord, toutes fiches confondues.
  activites.sort((a, b) =>
    `${b.activite.date_activite} ${b.activite.heure}`.localeCompare(
      `${a.activite.date_activite} ${a.activite.heure}`,
    ),
  )

  return {
    ok: true,
    donnees: {
      contact: fiche.donnees,
      fichesFusionnees,
      appels,
      biens,
      taches,
      activites,
      projetsVendeurs,
      projetsAcquereurs,
    },
  }
}
