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

/** Le contenu du fichier d'export, en clair. `date` : le jour de l'export (`2026-11-16`). */
export function texteExportContact(donnees: DonneesContact, date: string = dateDuJour()): string {
  const { contact, fichesFusionnees, appels, biens, taches } = donnees
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
 * biens dont elle est notée propriétaire (liens retirés compris) et ses tâches.
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
  }
  appels.sort((a, b) => b.created_at.localeCompare(a.created_at))

  return {
    ok: true,
    donnees: { contact: fiche.donnees, fichesFusionnees, appels, biens, taches },
  }
}
